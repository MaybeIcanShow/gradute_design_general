export type MessageRole = 'user' | 'assistant' | 'system';

export interface MessageCreate {
  content: string;
  image_path?: string;
}

export interface Message {
  id: number;
  session_id: number;
  role: MessageRole;
  content: string;
  created_at: string;
  image_path?: string;
}

export interface MessageResponse {
  id: number;
  session_id: number;
  role: MessageRole;
  content: string;
  created_at: string;
  image_path?: string;
}
