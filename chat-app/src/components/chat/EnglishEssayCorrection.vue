<template>
  <div class="essay-correction">
    <div class="content-wrapper">
      <div class="combined-panel">
        <h2 class="panel-title">英文作文批改</h2>
        
        <!-- 阶段选择 -->
        <div class="stage-selector">
          <span class="stage-label">考试类型：</span>
          <div class="stage-options">
            <label v-for="option in stageOptions" :key="option.value">
              <input 
                type="radio" 
                :value="option.value" 
                v-model="selectedStage" 
                :disabled="sending || localSending"
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
            v-model="requirement" 
            placeholder="请输入作文题目或要求..."
            :disabled="sending || localSending"
            rows="2"
            class="requirement-textarea"
          ></textarea>
        </div>
        
        <!-- 原文输入 -->
        <textarea 
          class="essay-input" 
          v-model="essayText" 
          placeholder="请在此输入您的英文作文..."
          :disabled="sending || localSending"
        ></textarea>
        
        <button class="btn" @click="submitEssay" :disabled="(sending || localSending) || !essayText.trim()">
          {{ isHistorical ? '重新批改' : (sending || localSending ? '批改中...' : '批改作文') }}
        </button>
        
        <div v-if="sending || localSending" class="loading">
          <div class="loading-spinner"></div>
          <div class="loading-text">正在分析您的作文，请稍候...</div>
          <div class="loading-detail">这可能需要1-2分钟的时间，AI正在进行语法、词汇、逻辑和表达分析</div>
        </div>
        
        <!-- 批改结果部分 -->
        <div v-if="!showResult && !(sending || localSending)" class="empty-result">
          点击{{ isHistorical ? '"重新批改"' : '"批改作文"' }}按钮{{ isHistorical ? '更新' : '获取' }}批改结果
        </div>
        
        <transition name="fade">
          <div v-if="showResult" class="result-section">
            <h3 class="result-title">
              批改结果
              <span v-if="isHistorical" class="historical-badge">历史结果</span>
            </h3>
            
            <!-- 错误类型图例 -->
            <ErrorLegend class="text-left" />
            
            <!-- 批改后的文章 -->
            <h4 class="text-left">批改详情 <small style="font-weight: normal; color: #666;">(鼠标悬停在标记处查看详细说明)</small></h4>
            <div class="corrected-essay text-left" v-html="correctedEssay"></div>
            
            <!-- 统计信息 -->
            <EssayStatistics :stats="essayStats" :score="currentEssay?.score || 0" :stage="selectedStage" class="text-left" />
            
            <!-- 分析细节 -->
            <ErrorTypeAnalysis :grouped-errors="groupedErrors" class="text-left" />
            
            <!-- 评分建议 -->
            <EvaluationResult 
              :score="currentEssay?.score || 0"
              :strengths="strengths"
              :improvements="improvements"
              :stage="selectedStage"
              :comment="currentEssay?.comment || ''"
              class="text-left"
            />
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, defineEmits, defineProps, onMounted, watch } from 'vue';
import type { Session } from '@/types/chat';
import { essaysApi, type Essay, type EssayCorrection } from '@/api/essays';
import { MessagePlugin } from 'tdesign-vue-next';
import { ErrorLegend, EssayStatistics, ErrorTypeAnalysis, EvaluationResult } from './components';
import { calculateEssayStats, generateCorrectedEssayHtml, groupErrorsByType, type EssayStats } from './utils/essayUtils';

const props = defineProps<{
  currentSession: Session | null;
  currentSessionId: string | null;
  sending: boolean;
}>();

const emit = defineEmits<{
  (e: 'send-message', content: string, imageFile?: File | null): void;
}>();

// 响应式数据
const essayText = ref('');
const showResult = ref(false);
const selectedStage = ref('cet4');
const requirement = ref('');
const corrections = ref<EssayCorrection[]>([]);
const strengths = ref<string[]>([]);
const improvements = ref<string[]>([]);
const currentEssay = ref<Essay | null>(null);
const currentEssayId = ref<number | null>(null);
const localSending = ref(false);
const isHistorical = ref(false);

