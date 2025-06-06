<template>
  <div class="chat-sidebar">
    <!-- 上部区域 - 新建会话类型 -->
    <div class="sidebar-section sidebar-header">
      <h3 class="section-title">新建会话</h3>
      <div class="session-type-buttons">
        <button class="session-type-btn" @click="createNewSession('general')">
          <div class="btn-content">
            <span class="btn-icon">💬</span>
            <span class="btn-text">通用对话</span>
          </div>
          <span class="btn-arrow">→</span>
        </button>
        <button class="session-type-btn" @click="createNewSession('history')">
          <div class="btn-content">
            <span class="btn-icon">📚</span>
            <span class="btn-text">教材知识点答疑</span>
          </div>
          <span class="btn-arrow">→</span>
        </button>
        <button class="session-type-btn" @click="createNewSession('math')">
          <div class="btn-content">
            <span class="btn-icon">📊</span>
            <span class="btn-text">数理习题解答</span>
          </div>
          <span class="btn-arrow">→</span>
        </button>
        <button class="session-type-btn" @click="createNewSession('english')">
          <div class="btn-content">
            <span class="btn-icon">✏️</span>
            <span class="btn-text">英语作文批改</span>
          </div>
          <span class="btn-arrow">→</span>
        </button>
      </div>
    </div>
    
    <!-- 中间区域 - 会话列表 -->
    <div class="sidebar-section session-list-section">
      <h3 class="section-title">会话历史</h3>
      <div class="session-list">
        <div v-if="loading" class="loading-indicator">加载中...</div>
        
        <div 
          v-for="session in sessions" 
          :key="session.id"
          :class="['session-item', { active: currentSessionId === String(session.id) }]"
          @click="selectSession(String(session.id))"
        >
          <div class="session-title">{{ session.title || '新会话' }}</div>
          <div class="session-time">{{ formatDate(session.updated_at) }}</div>
          <div class="session-menu">
            <div class="menu-dots" @click.stop="toggleMenu(Number(session.id))">⋮</div>
            <div v-if="activeMenuId === Number(session.id)" class="menu-dropdown">
              <div class="menu-item edit" @click.stop="editSession(session)">
                <span class="menu-icon">✏️</span>
                <span>编辑</span>
              </div>
              <div class="menu-item delete" @click.stop="deleteSession(session)">
                <span class="menu-icon">🗑️</span>
                <span>删除</span>
              </div>
            </div>
          </div>
        </div>
        
        <div v-if="sessions.length === 0 && !loading" class="empty-state">
          暂无会话记录
        </div>
      </div>
    </div>
    
    <!-- 底部区域 - 用户管理 -->
    <div class="sidebar-section sidebar-footer">
      <button class="user-action-btn logout-btn" @click="logout">
        <span class="btn-icon">🚪</span>
        <span>退出登录</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits, toRefs } from 'vue';
import { format } from 'date-fns';
import type { Session } from '@/types/chat';
import ChatService from '@/services/ChatService';
import { DialogPlugin, MessagePlugin } from 'tdesign-vue-next';

const props = defineProps<{
  sessions: Session[];
  currentSessionId: string | null;
  loading: boolean;
}>();

const emit = defineEmits<{
  (e: 'session-selected', sessionId: string): void;
  (e: 'session-created', session: Session): void;
  (e: 'session-deleted', sessionId: string): void;
  (e: 'edit-session', session: Session): void;
  (e: 'sessions-updated'): void;
  (e: 'logout'): void;
}>();

const { sessions, currentSessionId, loading } = toRefs(props);

// For dropdown menu management
const activeMenuId = ref<number | null>(null);

// Toggle menu dropdown
const toggleMenu = (sessionId: number) => {
  if (activeMenuId.value === sessionId) {
    activeMenuId.value = null;
  } else {
    activeMenuId.value = sessionId;
  }
};

// Close menu when clicking outside
const closeAllMenus = () => {
  activeMenuId.value = null;
};

// Add event listener to close menus when clicking outside
if (typeof window !== 'undefined') {
  window.addEventListener('click', closeAllMenus);
}

// Create a new session with optional type
const createNewSession = async (type: string = 'general') => {
  try {
    // Create a session with a title based on the type
    let title = '';
    let chat_type = type;
    switch (type) {
      case 'history':
        title = '教材知识点答疑';
        break;
      case 'math':
        title = '数理习题解答';
        break;
      case 'english':
        title = '英语作文批改';
        break;
      default:
        title = '通用对话';
    }
    
    const newSession = await ChatService.createSession(title, chat_type);
    emit('session-created', newSession);
    
    // 显示创建成功的提示
    MessagePlugin.success({
      content: '新会话已创建',
      duration: 2000,
      closeBtn: true,
    });
  } catch (error) {
    console.error('创建会话失败:', error);
    MessagePlugin.error({
      content: '创建会话失败',
      duration: 3000,
      closeBtn: true,
    });
  }
};

// Handle logout
const logout = () => {
  emit('logout');
};

// Select a session
const selectSession = (sessionId: string) => {
  emit('session-selected', sessionId);
};

