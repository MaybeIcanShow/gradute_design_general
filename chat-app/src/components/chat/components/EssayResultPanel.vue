<template>
  <div class="result-panel">
    <h2 class="panel-title">
      批改结果
      <span v-if="isHistorical" class="historical-badge">历史结果</span>
    </h2>
    
    <div v-if="!showResult && !isLoading" class="corrected-essay empty-result">
      点击{{ isHistorical ? '"重新批改"' : '"批改作文"' }}按钮{{ isHistorical ? '更新' : '获取' }}批改结果
    </div>
    
    <transition name="fade">
      <div v-if="showResult">
        <!-- 错误类型图例 -->
        <ErrorLegend />
        
        <!-- 统计信息 -->
        <EssayStatistics :stats="stats" :score="score" :stage="stage" />
        
        <!-- 批改后的文章 -->
        <h3>批改详情 <small style="font-weight: normal; color: #666;">(鼠标悬停在标记处查看详细说明)</small></h3>
        <div class="corrected-essay" v-html="correctedEssay"></div>
        
        <!-- 分析细节 -->
        <ErrorTypeAnalysis :grouped-errors="groupedErrors" />
        
        <!-- 评分建议 -->
        <EvaluationResult 
          :score="score"
          :strengths="strengths"
          :improvements="improvements"
          :stage="stage"
          :comment="comment"
        />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';
import type { EssayStats } from '../utils/essayUtils';
import type { EssayCorrection } from '@/api/essays';
import ErrorLegend from './ErrorLegend.vue';
import EssayStatistics from './EssayStatistics.vue';
import ErrorTypeAnalysis from './ErrorTypeAnalysis.vue';
import EvaluationResult from './EvaluationResult.vue';

defineProps<{
  showResult: boolean;
  isLoading: boolean;
  isHistorical: boolean;
  correctedEssay: string;
  stats: EssayStats;
  score: number;
  stage: string;
  groupedErrors: Record<string, EssayCorrection[]>;
  strengths: string[];
  improvements: string[];
  comment?: string;
}>();
</script>

<style scoped>
.result-panel {
  flex: 1;
  min-width: 300px;
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  max-height: 100%;
  overflow-y: auto;
}

.panel-title {
  margin-top: 0;
  border-bottom: 2px solid #eee;
  padding-bottom: 10px;
  color: #333;
}

.corrected-essay {
  margin-bottom: 20px;
  line-height: 1.8;
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 4px;
  min-height: 100px;
  background-color: #fefefe;
}

.empty-result {
  display: flex;
  justify-content: center;
  align-items: center;
  color: #999;
  font-style: italic;
}

/* 添加Vue过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 历史批改标记 */
.historical-badge {
  display: inline-block;
  font-size: 12px;
  background-color: #ff9800;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  margin-left: 10px;
  vertical-align: middle;
  font-weight: normal;
}

.logic-error, .vocabulary-error, .grammar-error, .other-error {
  position: relative;
}

/* Error styling is in global CSS to work with v-html content */
</style>

<style>
/* Global styles needed for v-html content */
.logic-error {
  text-decoration: underline wavy #ff5722;
  padding-bottom: 2px;
  background-color: rgba(255, 87, 34, 0.05);
}

.vocabulary-error {
  text-decoration: underline dashed #9c27b0;
  padding-bottom: 2px;
  background-color: rgba(156, 39, 176, 0.05);
}

.grammar-error {
  text-decoration: underline wavy red;
  padding-bottom: 2px;
  background-color: rgba(255, 0, 0, 0.05);
}

.other-error {
  text-decoration: underline solid #009688;
  padding-bottom: 2px;
  background-color: rgba(0, 150, 136, 0.05);
}

.tooltip {
  position: relative;
  display: inline-block;
}

.tooltip .tooltiptext {
  visibility: hidden;
  width: 250px;
  background-color: #555;
  color: #fff;
  text-align: center;
  border-radius: 6px;
  padding: 8px;
  position: absolute;
  z-index: 1;
  bottom: 125%;
  left: 50%;
  margin-left: -125px;
  opacity: 0;
  transition: opacity 0.3s;
  font-size: 14px;
  font-weight: normal;
  box-shadow: 0 3px 10px rgba(0,0,0,0.2);
}

.tooltip:hover .tooltiptext {
  visibility: visible;
  opacity: 1;
}
</style> 