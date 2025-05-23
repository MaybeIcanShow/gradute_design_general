declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// Declare path alias modules
declare module '@/types/chat' {
  export interface Session {
    id: string;
    title: string;
    created_at: string;
    updated_at: string;
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
}