// Delete a session
const deleteSession = async (session: Session) => {
  const dialog = DialogPlugin.confirm({
    header: '删除会话',
    body: '确定要删除这个会话吗？',
    confirmBtn: '删除',
    cancelBtn: '取消',
    closeOnEscKeydown: true,
    closeOnOverlayClick: true,
    theme: 'warning',
    onConfirm: async () => {
      try {
        // Get the session ID before deletion
        const sessionId = String(session.id);
        console.log('Attempting to delete session:', sessionId);
        
        // 关闭确认对话框
        dialog.hide();
        
        // Call API to delete the session
        await ChatService.deleteSession(sessionId);
        console.log('Session deleted successfully:', sessionId);
        
        // 显示删除成功的提示
        MessagePlugin.success({
          content: '会话已成功删除',
          duration: 2000,
          closeBtn: true,
        });
        
        // Force a refresh of the sessions list
        await emit('sessions-updated');
        
        // Notify parent that session was deleted
        emit('session-deleted', sessionId);
        
        // If the deleted session was the current one, select another session if available
        if (currentSessionId.value === sessionId) {
          console.log('Current session was deleted, selecting a new session');
          // Wait a moment for the sessions list to update
          setTimeout(() => {
            if (props.sessions.length > 0) {
              const nextSession = props.sessions.find(s => String(s.id) !== sessionId);
              if (nextSession) {
                console.log('Selecting new session:', nextSession.id);
                emit('session-selected', String(nextSession.id));
              } else if (props.sessions[0]) {
                console.log('Selecting first available session:', props.sessions[0].id);
                emit('session-selected', String(props.sessions[0].id));
              }
            }
          }, 100);
        }
      } catch (error) {
        console.error('删除会话失败:', error);
        MessagePlugin.error({
          content: '删除会话失败',
          duration: 3000,
          closeBtn: true,
        });
      }
    },
  });
};

// Edit a session
const editSession = (session: Session) => {
  emit('edit-session', session);
};

// Format date for display
const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffDay > 0) {
    return format(date, 'yyyy-MM-dd');
  } else if (diffHour > 0) {
    return `${diffHour}小时前`;
  } else if (diffMin > 0) {
    return `${diffMin}分钟前`;
  } else {
    return '刚刚';
  }
};
</script>

<style scoped>
.chat-sidebar {
  width: 280px;
  background-color: #f0f2f5;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e0e0e0;
  height: 100%;
}

/* 共用的侧边栏区域样式 */
.sidebar-section {
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.section-title {
  font-size: 16px;
  font-weight: 500;
  margin: 0 0 12px 0;
  color: #333;
}

/* 顶部区域 - 新建会话类型 */
.sidebar-header {
  padding-bottom: 16px;
}

.session-type-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.session-type-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.session-type-btn:hover {
  background-color: #f0f7ff;
  border-color: #1890ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.btn-content {
  display: flex;
  align-items: center;
}

.btn-icon {
  font-size: 20px;
  margin-right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.btn-text {
  font-size: 14px;
  font-weight: 500;
}

.btn-arrow {
  font-size: 18px;
  color: #999;
  transition: all 0.3s;
}

.session-type-btn:hover .btn-arrow {
  color: #1890ff;
  transform: translateX(4px);
}

/* 中间区域 - 会话列表 */
.session-list-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.session-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 0 8px 0;
}

.session-item {
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: background-color 0.3s;
  position: relative;
}

.session-item:hover {
  background-color: #e6f7ff;
}

.session-item.active {
  background-color: #e6f7ff;
  border-left: 3px solid #1890ff;
}

.session-title {
  font-weight: 500;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.session-time {
  font-size: 12px;
  color: #999;
}

/* 三点菜单样式 */
.session-menu {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
}

.menu-dots {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: #999;
  cursor: pointer;
  border-radius: 50%;
  visibility: hidden;
  opacity: 0;
  transition: all 0.2s ease;
}

.session-item:hover .menu-dots {
  visibility: visible;
  opacity: 1;
}

.menu-dots:hover {
  background-color: rgba(0, 0, 0, 0.05);
  color: #1890ff;
}

.menu-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  width: 100px;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  z-index: 100;
}

.menu-item {
  padding: 8px 12px;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s;
}

.menu-item:hover {
  background-color: #f5f5f5;
}

.menu-item.delete:hover {
  color: #ff4d4f;
  background-color: #fff1f0;
}

.menu-icon {
  font-size: 14px;
  margin-right: 8px;
  display: inline-flex;
  align-items: center;
}

.loading-indicator {
  padding: 16px;
  text-align: center;
  color: #999;
}

.empty-state {
  padding: 32px 16px;
  text-align: center;
  color: #999;
}

/* 底部区域 - 用户管理 */
.sidebar-footer {
  padding: 16px;
  border-top: 1px solid #e0e0e0;
  border-bottom: none;
  margin-top: auto;
}

.user-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 10px;
  background-color: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
}

.logout-btn {
  color: #ff4d4f;
}

.logout-btn:hover {
  background-color: #fff1f0;
  border-color: #ff4d4f;
}
</style>
