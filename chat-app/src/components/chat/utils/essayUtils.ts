// Utility functions for essay correction component

import type { EssayCorrection } from '@/api/essays';

// Error type definitions
export const errorTypeColors: Record<string, string> = {
  grammar: "red",
  vocabulary: "#9c27b0",
  logic: "#ff5722",
  other: "#009688"
};

export const errorTypeNames: Record<string, string> = {
  grammar: "语法错误",
  vocabulary: "词汇错误",
  logic: "表达逻辑错误",
  other: "其他错误"
};

// Compute score color based on essay score
export const getScoreColor = (score: number, stage?: string): string => {
  // Get score percentage for consistent color mapping
  const percentage = getScorePercentage(score, stage);
  
  if (percentage >= 90) return "#388e3c";
  if (percentage >= 80) return "#689f38";
  if (percentage >= 70) return "#ffa000";
  if (percentage >= 60) return "#f57c00";
  return "#d32f2f";
};

// Compute score level based on score
export const getScoreLevel = (score: number, stage?: string): string => {
  // Get score percentage for consistent level mapping
  const percentage = getScorePercentage(score, stage);
  
  if (percentage >= 90) return "优秀";
  if (percentage >= 80) return "良好";
  if (percentage >= 70) return "中等";
  if (percentage >= 60) return "及格";
  return "不及格";
};

// Helper function to convert score to percentage based on max score
const getScorePercentage = (score: number, stage?: string): number => {
  const maxScore = stage === 'gaokao' ? 25 : 15;
  return (score / maxScore) * 100;
};

// Group errors by type
export const groupErrorsByType = (corrections: EssayCorrection[]): Record<string, EssayCorrection[]> => {
  const groups: Record<string, EssayCorrection[]> = {};
  corrections.forEach(error => {
    const type = error.type;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(error);
  });
  return groups;
};

// Generate corrected essay HTML with error highlighting
export const generateCorrectedEssayHtml = (originalText: string, corrections: EssayCorrection[]): string => {
  if (!originalText || !corrections.length) return originalText.replace(/\n/g, '<br>');
  
  let html = originalText;
  
  // Process from end to beginning to avoid offset issues
  for (let i = corrections.length - 1; i >= 0; i--) {
    const correction = corrections[i];
    const cssClass = `${correction.type}-error`;
    
    const replacement = `<span class="${cssClass} tooltip">${correction.original}<span class="tooltiptext"><strong>错误类型:</strong> ${errorTypeNames[correction.type]}<br><strong>建议:</strong> ${correction.corrected}<br><strong>说明:</strong> ${correction.explanation}</span></span>`;
    
    html = html.replace(correction.original, replacement);
  }
  
  return html.replace(/\n/g, '<br>');
};

// Calculate essay statistics
export interface EssayStats {
  wordCount: number;
  sentenceCount: number;
  errorCount: number;
}

export const calculateEssayStats = (text: string, errorCount: number): EssayStats => {
  // Calculate word count
  const words = text.trim().split(/\s+/);
  
  // Calculate sentence count
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  return {
    wordCount: words.length,
    sentenceCount: sentences.length,
    errorCount
  };
}; 