<template>
  <div class="messages-container" ref="messagesContainer">
    <div class="messages-content">
      <t-chat-loading v-if="loading" />
      
      <div v-if="!messages.length" class="empty-state">
        请提出您的知识问题，我将尽力解答
      </div>
      
      <template v-else>
        <!-- 测试消息数据 -->
        <div class="debug-info" v-if="false">
          <pre>{{ JSON.stringify(messages, null, 2) }}</pre>
        </div>
        
        <div v-for="(message, index) in messages" :key="index" class="message-wrapper">
          <t-chat-item 
            :avatar="message.role === 'user' ? userAvatar : aiAvatar"
            :name="message.role === 'user' ? '你' : '知识助手'"
            :datetime="formatDate(message.created_at)"
            align="left"
          >
          <template #content>
            <!-- 显示消息内容 (放在图片上方) -->
            <div
              class="rendered-html"
              v-if="message.role === 'assistant'"
              v-html="renderMarkdownWithMathJax(message.content)"
            ></div>
            <div v-else class="message-text">
              {{ message.content }}
            </div>
            
            <!-- 显示图片（如果有），但只为用户消息显示 -->
            <div 
              v-if="message.image_path && message.image_path !== 'null' && message.role === 'user'" 
              class="message-image-container"
            >
              <img 
                :src="getImageUrl(message.image_path)" 
                alt="上传的图片" 
                class="message-image" 
                @error="handleImageError"
                loading="lazy"
              />
            </div>
          </template>
          </t-chat-item>
        </div>
      </template>
      
      <!-- 留出空间以确保内容不被输入框遮挡 -->
      <div class="messages-spacer"></div>
    </div>
    
    <!-- 浮动在底部的消息输入框 -->
    <div class="chat-input-wrapper">
      <!-- 替换 t-chat-sender 为简单的输入组件 -->
      <div class="simple-chat-input">
        <textarea 
          v-model="messageInput" 
          class="message-textarea"
          placeholder="请输入您的知识问题..." 
          :disabled="sending || uploadingImage"
          @keydown.enter.prevent="handleEnterPress"
        ></textarea>
        
        <div class="input-actions">
          <!-- 图片上传按钮 -->
          <label for="image-upload" class="image-upload-btn" :class="{ 'disabled': isImageUploadDisabled }">
            <t-icon name="image" />
            <span class="upload-text">{{ uploadingImage ? '正在上传...' : isImageUploadDisabled && props.chatType === 'history' ? '历史模式禁止上传' : '上传图片' }}</span>
          </label>
          <input 
            id="image-upload" 
            type="file" 
            accept="image/*" 
            class="hidden-file-input" 
            @change="simplifiedFileSelect"
            :disabled="isImageUploadDisabled"
          />
          
          <!-- 发送按钮 -->
          <t-button 
            theme="primary" 
            :disabled="!messageInput.trim() && !selectedImage || sending || uploadingImage"
            @click="simplifiedSend"
          >
            发送
          </t-button>
        </div>
      </div>
      
      <!-- 预览已选择的图片 -->
      <div v-if="selectedImage" class="selected-image-preview">
        <img :src="selectedImagePreview" alt="预览图片" class="preview-image" />
        <t-button theme="danger" variant="text" size="small" @click="clearSelectedImage" :disabled="uploadingImage">
          <template #icon><t-icon name="close" /></template>
        </t-button>
        <div v-if="uploadingImage" class="upload-overlay">
          <div class="upload-spinner"></div>
          <span>上传中...</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { renderMarkdownWithMathJax } from '@/utils/renderMarkdownWithMathJax'
import { ref, defineProps, defineExpose, defineEmits, onMounted, watch, nextTick, computed } from 'vue';
import { format } from 'date-fns';
import type { Message } from '@/types/message';
import { ChatItem as TChatItem, ChatContent as TChatContent, ChatLoading as TChatLoading, ChatSender as TChatSender } from '@tdesign-vue-next/chat';
import { Button as TButton, Icon as TIcon } from 'tdesign-vue-next';
import { messagesApi } from '@/api/messages';

const props = defineProps<{
  messages: Message[];
  loading: boolean;
  sending?: boolean;
  sessionId?: string | null;
  chatType?: string;
}>();

const emit = defineEmits<{
  (e: 'send-message', content: string, imageFile?: File | null): void;
}>();

const messageInput = ref('');
const sending = ref(props.sending || false);
const sessionId = ref(props.sessionId || null);