// Stage options
const stageOptions = [
  { value: 'cet4', label: 'CET-4' },
  { value: 'cet6', label: 'CET-6' },
  { value: 'gaokao', label: '高考' }
];

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

// 加载会话中的上一次作文（如果有）
const loadPreviousEssay = async () => {
  if (!props.currentSessionId) {
    console.log('[EnglishEssayCorrection] 无效的会话ID，无法加载作文');
    return;
  }
  
  try {
    console.log(`[EnglishEssayCorrection] 正在为会话 ${props.currentSessionId} 加载作文...`);
    localSending.value = true;
    const essays = await essaysApi.getSessionEssays(props.currentSessionId);
    
    console.log(`[EnglishEssayCorrection] 获取到 ${essays.length} 篇作文`);
    
    if (essays.length > 0) {
      // 获取最新的作文
      const latestEssay = essays[essays.length - 1];
      currentEssayId.value = latestEssay.id;
      
      console.log(`[EnglishEssayCorrection] 获取作文详情: ID=${latestEssay.id}`);
      
      // 获取完整的作文详情，包含批改结果
      try {
        // 使用包含批改结果的API
        const essayDetail = await essaysApi.getEssayWithResults(latestEssay.id);
        currentEssay.value = essayDetail;
        
        // 如果有内容，填充到表单
        essayText.value = essayDetail.content;
        selectedStage.value = essayDetail.stage;
        requirement.value = essayDetail.requirement || '';
        
        console.log(`[EnglishEssayCorrection] 成功加载作文内容, 长度: ${essayDetail.content.length}字符`);
        
        // 如果已经批改过（有分数），直接显示历史批改结果
        if (essayDetail.score !== null && essayDetail.corrections) {
          // 使用现有的批改结果而不是重新调用批改API
          corrections.value = essayDetail.corrections;
          strengths.value = essayDetail.strengths || [];
          improvements.value = essayDetail.improvements || [];
          
          // 计算统计信息
          calculateStats();
          showResult.value = true;
          // 标记这是历史批改结果
          isHistorical.value = true;
          
          console.log('[EnglishEssayCorrection] 已加载历史批改结果:', {
            score: essayDetail.score,
            corrections: corrections.value.length,
            strengths: strengths.value.length,
            improvements: improvements.value.length
          });
        } else {
          console.log('[EnglishEssayCorrection] 作文尚未批改或没有批改结果');
          showResult.value = false;
          isHistorical.value = false;
        }
      } catch (error) {
        console.error('[EnglishEssayCorrection] 获取作文详情失败:', error);
        MessagePlugin.warning('无法加载完整的作文详情，请尝试重新批改');
        // 确保UI不会卡在加载状态
        showResult.value = false;
      }
    } else {
      console.log('[EnglishEssayCorrection] 此会话没有作文记录');
      // 清空表单，让用户创建新作文
      essayText.value = '';
      requirement.value = '';
      showResult.value = false;
      isHistorical.value = false;
    }
  } catch (error) {
    console.error('[EnglishEssayCorrection] 加载会话作文失败:', error);
    MessagePlugin.warning('加载作文失败，请重试');
    // 确保UI不会卡在加载状态
    showResult.value = false;
  } finally {
    localSending.value = false;
  }
};

