<template>
  <div class="stats-panel">
    <h3 style="margin-top: 0;">文章统计</h3>
    <div class="stats-grid">
      <div class="stat-item">
        <div class="stat-value">{{ stats.wordCount }}</div>
        <div class="stat-label">总词数</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ stats.sentenceCount }}</div>
        <div class="stat-label">句子数</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ stats.errorCount }}</div>
        <div class="stat-label">错误总数</div>
      </div>
      <div class="stat-item">
        <div class="stat-value" :style="{color: getScoreColor(score, stage)}">
          {{ score }}/{{ getMaxScore(stage) }}
        </div>
        <div class="stat-label">综合评分</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';
import { getScoreColor, type EssayStats } from '../utils/essayUtils';

defineProps<{
  stats: EssayStats;
  score: number;
  stage?: string;
}>();

// Get maximum score based on stage
const getMaxScore = (stage?: string) => {
  if (stage === 'gaokao') return 25;
  return 15; // Default for CET-4 and CET-6
};
</script>

<style scoped>
.stats-panel {
  margin-top: 20px;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 4px;
  border-left: 4px solid #2196F3;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 10px;
  margin-top: 10px;
}

.stat-item {
  padding: 10px;
  background-color: #fff;
  border-radius: 4px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: #333;
}

.stat-label {
  font-size: 12px;
  color: #666;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style> 