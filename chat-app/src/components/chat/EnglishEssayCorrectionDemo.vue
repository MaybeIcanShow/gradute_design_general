<template>
  <div class="essay-correction">
    <!-- 头部标题 -->
    <div class="header">
      <h1>Vue作文批改系统</h1>
      <p>请在左侧输入英文作文，点击"批改作文"按钮在右侧查看详细批改结果</p>
    </div>
    
    <div class="content-wrapper">
      <!-- 上部输入面板 -->
      <div class="input-panel">
        <h2 class="panel-title">原文输入</h2>
        
        <textarea 
          class="essay-input" 
          v-model="essayText" 
          placeholder="请在此输入您的英文作文..."
          :disabled="isGrading"
        ></textarea>
        
        <button class="btn" @click="gradeEssay" :disabled="isGrading || !essayText.trim()">
          {{ isGrading ? '批改中...' : '批改作文' }}
        </button>
        
        <div v-if="isGrading" class="loading">
          <div>正在分析您的作文，请稍候...</div>
          <div style="margin-top: 10px; font-size: 0.9em;">检查语法、拼写、表达、词汇选择、句式结构...</div>
        </div>
      </div>
      
      <!-- 下部结果面板 -->
      <div class="result-panel">
        <h2 class="panel-title">批改结果</h2>
        
        <div v-if="!showResult && !isGrading" class="corrected-essay empty-result">
          点击"批改作文"按钮查看批改结果
        </div>
        
        <transition name="fade">
          <div v-if="showResult">
            <!-- 错误类型图例 -->
            <ErrorLegend />
            
            <!-- 统计信息 -->
            <EssayStatistics :stats="essayStats" :score="evaluationResult.score" :stage="'cet4'" />
            
            <!-- 批改后的文章 -->
            <h3>批改详情 <small style="font-weight: normal; color: #666;">(鼠标悬停在标记处查看详细说明)</small></h3>
            <div class="corrected-essay" v-html="correctedEssay"></div>
            
            <!-- 分析细节 -->
            <ErrorTypeAnalysis :grouped-errors="groupedErrors" />
            
            <!-- 评分建议 -->
            <EvaluationResult 
              :score="evaluationResult.score"
              :strengths="evaluationResult.strengths"
              :improvements="evaluationResult.improvements"
              :stage="'cet4'"
              :comment="evaluationResult.comment"
            />
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue';
import { ErrorLegend, EssayStatistics, ErrorTypeAnalysis, EvaluationResult } from './components';
import { calculateEssayStats, generateCorrectedEssayHtml, groupErrorsByType, type EssayStats } from './utils/essayUtils';
import type { EssayCorrection } from '@/api/essays';

// 响应式数据
const essayText = ref(`I have went to the park yesterday. The weather were very nice, and I see many beautiful flowers. I think this is the best park in our city, because it have many trees and lakes. In the future, I will going there again with my freinds.`);
const showResult = ref(false);
const isGrading = ref(false);
const corrections = ref<EssayCorrection[]>([]);

// 评估结果
const evaluationResult = ref({
  score: 0,
  strengths: [] as string[],
  improvements: [] as string[],
  comment: ""
});

// 文章统计
const essayStats = reactive<EssayStats>({
  wordCount: 0,
  sentenceCount: 0,
  errorCount: 0
});

// 分组错误
const groupedErrors = computed(() => groupErrorsByType(corrections.value));

// 处理批改后的文本
const correctedEssay = computed(() => 
  generateCorrectedEssayHtml(essayText.value, corrections.value)
);

// 计算文章统计信息
const calculateStats = () => {
  const stats = calculateEssayStats(essayText.value, corrections.value.length);
  essayStats.wordCount = stats.wordCount;
  essayStats.sentenceCount = stats.sentenceCount;
  essayStats.errorCount = stats.errorCount;
};

// 模拟批改方法
const gradeEssay = async () => {
  if (!essayText.value.trim()) {
    alert("请输入作文内容");
    return;
  }
  
  isGrading.value = true;
  showResult.value = false;
  
  // 模拟API请求延迟
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // 模拟批改结果
  mockGradeEssay();
  calculateStats();
  
  isGrading.value = false;
  showResult.value = true;
};