// 批改方法
const submitEssay = async () => {
  if (!essayText.value.trim()) {
    MessagePlugin.warning('请输入作文内容');
    return;
  }
  
  if (!props.currentSessionId) {
    MessagePlugin.error('无效的会话ID');
    return;
  }
  
  try {
    // 使用父组件传递的sending状态或本地状态
    localSending.value = true;
    
    // 检查是否已登录（是否有token）
    const token = localStorage.getItem('token');
    if (!token) {
      MessagePlugin.error('您需要先登录才能使用此功能');
      // 可以添加导航到登录页面的代码
      return;
    }
    
    console.log(`[EnglishEssayCorrection] 开始创建和批改作文，会话ID: ${props.currentSessionId}`);
    console.log(`[EnglishEssayCorrection] 作文类型: ${selectedStage.value}, 长度: ${essayText.value.length}字符`);
    
    // 1. 创建新作文
    const essay = await essaysApi.createEssay(
      props.currentSessionId,
      essayText.value,
      selectedStage.value as 'cet4' | 'cet6' | 'gaokao',
      requirement.value || undefined
    );
    
    currentEssayId.value = essay.id;
    console.log(`[EnglishEssayCorrection] 作文创建成功，ID: ${essay.id}`);
    
    // 2. 批改作文
    console.log(`[EnglishEssayCorrection] 开始批改作文，这可能需要1-2分钟...`);
    try {
      const result = await essaysApi.correctEssay(essay.id);
      console.log(`[EnglishEssayCorrection] 作文批改成功，获取到 ${result.corrections.length} 处修改建议`);
      
      // 3. 更新UI显示结果
      currentEssay.value = result.essay;
      corrections.value = result.corrections;
      strengths.value = result.strengths;
      improvements.value = result.improvements;
      
      // 4. 计算统计数据
      calculateStats();
      
      // 5. 显示结果
      showResult.value = true;
      
      // 6. 更新标记，这不再是历史批改结果
      isHistorical.value = false;
      
      // 成功消息提示
      MessagePlugin.success('作文批改完成');
    } catch (correctionError: any) {
      console.error('[EnglishEssayCorrection] 作文批改过程中出错:', correctionError);
      
      // 特定错误处理
      if (correctionError.status === 504 || correctionError.statusText === 'Gateway Timeout') {
        MessagePlugin.error('作文批改超时，服务器可能繁忙，请稍后重试');
      } else {
        // 通用错误处理
        let errorMsg = '作文批改失败';
        if (correctionError.data && correctionError.data.detail) {
          errorMsg += ': ' + correctionError.data.detail;
        } else if (correctionError.message) {
          errorMsg += ': ' + correctionError.message;
        }
        MessagePlugin.error(errorMsg);
      }
      
      // 即使批改失败，仍然保留用户的作文内容
      showResult.value = false;
    }
  } catch (error: any) {
    console.error('[EnglishEssayCorrection] 作文创建或批改失败:', error);
    
    // 更详细的错误信息处理
    if (error.status === 401) {
      MessagePlugin.error('未授权，请登录后再试');
      // 可以添加导航到登录页面的代码
    } else {
      let errorMsg = '作文批改失败';
      
      // 尝试从错误响应中提取更具体的错误消息
      if (error.data && error.data.detail) {
        errorMsg += ': ' + error.data.detail;
      } else if (error.message) {
        errorMsg += ': ' + error.message;
      }
      
      MessagePlugin.error(errorMsg);
    }
  } finally {
    localSending.value = false;
  }
};

// 组件挂载时，尝试加载之前的作文
onMounted(() => {
  loadPreviousEssay();
});

// 监听会话ID变化，重新加载作文
watch(() => props.currentSessionId, (newSessionId, oldSessionId) => {
  if (newSessionId && newSessionId !== oldSessionId) {
    console.log('[EnglishEssayCorrection] 会话ID变化，重新加载作文:', newSessionId);
    // 重置状态
    essayText.value = '';
    corrections.value = [];
    strengths.value = [];
    improvements.value = [];
    currentEssay.value = null;
    currentEssayId.value = null;
    showResult.value = false;
    isHistorical.value = false;
    
    // 加载新会话的作文
    loadPreviousEssay();
  }
});
</script>

<style scoped>
.essay-correction {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20px;
  overflow: auto;
}

.content-wrapper {
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
  overflow: auto;
}

.combined-panel {
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
  min-height: 200px;
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

.empty-result {
  text-align: center;
  padding: 30px;
  color: #999;
  font-style: italic;
  border: 1px dashed #ddd;
  border-radius: 4px;
  margin-top: 20px;
}

.result-section {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 2px solid #eee;
  text-align: left;
}

.result-title {
  margin-top: 0;
  color: #333;
  display: flex;
  align-items: center;
}

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

.corrected-essay {
  margin-bottom: 20px;
  line-height: 1.8;
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 4px;
  min-height: 100px;
  background-color: #fefefe;
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

.text-left {
  text-align: left;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style> 