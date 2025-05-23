import apiClient from './index';
import { API_BASE_URL } from '@/config';

// 作文相关接口
export interface Essay {
  id: number;
  session_id: number;
  stage: 'cet4' | 'cet6' | 'gaokao';
  requirement?: string;
  content: string;
  score: number | null;
  comment: string | null;
  created_at: string;
  updated_at: string;
  corrections?: EssayCorrection[];
  strengths?: string[];
  improvements?: string[];
}

export interface EssayCorrection {
  original: string;
  corrected: string;
  explanation: string;
  type: 'grammar' | 'vocabulary' | 'logic' | 'other';
}

export interface EssayCorrectionResult {
  essay: Essay;
  corrections: EssayCorrection[];
  strengths: string[];
  improvements: string[];
}

export const essaysApi = {
  // 创建新作文
  async createEssay(sessionId: number | string, content: string, stage: 'cet4' | 'cet6' | 'gaokao', requirement?: string): Promise<Essay> {
    const response = await apiClient.post<Essay>(`/api/essays/`, {
      session_id: sessionId,
      stage,
      content,
      requirement
    });
    return response.data;
  },

  // 获取特定作文
  async getEssay(essayId: number | string): Promise<Essay> {
    const response = await apiClient.get<Essay>(`/api/essays/${essayId}`);
    return response.data;
  },

  // 获取会话中的所有作文
  async getSessionEssays(sessionId: number | string): Promise<Essay[]> {
    const response = await apiClient.get<Essay[]>(`/api/sessions/${sessionId}/essays/`);
    return response.data;
  },

  // 批改作文
  async correctEssay(essayId: number | string): Promise<EssayCorrectionResult> {
    const response = await apiClient.post<EssayCorrectionResult>(`/api/essays/${essayId}/correct`);
    return response.data;
  },

  // 删除作文
  async deleteEssay(essayId: number | string): Promise<void> {
    await apiClient.delete(`/api/essays/${essayId}`);
  },

  // 获取特定作文，包含完整批改结果
  async getEssayWithResults(essayId: number | string): Promise<Essay> {
    const response = await apiClient.get<Essay>(`/api/essays/${essayId}?include_results=true`);
    return response.data;
  }
}; 