// 模拟大模型批改结果
const mockGradeEssay = () => {
  corrections.value = [
    {
      original: "have went",
      corrected: "went",
      explanation: "过去时态应使用动词的过去式 'went'，而非 'have went'。",
      type: "grammar"
    },
    {
      original: "weather were",
      corrected: "weather was",
      explanation: "'weather' 是单数名词，因此应使用单数形式的动词 'was'。",
      type: "grammar"
    },
    {
      original: "I see",
      corrected: "I saw",
      explanation: "由于描述的是过去的事件，应使用过去时态 'saw'。",
      type: "grammar"
    },
    {
      original: "it have",
      corrected: "it has",
      explanation: "'it' 是单数代词，应该使用 'has' 而不是 'have'。",
      type: "grammar"
    },
    {
      original: "will going",
      corrected: "will go",
      explanation: "在 'will' 之后应使用动词原形，不需要 '-ing' 形式。",
      type: "grammar"
    },
    {
      original: "freinds",
      corrected: "friends",
      explanation: "'friends' 的正确拼写为 'friends'，而不是 'freinds'。",
      type: "vocabulary"
    },
    {
      original: "beautiful flowers",
      corrected: "colorful flowers",
      explanation: "虽然'beautiful'也是正确的，但在描述花朵时，使用'colorful'可以更具体地表达它们的特点。",
      type: "vocabulary"
    },
    {
      original: "In the future,",
      corrected: "Someday soon,",
      explanation: "'In the future'表达有些宽泛，如果表达近期计划，可以使用更具体的时间表达如'Someday soon'。",
      type: "vocabulary"
    },
    {
      original: "I think this is the best park in our city, because it have many trees and lakes.",
      corrected: "This is the best park in our city because of its abundant trees and lakes.",
      explanation: "这句话逻辑结构可以更紧凑，去掉主观引导词'I think'并重组因果关系表达更清晰。",
      type: "logic"
    },
    {
      original: "park yesterday",
      corrected: "park yesterday.",
      explanation: "句末应加句号。",
      type: "other"
    },
    {
      original: "I have went to the park yesterday.",
      corrected: "Yesterday, I went to the park.",
      explanation: "时间状语'yesterday'放在句首更符合英语表达习惯，同时修正时态错误。",
      type: "logic"
    }
  ];
  
  evaluationResult.value = {
    score: 75,
    strengths: [
      "文章结构清晰，有基本的叙述框架",
      "尝试使用了描述性语言表达个人经历",
      "表达了个人观点和未来计划",
      "内容主题明确，围绕公园游览展开"
    ],
    improvements: [
      "注意语法时态的一致性，特别是过去时态的正确使用",
      "提高词汇准确性，包括拼写和词语选择",
      "改进句子的逻辑结构，使表达更加清晰连贯",
      "注意其他细节问题，如标点符号的使用"
    ],
    comment: "总体来说，这篇短文结构完整，表达了您的公园游览经历，但存在多处基础语法错误和逻辑表达问题。主要问题集中在时态使用和主谓一致方面，建议重点复习这些语法规则。此外，通过调整句子结构和逻辑关系，可以使文章表达更加清晰自然。继续练习写作，特别关注语法基础和逻辑表达，您的英文写作能力会有明显提升。"
  };
};
</script>

<style scoped>
.essay-correction {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0;
  font-family: Arial, sans-serif;
  line-height: 1.6;
  color: #333;
}

.header {
  text-align: center;
  margin-bottom: 20px;
  padding: 15px;
  background-color: #fff;
  border-radius: 8px 8px 0 0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.content-wrapper {
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow: auto;
}

.input-panel {
  flex: 1;
  min-width: 300px;
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

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
  font-style: italic;
  color: #666;
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

@media (max-width: 768px) {
  .content-wrapper {
    flex-direction: column;
  }
}
</style> 