// 添加watcher以更新sessionId
watch(() => props.sessionId, (newSessionId) => {
  sessionId.value = newSessionId ?? null;
  console.log('[MessageList] SessionId updated:', newSessionId);
}, { immediate: true });

// 图片上传相关状态
const selectedImage = ref<File | null>(null);
const uploadingImage = ref(false);
const selectedImagePreview = computed(() => {
  try {
    if (!selectedImage.value) {
      return '';
    }
    
    // 尝试使用URL.createObjectURL创建对象URL
    try {
      // 检查文件对象是否有效
      if (selectedImage.value instanceof File && 
          typeof selectedImage.value.size === 'number' && 
          selectedImage.value.size > 0) {
        const objectUrl = URL.createObjectURL(selectedImage.value);
        console.log('[MessageList] 成功创建对象URL:', objectUrl.substring(0, 30) + '...');
        return objectUrl;
      } else {
        console.warn('[MessageList] 无效的文件对象:', selectedImage.value);
      }
    } catch (objUrlError) {
      console.error('[MessageList] 创建对象URL失败:', objUrlError);
    }
    
    // 如果创建URL失败，尝试使用文件扩展名来返回一个占位符
    if (selectedImage.value.name) {
      const fileName = selectedImage.value.name;
      const extension = fileName.split('.').pop()?.toLowerCase();
      
      if (extension && ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(extension)) {
        console.log('[MessageList] 使用占位符图片替代实际预览');
        // 使用一个简单的数据URL作为占位符
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNlMWYzZmYiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSIxNnB4IiBmaWxsPSIjMDZiNmQzIj5JbWFnZSBQcmV2aWV3PC90ZXh0Pjwvc3ZnPg==';
      }
    }
    
    console.warn('[MessageList] 无法创建有效的图片预览');
    return '';
  } catch (error) {
    console.error('[MessageList] 创建图片预览出错:', error);
    return '';
  }
});

// 添加计算属性来检查是否应该禁用图片上传
const isImageUploadDisabled = computed(() => {
  return props.chatType === 'history' || uploadingImage.value;
});

// 简化版的文件选择处理
const simplifiedFileSelect = (event: Event) => {
  // 如果是历史模式，不允许上传图片
  if (props.chatType === 'history') {
    console.log('[MessageList] 历史模式禁止上传图片');
    return;
  }
  
  const input = event.target as HTMLInputElement;
  
  if (!input.files || input.files.length === 0) {
    console.log('[MessageList] 没有选择文件');
    return;
  }
  
  const file = input.files[0];
  console.log('[MessageList] 选择了文件:', file.name);
  
  // 更强的文件验证
  // 验证文件大小
  if (file.size > 10 * 1024 * 1024) { // 10MB
    console.warn('[MessageList] 文件太大:', file.size);
    alert('图片太大，请选择小于10MB的图片');
    return;
  }
  
  // 验证文件类型
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
  
  // 宽松检查文件类型 - 有些浏览器会返回不同的MIME类型
  let isValidType = false;
  
  // 检查MIME类型
  if (validTypes.includes(file.type)) {
    isValidType = true;
  }
  // 检查文件扩展名作为备选
  else if (file.name) {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension && ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(extension)) {
      isValidType = true;
      console.log(`[MessageList] 基于文件扩展名验证通过: ${extension}`);
    }
  }
  
  if (!isValidType) {
    console.warn('[MessageList] 不支持的文件类型:', file.type);
    alert('请选择支持的图片格式：JPEG、PNG、GIF、WEBP或BMP');
    return;
  }
  
  // 直接设置选中的图片
  selectedImage.value = file;
  
  // 重置文件输入框，允许重新选择同一个文件
  input.value = '';
};

// 回车键处理
const handleEnterPress = (event: KeyboardEvent) => {
  // 如果同时按下了Shift，则添加换行而不是发送
  if (event.shiftKey) {
    return;
  }
  
  // 否则发送消息
  simplifiedSend();
};

