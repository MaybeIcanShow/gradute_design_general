<template>
  <div class="analysis-details">
    <h3>错误分析</h3>
    
    <div v-for="(errors, type) in groupedErrors" :key="type" class="error-category">
      <h4 :style="{color: errorTypeColors[type]}">{{ errorTypeNames[type] }} ({{ errors.length }}个)</h4>
      <div class="error-list">
        <div v-for="(error, index) in errors" :key="index" class="error-item">
          <div>
            原文: <span class="error-original">{{ error.original }}</span> → 
            建议: <span class="error-corrected">{{ error.corrected }}</span>
          </div>
          <div style="margin-top: 3px; color: #666; font-size: 0.9em;">
            {{ error.explanation }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';
import type { EssayCorrection } from '@/api/essays';
import { errorTypeColors, errorTypeNames } from '../utils/essayUtils';

defineProps<{
  groupedErrors: Record<string, EssayCorrection[]>;
}>();
</script>

<style scoped>
.analysis-details {
  margin-top: 20px;
  border-top: 1px solid #eee;
  padding-top: 15px;
}

.error-category {
  margin-bottom: 15px;
}

.error-list {
  background-color: #f9f9f9;
  padding: 10px;
  border-radius: 4px;
  margin-top: 8px;
}

.error-item {
  margin-bottom: 5px;
  padding: 5px;
  border-bottom: 1px dashed #eee;
}

.error-original {
  font-weight: bold;
  color: #d32f2f;
}

.error-corrected {
  font-weight: bold;
  color: #388e3c;
}
</style> 