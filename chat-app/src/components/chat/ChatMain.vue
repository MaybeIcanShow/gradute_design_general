<template>
  <div class="chat-main">
    <div class="chat-header">
      <div class="current-session-title">
        {{ currentSession?.title || '教材知识点答疑' }}
      </div>
      <div class="chat-actions">
        <t-button size="small" theme="default" @click="checkApiConnection">
          <template #icon><t-icon name="link" /></template>
          检查连接
        </t-button>
      </div>
    </div>
    
    <div class="chat-content">
      <!-- 根据会话类型显示不同的组件 -->
      <template v-if="isChatTypeEnglish(currentSession)">
        <EnglishEssayCorrection
          :currentSession="currentSession"
          :currentSessionId="currentSessionId"
          :sending="sending"
          @send-message="handleSendMessage"
        />
      </template>
      <template v-else>
      <MessageList 
        :messages="messages" 
        :loading="loadingMessages"
        :sending="sending"
        :sessionId="currentSessionId"
        :chatType="currentChatType"
        @send-message="handleSendMessage"
        ref="messageListRef"
      />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits, watch, nextTick, computed } from 'vue';
import MessageList from './MessageList.vue';
import EnglishEssayCorrection from './EnglishEssayCorrection.vue';
import type { Session } from '@/types/chat';
import type { Message } from '@/types/message';
import ChatService from '@/services/ChatService';
import { messagesApi } from '@/api/messages';
import { Button as TButton, Icon as TIcon, MessagePlugin, DialogPlugin } from 'tdesign-vue-next';

const props = defineProps<{
  currentSession: Session | null;
  currentSessionId: string | null;
}>();

const emit = defineEmits<{
  (e: 'logout'): void;
  (e: 'sessions-updated'): void;
}>();

const messages = ref<Message[]>([]);
const loadingMessages = ref(false);
const sending = ref(false);
const messageListRef = ref<InstanceType<typeof MessageList> | null>(null);

// Add this function to fix TypeScript error with chat_type
const isChatTypeEnglish = (session: Session | null): boolean => {
  if (!session) return false;
  return (session as unknown as { chat_type?: string })?.chat_type === 'english';
};

// Add a computed property for chat_type
const currentChatType = computed(() => {
  if (!props.currentSession) return undefined;
  return (props.currentSession as unknown as { chat_type?: string })?.chat_type;
});

// Fetch messages for a session - moving this before the watch that uses it
const fetchMessages = async (sessionId: string) => {
  loadingMessages.value = true;
  
  try {
    messages.value = await ChatService.fetchMessages(sessionId);
    console.log('Fetched messages:', messages.value);
  } catch (error: any) {
    console.error('获取消息失败:', error.message, error.stack, error);
    MessagePlugin.error({
      content: '获取消息失败',
      duration: 3000,
      closeBtn: true,
    });
  } finally {
    loadingMessages.value = false;
    nextTick(() => {
      if (messageListRef.value) {
        messageListRef.value.scrollToBottom();
      }
    });
  }
};

// Watch for changes in currentSessionId and fetch messages
watch(() => props.currentSessionId, async (newSessionId) => {
  try {
    if (newSessionId) {
      await fetchMessages(newSessionId);
    } else {
      messages.value = [];
    }
  } catch (error) {
    console.error('[ChatMain] Error in watch callback for currentSessionId:', error);
    // Fail gracefully without crashing the app
  }
}, { immediate: true });

