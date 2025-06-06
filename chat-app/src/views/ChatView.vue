<template>
  <div class="chat-container">
    <div class="chat-layout">
      <!-- 侧边栏 - 会话列表 -->
      <SessionList
        :sessions="sessions"
        :current-session-id="currentSessionId"
        :loading="loadingSessions"
        @session-selected="selectSession"
        @session-created="handleSessionCreated"
        @session-deleted="handleSessionDeleted"
        @sessions-updated="fetchSessions"
        @edit-session="handleEditSession"
        @logout="handleLogout"
      />
      
      <!-- 主内容区 - 聊天界面 -->
      <ChatMain
        :current-session="currentSession"
        :current-session-id="currentSessionId"
        @logout="handleLogout"
        @sessions-updated="fetchSessions"
      />
    </div>
    
    <!-- 编辑会话标题对话框 -->
    <EditSessionDialog
      v-model:visible="showEditDialog"
      :session="sessionToEdit"
      @confirm="updateSessionTitle"
    />
  </div>
</template>

<script setup lang="ts">
import { createApp, ref, watch, nextTick, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import SessionList from '@/components/chat/SessionList.vue';
import ChatMain from '@/components/chat/ChatMain.vue';
import EditSessionDialog from '@/components/chat/EditSessionDialog.vue';
import ChatService from '@/services/ChatService';
import type { Session } from '@/types/chat';
import { MessagePlugin } from 'tdesign-vue-next';

// 状态变量
const router = useRouter();
const sessions = ref<Session[]>([]);
const currentSessionId = ref<string | null>(null);
const loadingSessions = ref(false);
const showEditDialog = ref(false);
const sessionToEdit = ref<Session | null>(null);

// 计算属性
const currentSession = computed(() => {
  return sessions.value.find(session => String(session.id) === currentSessionId.value) || null;
});

// 生命周期钩子
onMounted(async () => {
  // 检查是否已登录
  const token = localStorage.getItem('token');
  
  if (!token) {
    router.push('/login');
    return;
  }
  
  try {
    await fetchSessions();
    
    // 如果有会话，选择第一个
    if (sessions.value.length > 0) {
      selectSession(String(sessions.value[0].id));
    }
  } catch (error) {
    console.error('Error in ChatView onMounted:', error);
    // 如果发生错误，可能是token无效，重定向到登录页面
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  }
})

// 方法
// 获取会话列表
const fetchSessions = async () => {
  loadingSessions.value = true;
  
  try {
    sessions.value = await ChatService.fetchSessions();
    
    // 如果没有会话，自动创建一个新会话
    if (sessions.value.length === 0) {
      console.log('No sessions found, creating a default session');
      try {
        const newSession = await ChatService.createSession('新会话');
        sessions.value.push(newSession);
        selectSession(String(newSession.id));
      } catch (createError) {
        console.error('Failed to create default session:', createError);
      }
    }
  } catch (error) {
    console.error('获取会话列表失败:', error);
    MessagePlugin.error({
      content: '获取会话列表失败',
      duration: 3000,
      closeBtn: true,
    });
  } finally {
    loadingSessions.value = false;
  }
};

// 选择会话
const selectSession = (sessionId: string) => {
  currentSessionId.value = sessionId;
};

// 处理创建新会话
const handleSessionCreated = (session: Session) => {
  sessions.value.unshift(session);
  selectSession(String(session.id));
};

// 处理删除会话
const handleSessionDeleted = (sessionId: string) => {
  console.log('Parent received session-deleted event for ID:', sessionId);
  
  // Convert sessionId to string for comparison (in case it's a number)
  const sessionIdStr = String(sessionId);
  
  // Filter out the deleted session
  const previousLength = sessions.value.length;
  sessions.value = sessions.value.filter(s => String(s.id) !== sessionIdStr);
  console.log(`Sessions filtered: removed ${previousLength - sessions.value.length} session(s)`);
  
  // 如果删除的是当前选中的会话，则选择另一个会话
  if (currentSessionId.value === sessionIdStr) {
    console.log('Current session was deleted, selecting a new one');
    if (sessions.value.length > 0) {
      const newSessionId = String(sessions.value[0].id);
      console.log('Selecting new session:', newSessionId);
      selectSession(newSessionId);
    } else {
      console.log('No sessions left, setting currentSessionId to null');
      currentSessionId.value = null;
    }
  }
};

// 处理编辑会话
const handleEditSession = (session: Session) => {
  sessionToEdit.value = session;
  showEditDialog.value = true;
};

// 更新会话标题
const updateSessionTitle = async (sessionId: string, title: string) => {
  try {
    await ChatService.updateSessionTitle(sessionId, title);
    
    // 显示更新成功提示
    MessagePlugin.success({
      content: '会话标题已更新',
      duration: 2000,
      closeBtn: true,
    });
    
    // 更新本地会话标题
    const session = sessions.value.find(s => String(s.id) === sessionId);
    if (session) {
      session.title = title;
    }
  } catch (error) {
    console.error('更新会话标题失败:', error);
    MessagePlugin.error({
      content: '更新会话标题失败',
      duration: 3000,
      closeBtn: true,
    });
  }
};

// 处理退出登录
const handleLogout = () => {
  localStorage.removeItem('token');
  router.push('/login');
};
</script>

<style scoped>
.chat-container {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f5f7f9;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.chat-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
}
</style>