// 简化版的发送处理
const simplifiedSend = () => {
  if (sending.value || !sessionId.value || uploadingImage.value) {
    // 提供更详细的错误信息
    if (!sessionId.value) {
      console.warn('[MessageList] 无法发送消息: 没有有效的会话ID');
      alert('没有选择聊天会话，请先创建或选择一个会话');
    } else if (sending.value) {
      console.warn('[MessageList] 无法发送消息: 正在发送中');
    } else if (uploadingImage.value) {
      console.warn('[MessageList] 无法发送消息: 图片正在上传中');
    } else {
      console.warn('[MessageList] 无法发送消息: 未知原因');
    }
    return;
  }
  
  // 从响应式引用中安全获取值
  const messageInputValue = messageInput.value || '';
  const messageText = messageInputValue.trim();
  const hasImage = !!selectedImage.value;
  
  // 如果是历史模式且有图片，禁止发送
  if (props.chatType === 'history' && hasImage) {
    console.warn('[MessageList] 历史模式禁止发送图片');
    alert('历史聊天模式不支持图片上传');
    clearSelectedImage();
    return;
  }
  
  if (!messageText && !hasImage) {
    console.warn('[MessageList] 没有内容可发送');
    return;
  }
  
  console.log('[MessageList] 发送消息', { 
    text: messageText, 
    hasImage: hasImage 
  });
  
  if (hasImage) {
    uploadingImage.value = true;
  }
  
  // 发送消息
  emit('send-message', messageText, selectedImage.value);
  
  // 清空输入框和图片
  messageInput.value = '';
  
  // 注意: 不要在这里清除图片，因为上传可能需要时间
  // 应该在上传完成后由父组件触发清除
  if (!hasImage) {
    clearSelectedImage();
  }
};

// 清除已选择的图片
const clearSelectedImage = () => {
  try {
    if (selectedImagePreview.value) {
      try {
        URL.revokeObjectURL(selectedImagePreview.value);
      } catch (error) {
        console.error('[MessageList] Error revoking object URL:', error);
      }
    }
    
    // Always reset the selectedImage ref
    selectedImage.value = null;
    console.log('[MessageList] Selected image cleared');
  } catch (error) {
    console.error('[MessageList] Error in clearSelectedImage:', error);
    // Force reset the selectedImage ref
    selectedImage.value = null;
  }
};

// 获取图片URL
const getImageUrl = (imagePath: string) => {
  try {
    if (!imagePath) {
      console.warn('[MessageList] 空图片路径');
      return ''; // 返回空路径，模板中可以处理不显示
    }
    
    // 如果是完整URL，直接返回
    if (imagePath.startsWith('http') || imagePath.startsWith('data:')) {
      return imagePath;
    }
    
    // 如果路径以/开头，不添加额外斜杠
    if (imagePath.startsWith('/')) {
      return `${import.meta.env.VITE_API_BASE_URL}${imagePath}`;
    }
    
    // 否则确保路径有正确的斜杠拼接
    return `${import.meta.env.VITE_API_BASE_URL}/${imagePath}`;
  } catch (error) {
    console.error('[MessageList] 处理图片URL错误:', error);
    return ''; // 返回空以避免显示损坏的图片
  }
};

// 发送消息处理函数
const updateInput = (value: string) => {
  messageInput.value = value;
};

const messagesContainer = ref<HTMLElement | null>(null);

// 头像 URL
const userAvatar = 'https://tdesign.gtimg.com/site/avatar.jpg';
const aiAvatar = 'https://tdesign.gtimg.com/site/avatars/knowledge-assistant.png';

// Scroll to bottom when messages change
watch(() => props.messages, () => {
  try {
    nextTick(() => {
      try {
        scrollToBottom();
      } catch (error) {
        console.error('[MessageList] Error scrolling to bottom in watch:', error);
      }
    });
  } catch (error) {
    console.error('[MessageList] Error in messages watch callback:', error);
  }
}, { deep: true });

// Scroll to bottom on mount
onMounted(() => {
  try {
    scrollToBottom();
  } catch (error) {
    console.error('[MessageList] Error scrolling to bottom on mount:', error);
  }
});

