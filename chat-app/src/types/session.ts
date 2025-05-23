export interface SessionCreate {
  title?: string;
  chat_type?: string;
}

export interface Session {
  id: number;
  title: string | null;
  chat_type: string | null;
  created_at: string;
  updated_at: string;
  is_archived: boolean;
}

export interface SessionDetail extends Session {
  messages: any[]; // Will be replaced with Message type when implemented
}

export interface SessionUpdate {
  title: string | null;
}

export interface SessionUpdateResponse {
  id: number;
  title: string;
  updated_at: string;
}
