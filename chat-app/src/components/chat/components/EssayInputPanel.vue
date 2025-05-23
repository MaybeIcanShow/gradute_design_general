<template>
  <div class="input-panel">
    <h2 class="panel-title">原文输入</h2>
    
    <!-- 阶段选择 -->
    <div class="stage-selector">
      <span class="stage-label">考试类型：</span>
      <div class="stage-options">
        <label v-for="option in stageOptions" :key="option.value">
          <input 
            type="radio" 
            :value="option.value" 
            v-model="selectedStage" 
            :disabled="isDisabled"
          />
          <span>{{ option.label }}</span>
        </label>
      </div>
    </div>
    
    <!-- 作文要求/题目输入 -->
    <div class="requirement-input">
      <label for="requirement">作文题目/要求 (可选)：</label>
      <textarea 
        id="requirement"
        v-model="essayRequirement" 
        placeholder="请输入作文题目或要求..."
        :disabled="isDisabled"
        rows="2"
        class="requirement-textarea"
      ></textarea>
    </div>
    
    <textarea 
      class="essay-input" 
      v-model="essayContent" 
      placeholder="请在此输入您的英文作文..."
      :disabled="isDisabled"
    ></textarea>
    
    <button class="btn" @click="submitEssay" :disabled="isDisabled || !essayContent.trim()">
      {{ isHistorical ? '重新批改' : (isLoading ? '批改中...' : '批改作文') }}
    </button>
    
    <div v-if="isLoading" class="loading">
      <div class="loading-spinner"></div>
      <div class="loading-text">正在分析您的作文，请稍候...</div>
      <div class="loading-detail">这可能需要20-30秒的时间，AI正在进行语法、词汇、逻辑和表达分析</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, ref, watch, computed } from 'vue';

const props = defineProps<{
  modelValue: string;
  requirement: string;
  stage: string;
  isLoading: boolean;
  isHistorical: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'update:requirement', value: string): void;
  (e: 'update:stage', value: string): void;
  (e: 'submit'): void;
}>();

// Default essay text for demo purposes
const defaultEssay = `I have went to the park yesterday. The weather were very nice, and I see many beautiful flowers. I think this is the best park in our city, because it have many trees and lakes. In the future, I will going there again with my freinds.`;

// Stage options
const stageOptions = [
  { value: 'cet4', label: 'CET-4' },
  { value: 'cet6', label: 'CET-6' },
  { value: 'gaokao', label: '高考' }
];

// Local state
const essayContent = ref(props.modelValue || defaultEssay);
const essayRequirement = ref(props.requirement || '');
const selectedStage = ref(props.stage || 'cet4');

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  essayContent.value = newValue;
});

watch(() => props.requirement, (newValue) => {
  essayRequirement.value = newValue;
});

watch(() => props.stage, (newValue) => {
  selectedStage.value = newValue;
});

// Watch for local changes
watch(essayContent, (newValue) => {
  emit('update:modelValue', newValue);
});

watch(essayRequirement, (newValue) => {
  emit('update:requirement', newValue);
});

watch(selectedStage, (newValue) => {
  emit('update:stage', newValue);
});

// Computed property to determine if controls should be disabled
const isDisabled = computed(() => props.isLoading);

// Submit method
const submitEssay = () => {
  emit('submit');
};
</script>

<style scoped>
.input-panel {
  flex: 1;
  min-width: 300px;
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.panel-title {
  margin-top: 0;
  border-bottom: 2px solid #eee;
  padding-bottom: 10px;
  color: #333;
}

.stage-selector {
  margin-bottom: 15px;
  display: flex;
  align-items: center;
}

.stage-label {
  margin-right: 10px;
  font-weight: 500;
}

.stage-options {
  display: flex;
  gap: 15px;
}

.stage-options label {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.stage-options label input {
  margin-right: 5px;
}

.requirement-input {
  margin-bottom: 15px;
}

.requirement-textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  resize: vertical;
  margin-top: 5px;
}

.essay-input {
  width: 100%;
  min-height: 300px;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 15px;
  font-size: 16px;
  resize: vertical;
}

.btn {
  background-color: #4CAF50;
  color: white;
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s;
  width: 100%;
}

.btn:hover {
  background-color: #45a049;
}

.btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.loading {
  text-align: center;
  padding: 20px;
  color: #666;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 15px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(0, 150, 136, 0.2);
  border-top-color: #4CAF50;
  border-radius: 50%;
  animation: spin 1.5s linear infinite;
  margin-bottom: 15px;
}

.loading-text {
  font-weight: 500;
  font-size: 16px;
  margin-bottom: 8px;
}

.loading-detail {
  font-size: 14px;
  opacity: 0.8;
  max-width: 300px;
  margin: 0 auto;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style> 