// Format date for display
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      // Today, show time only
      return format(date, 'HH:mm');
    } else if (diffInDays === 1) {
      // Yesterday
      return `昨天 ${format(date, 'HH:mm')}`;
    } else if (diffInDays < 7) {
      // Within a week
      return format(date, 'EEE HH:mm');
    } else {
      // Older than a week
      return format(date, 'yyyy-MM-dd HH:mm');
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

// Scroll to bottom of messages container
const scrollToBottom = () => {
  try {
    if (!messagesContainer.value) {
      console.warn('[MessageList] messagesContainer ref is null, cannot scroll');
      return;
    }
    
    const messagesContent = messagesContainer.value.querySelector('.messages-content');
    if (!messagesContent) {
      console.warn('[MessageList] .messages-content element not found, cannot scroll');
      return;
    }
    
    // Using both methods for better compatibility
    messagesContent.scrollTop = messagesContent.scrollHeight;
    
    // Alternative scroll method using scrollTo API
    try {
      messagesContent.scrollTo({
        top: messagesContent.scrollHeight,
        behavior: 'smooth'
      });
    } catch (scrollError) {
      console.warn('[MessageList] Using fallback scroll method:', scrollError);
      // Fallback for older browsers
      messagesContent.scrollTop = messagesContent.scrollHeight;
    }
    
    console.log('[MessageList] Scrolled to bottom, height:', messagesContent.scrollHeight);
  } catch (error) {
    console.error('[MessageList] Error in scrollToBottom:', error);
  }
};

// Expose scrollToBottom method
defineExpose({
  scrollToBottom
});

// 更新watch以监听props.sending的变化
watch(() => props.sending, (newValue) => {
  sending.value = newValue;
  // 当发送状态结束时，清除上传状态和图片
  if (!newValue && uploadingImage.value) {
    uploadingImage.value = false;
    clearSelectedImage();
  }
});

// 添加处理图片加载错误的函数
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  console.warn('[MessageList] 图片加载失败:', img.src);
  
  // 设置为替代图片
  img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNGMEYwRjAiLz48cGF0aCBkPSJNODYgMTEyLjVINjRWMTEzLjVIODZWMTEyLjVaIiBmaWxsPSIjOTk5Ii8+PHBhdGggZD0iTTEzNiAxMTIuNUgxMTRWMTEzLjVIMTM2VjExMi41WiIgZmlsbD0iIzk5OSIvPjxwYXRoIGQ9Ik0xMDAgMTQ2QzgzLjQzMTUgMTQ2IDcwIDEzMi41NjkgNzAgMTE2QzcwIDk5LjQzMTUgODMuNDMxNSA4NiAxMDAgODZDMTE2LjU2OSA4NiAxMzAgOTkuNDMxNSAxMzAgMTE2QzEzMCAxMzIuNTY5IDExNi41NjkgMTQ2IDEwMCAxNDZaTTEwMCAxNDVDMTE2LjAxNiAxNDUgMTI5IDEzMi4wMTYgMTI5IDExNkMxMjkgOTkuOTgzNyAxMTYuMDE2IDg3IDEwMCA4N0M4My45ODM3IDg3IDcxIDk5Ljk4MzcgNzEgMTE2QzcxIDEzMi4wMTYgODMuOTgzNyAxNDUgMTAwIDE0NVoiIGZpbGw9IiM5OTkiLz48cGF0aCBkPSJNMTAwLjUgMTMyQzEwMC41IDEzMi4yNzYgMTAwLjI3NiAxMzIuNSAxMDAgMTMyLjVDOTkuNzIzOSAxMzIuNSA5OS41IDEzMi4yNzYgOTkuNSAxMzJDOTkuNSAxMzEuNzI0IDk5LjcyMzkgMTMxLjUgMTAwIDEzMS41QzEwMC4yNzYgMTMxLjUgMTAwLjUgMTMxLjcyNCAxMDAuNSAxMzJaIiBmaWxsPSIjOTk5Ii8+PHBhdGggZD0iTTEwMCAxMjYuNUM4NS44NjU1IDEyNi41IDc0LjUgMTE1LjEzNSA3NC41IDEwMUM3NC41IDg2Ljg2NTUgODUuODY1NSA3NS41IDEwMCA3NS41QzExNC4xMzUgNzUuNSAxMjUuNSA4Ni44NjU1IDEyNS41IDEwMUMxMjUuNSAxMTUuMTM1IDExNC4xMzUgMTI2LjUgMTAwIDEyNi41Wk0xMDAgMTI1LjVDMTEzLjU4MyAxMjUuNSAxMjQuNSAxMTQuNTgzIDEyNC41IDEwMUMxMjQuNSA4Ny40MTcyIDExMy41ODMgNzYuNSAxMDAgNzYuNUM4Ni40MTcyIDc2LjUgNzUuNSA4Ny40MTcyIDc1LjUgMTAxQzc1LjUgMTE0LjU4MyA4Ni40MTcyIDEyNS41IDEwMCAxMjUuNVoiIGZpbGw9IiM5OTkiLz48cGF0aCBkPSJNMTA4LjUgNjJDMTA4Ljc3NiA2MiAxMDkgNjIuMjIzOSAxMDkgNjIuNVY2My41QzEwOSA2My43NzYxIDEwOC43NzYgNjQgMTA4LjUgNjRDMTA4LjIyNCA2NCAxMDggNjMuNzc2MSAxMDggNjMuNVY2Mi41QzEwOCA2Mi4yMjM5IDEwOC4yMjQgNjIgMTA4LjUgNjJaIiBmaWxsPSIjOTk5Ii8+PHBhdGggZD0iTTkxLjUgNjJDOTEuNzc2MSA2MiA5MiA2Mi4yMjM5IDkyIDYyLjVWNjMuNUM5MiA2My43NzYxIDkxLjc3NjEgNjQgOTEuNSA2NEM5MS4yMjM5IDY0IDkxIDYzLjc3NjEgOTEgNjMuNVY2Mi41QzkxIDYyLjIyMzkgOTEuMjIzOSA2MiA5MS41IDYyWiIgZmlsbD0iIzk5OSIvPjwvc3ZnPg==';
  
  // 添加错误提示类
  img.classList.add('image-error');
  
  // 添加错误提示标题
  img.title = '图片加载失败';
};
</script>

