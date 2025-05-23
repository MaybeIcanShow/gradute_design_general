export interface Session {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  chat_type?: 'general' | 'history' | 'math' | 'english';
}

export interface Message {
  id: number | string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}
