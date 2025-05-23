<template>
  <div class="evaluation">
    <h3>评分与建议</h3>
    <p><span class="score" :style="{color: getScoreColor(score, stage)}">
      分数: {{ score }}/{{ getMaxScore(stage) }} ({{ getScoreLevel(score, stage) }})
    </span></p>
    
    <h4>优点:</h4>
    <ul>
      <li v-for="(strength, index) in strengths" :key="'strength-'+index">
        {{ strength }}
      </li>
    </ul>
    
    <h4>需要改进:</h4>
    <ul>
      <li v-for="(improvement, index) in improvements" :key="'improve-'+index">
        {{ improvement }}
      </li>
    </ul>
    
    <div class="comment" v-if="comment">
      {{ comment }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';
import { getScoreColor, getScoreLevel } from '../utils/essayUtils';

defineProps<{
  score: number;
  strengths: string[];
  improvements: string[];
  stage?: string;
  comment?: string;
}>();

// Get maximum score based on stage
const getMaxScore = (stage?: string) => {
  if (stage === 'gaokao') return 25;
  return 15; // Default for CET-4 and CET-6
};
</script>

<style scoped>
.evaluation {
  border-top: 1px solid #ddd;
  padding-top: 15px;
  margin-top: 15px;
}

.score {
  font-size: 18px;
  font-weight: bold;
}

.comment {
  color: #2196F3;
  font-style: italic;
  margin-top: 5px;
}
</style> 