// Handle send message with optional image
const handleSendMessage = async (content: string, imageFile: File | null = null, retryCount = 0): Promise<void> => {
  console.log('[ChatMain] handleSendMessage called with content:', content, 'imageFile:', imageFile ? `${imageFile.name} (${imageFile.size} bytes)` : 'null', 'retryCount:', retryCount);
  
  // Maximum number of retries
  const MAX_RETRIES = 2; // Will try a total of 3 times (original + 2 retries)
  
  if (!props.currentSessionId || sending.value) {
    console.error('[ChatMain] Cannot send message: No session ID or already sending', {
      currentSessionId: props.currentSessionId,
      sending: sending.value
    });
    return;
  }
  
  sending.value = true;
  // Ensure sessionId is a number for API calls
  const sessionId = Number(props.currentSessionId);
  console.log('[ChatMain] Using session ID:', sessionId);
  let imagePath = null;
  
  try {
    // Create user message object first
    const userMessage: Message = {
      id: Date.now(),
      session_id: sessionId,
      role: 'user',
      content: content,
      created_at: new Date().toISOString(),
      image_path: imagePath || undefined
    };
    
    // Create AI reply placeholder message with timestamp after user message
    const aiMessageId = Date.now() + 1000; // Add 1000ms to ensure it appears after the user message
    const aiMessage: Message = {
      id: aiMessageId,
      session_id: sessionId,
      role: 'assistant',
      content: '', // Initially empty, will be filled with streaming output
      created_at: new Date(Date.now() + 1000).toISOString() // Add 1 second to ensure proper ordering
    };
    
    // 如果有图片，先上传图片
    if (imageFile) {
      try {
        console.log('[ChatMain] Uploading image file:', imageFile.name, 'size:', imageFile.size, 'type:', imageFile.type);
        
        // Add user message first to show in correct order
        messages.value = [...messages.value, userMessage];
        
        // Add empty AI reply placeholder
        messages.value = [...messages.value, aiMessage];
        
        // Show loading state
        const loadingMessage = `正在上传图片 ${imageFile.name}...`;
        updateAssistantMessage(aiMessageId, loadingMessage);
        
        // Upload the image with retry logic
        const maxRetries = 2;
        let uploadError = null;
        
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            if (attempt > 0) {
              console.log(`[ChatMain] Retrying image upload (attempt ${attempt} of ${maxRetries})...`);
              updateAssistantMessage(aiMessageId, `正在重试上传图片... (${attempt}/${maxRetries})`);
            }
            
            imagePath = await messagesApi.uploadImage(sessionId, imageFile);
            console.log('[ChatMain] Image uploaded successfully:', imagePath);
            
            // Update user message with the image path
            userMessage.image_path = imagePath;
            
            // Update the displayed message
            const userIndex = messages.value.findIndex(m => m.id === userMessage.id);
            if (userIndex !== -1) {
              messages.value[userIndex] = { ...messages.value[userIndex], image_path: imagePath };
            }
            
            // 确保重置上传状态
            resetUploadState();
            
            // Success - break out of retry loop
            break;
          } catch (error: any) {
            console.error(`[ChatMain] Upload attempt ${attempt + 1} failed:`, error);
            uploadError = error;
            
            // Last attempt failed, don't wait for another retry
            if (attempt === maxRetries) {
              throw error;
            }
            
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        // If we got here with uploadError still set, it means all retries failed
        if (uploadError && !imagePath) {
          const dialog = DialogPlugin.confirm({
            header: '图片上传失败',
            body: '是否继续发送文本消息？',
            confirmBtn: '继续发送',
            cancelBtn: '取消',
            closeOnEscKeydown: true,
            closeOnOverlayClick: true,
            theme: 'warning',
            onConfirm: () => {
              console.log('[ChatMain] Continuing without image after user confirmation');
              imagePath = null;
              // 关闭确认对话框
              dialog.hide();
            },
            onClose: () => {
              console.log('[ChatMain] User cancelled message after image upload failure');
              sending.value = false;
              // Remove the messages since we're cancelling
              messages.value = messages.value.filter(m => m.id !== aiMessageId && m.id !== userMessage.id);
              // Notify UI that we're done with uploading and there was an error
              MessagePlugin.error({
                content: '图片上传失败: ' + (uploadError.message || '未知错误'),
                duration: 30000,
                closeBtn: true,
              });
            }
          });
        } else {
          throw uploadError;
        }
      } catch (error: any) {
        console.error('[ChatMain] 图片上传失败:', error.message, error.stack, error);
        console.error('[ChatMain] 图片上传详细错误:', {
          name: error.name,
          message: error.message,
          status: error.status,
          statusText: error.statusText,
          data: error.data,
          stack: error.stack
        });
        
        // 使用DialogPlugin替代原生confirm
        const dialog = DialogPlugin.confirm({
          header: '图片上传失败',
          body: '是否继续发送文本消息？',
          confirmBtn: '继续发送',
          cancelBtn: '取消',
          closeOnEscKeydown: true,
          closeOnOverlayClick: true,
          theme: 'warning',
          onConfirm: () => {
            console.log('[ChatMain] Continuing without image after user confirmation');
            imagePath = null;
            // 关闭确认对话框
            dialog.hide();
          },
          onClose: () => {
            console.log('[ChatMain] User cancelled message after image upload failure');
            sending.value = false;
            // Remove the messages since we're cancelling
            messages.value = messages.value.filter(m => m.id !== aiMessageId && m.id !== userMessage.id);
            // Notify UI that we're done with uploading and there was an error
            MessagePlugin.error({
              content: '图片上传失败: ' + (error.message || '未知错误'),
              duration: 30000,
              closeBtn: true,
            });
          }
        });
      }
    } else {
      // No image, add messages directly
      console.log('[ChatMain] No image, adding messages directly');
      messages.value = [...messages.value, userMessage];
      messages.value = [...messages.value, aiMessage];
    }
      
    console.log('[ChatMain] Messages added in order:', messages.value.map(m => ({ id: m.id, role: m.role, created_at: m.created_at })));
    
    // Ensure view updates and scrolls to bottom
    nextTick(() => {
      if (messageListRef.value) {
        messageListRef.value.scrollToBottom();
      }
    });
    
    // 处理消息流
    let accumulatedContent = '';
    
    const handleSendError = async (error: any, errorSource: string): Promise<void> => {
      console.error(`[ChatMain] Error in ${errorSource}:`, error.message, error.stack, error);
      console.error(`[ChatMain] Detailed error in ${errorSource}:`, {
        name: error.name,
        message: error.message,
        status: error.status,
        statusText: error.statusText,
        data: error.data,
        stack: error.stack
      });
      
      // 根据错误类型判断是否需要重试
      const shouldRetry = (() => {
        // 连接错误或超时错误通常可以重试
        if (error.name === 'NetworkError' || error.message?.includes('timeout') || error.message?.includes('network')) {
          return true;
        }
        
        // 服务器临时错误可以重试
        if (error.status >= 500 && error.status < 600) {
          return true;
        }
        
        // 某些特定的 429 错误 (请求过多) 可以重试
        if (error.status === 429) {
          return true;
        }
        
        // 默认情况下，如果不是明确的客户端错误，尝试重试
        return error.status !== 400 && error.status !== 401 && error.status !== 403 && error.status !== 404;
      })();
      
      // If we haven't reached max retries and the error is retriable, try again
      if (shouldRetry && retryCount < MAX_RETRIES) {
        console.log(`[ChatMain] Retrying message send (attempt ${retryCount + 1} of ${MAX_RETRIES})...`);
        
        // 添加指数退避 - 第一次等待1秒，第二次等待2秒
        const waitTime = 1000 * Math.pow(2, retryCount);
        console.log(`[ChatMain] Waiting ${waitTime/1000} seconds before retrying...`);
        
        // Remove the failed messages before retrying
        messages.value = messages.value.filter(m => m.id !== aiMessageId);
        
        // Wait with exponential backoff before retrying
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
        // Release the sending lock
        sending.value = false;
        
        // Try again with incremented retry count
        return handleSendMessage(content, imageFile, retryCount + 1);
      } else {
        // Max retries reached or non-retriable error, show error and update UI
        const errorMessage = error.message || '未知错误';
        console.error(`[ChatMain] ${shouldRetry ? `Max retries (${MAX_RETRIES}) reached.` : 'Non-retriable error.'} Giving up.`);
        
        // Use the MessagePlugin to show an error notification
        MessagePlugin.error({
          content: `发送消息失败 ${shouldRetry ? `(已重试${retryCount}次)` : ''}: ${errorMessage}`,
          duration: 5000
        });
        
        // Update the assistant message to show error
        updateAssistantMessage(aiMessageId, `⚠️ 消息发送失败 ${shouldRetry ? `(已重试${retryCount}次)` : ''}: ${errorMessage}`);
        
        sending.value = false;
        return;
      }
    };
    
    // 根据是否有图片选择不同的发送方法
    try {
      // 使用统一的消息发送API，无论是否有图片
      console.log('[ChatMain] Calling createMessageStream with content and image_path:', imagePath);
      await messagesApi.createMessageStream(
        sessionId,
        { content, ...(imagePath ? { image_path: imagePath } : {}) },
        (chunk) => {
          // 处理每个文本块
          console.log('[ChatMain] Received chunk:', chunk.substring(0, 100) + (chunk.length > 100 ? '...' : ''));
          try {
            // Process SSE format data
            const lines = chunk.split('\n');
            
            for (const line of lines) {
              if (line.trim() === '') continue;
              
              if (line.startsWith('data: ')) {
                const data = line.substring(6);
                console.log('[ChatMain] Extracted data from chunk:', data.substring(0, 100) + (data.length > 100 ? '...' : ''));
                
                if (data === '[DONE]') {
                  console.log('[ChatMain] Stream ended with [DONE]');
                  continue;
                }
                
                try {
                  // Try to parse JSON
                  const jsonData = JSON.parse(data);
                  console.log('[ChatMain] Parsed JSON data:', jsonData);
                  
                  if (jsonData.content) {
                    // Accumulate content
                    accumulatedContent += jsonData.content;
                    console.log('[ChatMain] Updated accumulated content:', accumulatedContent.substring(0, 100) + (accumulatedContent.length > 100 ? '...' : ''));
                    
                    // Update message content
                    updateAssistantMessage(aiMessageId, accumulatedContent);
                  }
                } catch (e) {
                  console.error('[ChatMain] Error parsing JSON from stream:', e, data);
                  // 如果不是JSON，可能是纯文本
                  accumulatedContent += data;
                  updateAssistantMessage(aiMessageId, accumulatedContent);
                }
              } else {
                // 如果不是 SSE 格式，尝试直接处理整行
                try {
                  const jsonData = JSON.parse(line);
                  console.log('[ChatMain] Parsed non-SSE JSON:', jsonData);
                  
                  if (jsonData.content) {
                    accumulatedContent += jsonData.content;
                    updateAssistantMessage(aiMessageId, accumulatedContent);
                  }
                } catch (e) {
                  // 不是 JSON，直接添加文本
                  if (line.trim()) {
                    accumulatedContent += line;
                    updateAssistantMessage(aiMessageId, accumulatedContent);
                  }
                }
              }
            }
          } catch (e) {
            console.error('[ChatMain] Error processing stream chunk:', e);
            // 如果解析失败，直接添加原始文本
            accumulatedContent += chunk;
            console.log('[ChatMain] Added raw chunk to content due to error:', accumulatedContent.substring(0, 100) + (accumulatedContent.length > 100 ? '...' : ''));
            updateAssistantMessage(aiMessageId, accumulatedContent);
          }
        },
        () => {
          console.log('[ChatMain] Stream complete');
          // 完成后更新会话列表
          emit('sessions-updated');
          sending.value = false;
        },
        (error: any) => {
          console.error('[ChatMain] Error in message stream:', error.message, error.stack, error);
          console.error('[ChatMain] Detailed error information:', {
            name: error.name,
            message: error.message,
            status: error.status,
            statusText: error.statusText,
            data: error.data,
            stack: error.stack
          });
          
          // 提供更详细的错误信息
          const errorMessage = error.message || '未知错误';
          
          // Use MessagePlugin for error notification
          MessagePlugin.error({
            content: `接收AI回复时出错: ${errorMessage}`,
            duration: 5000
          });
          
          // 确保在错误发生时重置发送状态
          sending.value = false;
        }
      );
    } catch (error: any) {
      return handleSendError(error, 'message sending');
    }
  } catch (error: any) {
    console.error('[ChatMain] Unexpected error in handleSendMessage:', error);
    console.error('[ChatMain] Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    // Use MessagePlugin for error notification
    MessagePlugin.error({
      content: '发送消息时发生未知错误: ' + (error.message || '未知错误'),
      duration: 5000
    });
  } finally {
    sending.value = false;
    // 确保在所有情况下都重置上传状态
    resetUploadState();
  }
};

// 更新助手消息内容
const updateAssistantMessage = (messageId: number, content: string) => {
  const updatedMessages = [...messages.value];
  const aiMessageIndex = updatedMessages.findIndex(m => m.id === messageId);
  
  if (aiMessageIndex !== -1) {
    updatedMessages[aiMessageIndex] = {
      ...updatedMessages[aiMessageIndex],
      content: content
    };
    
    messages.value = updatedMessages;
    
    // Scroll to bottom
    nextTick(() => {
      if (messageListRef.value) {
        messageListRef.value.scrollToBottom();
      }
    });
  }
};

// Logout handler
const logout = () => {
  emit('logout');
};

// Check API connection
const checkApiConnection = async () => {
  try {
    console.log('[ChatMain] Checking API connection...');
    const result = await messagesApi.checkApiConnection();
    
    if (result.success) {
      console.log('[ChatMain] API connection successful:', result);
      MessagePlugin.success({
        content: '连接成功: ' + result.message,
        duration: 30000
      });
    } else {
      console.error('[ChatMain] API connection failed:', result);
      MessagePlugin.error({
        content: '连接失败: ' + result.message,
        duration: 50000
      });
    }
  } catch (error: any) {
    console.error('[ChatMain] Error checking API connection:', error);
    MessagePlugin.error({
      content: '检查连接时出错: ' + (error.message || '未知错误'),
      duration: 50000
    });
  }
};

// 添加重置上传状态的方法
const resetUploadState = () => {
  console.log('[ChatMain] Explicitly resetting upload state');
  sending.value = false;
  
  // 确保MessageList组件的上传状态被重置
  nextTick(() => {
    if (messageListRef.value) {
      // 使用公开的方法重置上传状态
      if (typeof messageListRef.value.resetUploadState === 'function') {
        messageListRef.value.resetUploadState();
      }
    }
  });
};
</script>

<style scoped>
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  border-left: 1px solid #e0e0e0;
}

.chat-header {
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
  background-color: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-actions {
  display: flex;
  gap: 8px;
}

.clear-chat-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background-color: #fff;
  color: #666;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.clear-chat-btn:hover {
  background-color: #f5f5f5;
  color: #ff4d4f;
  border-color: #ff4d4f;
}

.current-session-title {
  font-size: 18px;
  font-weight: 500;
}

.logout-btn {
  cursor: pointer;
  color: var(--td-brand-color);
}

.chat-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
</style>