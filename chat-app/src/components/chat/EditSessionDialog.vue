<template>
  <div v-if="visible" class="modal-overlay">
    <div class="modal-dialog">
      <div class="modal-header">编辑会话标题</div>
      <div class="modal-body">
        <input 
          v-model="titleValue" 
          id="edit-title-input"
          name="edit-title-input"
          type="text" 
          placeholder="请输入会话标题"
          ref="titleInput"
        />
      </div>
      <div class="modal-footer">
        <button class="cancel-btn" @click="cancel">取消</button>
        <button class="confirm-btn" @click="confirm">保存</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits, watch, nextTick } from 'vue';
import type { Session } from '@/types/chat';

const props = defineProps<{
  visible: boolean;
  session: Session | null;
}>();

const emit = defineEmits<{
  (e: 'update:visible', visible: boolean): void;
  (e: 'confirm', sessionId: string, title: string): void;
}>();

const titleValue = ref('');
const titleInput = ref<HTMLInputElement | null>(null);

// Watch for changes in session and update title value
watch(() => props.session, (newSession) => {
  if (newSession) {
    titleValue.value = newSession.title || '';
    
    // Focus the input when dialog opens
    nextTick(() => {
      if (titleInput.value) {
        titleInput.value.focus();
      }
    });
  }
}, { immediate: true });

// Watch for changes in visibility
watch(() => props.visible, (visible) => {
  if (visible) {
    // Focus the input when dialog opens
    nextTick(() => {
      if (titleInput.value) {
        titleInput.value.focus();
      }
    });
  }
});

// Cancel button handler
const cancel = () => {
  emit('update:visible', false);
};

// Confirm button handler
const confirm = () => {
  if (props.session) {
    emit('confirm', props.session.id, titleValue.value);
  }
  emit('update:visible', false);
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-dialog {
  background-color: white;
  border-radius: 4px;
  width: 400px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.modal-header {
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
  font-weight: 500;
}

.modal-body {
  padding: 16px;
}

.modal-footer {
  padding: 16px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: flex-end;
}

.modal-body input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  outline: none;
  transition: border-color 0.3s;
}

.modal-body input:focus {
  border-color: #40a9ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.cancel-btn {
  padding: 8px 16px;
  background-color: white;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  margin-right: 8px;
  cursor: pointer;
}

.confirm-btn {
  padding: 8px 16px;
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>