<style scoped>
.messages-container {
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.messages-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  padding-bottom: 120px; /* 为浮动输入框留出足够空间 */
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 80%;
  max-width: 800px;
  margin: 0 auto;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #888;
  font-size: 16px;
  text-align: center;
  padding: 32px 16px;
}

/* 图片相关样式 */
.message-image-container {
  margin-top: 12px;
  display: flex;
  justify-content: center;
}

.message-image {
  max-width: 80%;
  max-height: 240px;
  border-radius: 8px;
  object-fit: contain;
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.message-text {
  margin-bottom: 8px;
}

.selected-image-preview {
  position: relative;
  margin: 8px 16px;
  display: inline-block;
}

.preview-image {
  max-width: 150px;
  max-height: 150px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.selected-image-preview .t-button {
  position: absolute;
  top: -10px;
  right: -10px;
  border-radius: 50%;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.9);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.message-wrapper {
  margin-bottom: 16px;
}

.debug-info {
  background-color: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 16px;
  overflow: auto;
  max-height: 300px;
}

/* 调整消息容器的样式 */
.message-wrapper {
  margin-bottom: 16px;
}

/* 确保 TDesign 组件在容器中正确显示 */
:deep(.t-chat-content) {
  max-width: 100%;
  overflow-wrap: break-word;
}

/* 确保代码块正确显示 */
:deep(.t-chat-content pre) {
  margin: 8px 0;
  overflow-x: auto;
}

/* 聊天输入框包装器 */
.chat-input-wrapper {
  position: absolute;
  bottom: 20px;
  left: 0;
  right: 0;
  width: 80%;
  max-width: 800px;
  margin: 0 auto;
  padding: 10px;
  border-radius: 8px;
  background-color: #f5f7f9;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  z-index: 10;
}

/* 简化版输入组件样式 */
.simple-chat-input {
  display: flex;
  flex-direction: column;
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e0e0e0;
}

.message-textarea {
  width: 100%;
  min-height: 60px;
  padding: 12px;
  border: none;
  resize: none;
  font-size: 14px;
  line-height: 1.5;
  outline: none;
  box-sizing: border-box;
  background-color: #fff;
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: #f9f9f9;
  border-top: 1px solid #eee;
}

.image-upload-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #666;
  transition: color 0.2s;
  padding: 6px 12px;
  border-radius: 4px;
}

.image-upload-btn:hover {
  color: var(--td-brand-color);
  background-color: rgba(0, 82, 217, 0.05);
}

.hidden-file-input {
  display: none;
}

/* 预览图片样式 */
.selected-image-preview {
  position: relative;
  margin: 8px 16px;
  display: inline-block;
}

.preview-image {
  max-width: 150px;
  max-height: 150px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  background-color: #fff;
}

.selected-image-preview .t-button {
  position: absolute;
  top: -10px;
  right: -10px;
  border-radius: 50%;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.9);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 留出空间以确保内容不被输入框遮挡 */
.messages-spacer {
  height: 100px; /* 确保内容不被输入框遮挡，高度应大于输入框高度的一半 */
  flex-shrink: 0;
}

/* 上传中的样式 */
.image-upload-btn.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.upload-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  color: white;
}

.upload-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 8px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 移动端响应式布局 */
@media (max-width: 768px) {
  .messages-content {
    width: 95%;
    padding: 8px;
    padding-bottom: 120px;
  }
  
  .chat-input-wrapper {
    width: 95%;
    bottom: 10px;
  }
  
  .message-textarea {
    min-height: 50px;
    padding: 8px;
  }
  
  .input-actions {
    padding: 6px 8px;
  }
  
  .upload-text {
    display: none; /* 在移动端隐藏上传按钮的文字，只显示图标 */
  }
}

/* 图片错误状态样式 */
.image-error {
  border: 1px dashed #ff4d4f;
  background-color: #fff2f0;
  opacity: 0.7;
  min-height: 100px;
  min-width: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
