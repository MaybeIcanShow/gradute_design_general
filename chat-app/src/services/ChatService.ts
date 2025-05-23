import axios from 'axios';
import type { Session } from '@/types/chat';
import type { Message } from '@/types/message';

// Define API base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://111.229.252.69:8000';

// Helper function to get auth token
const getAuthToken = (): string => {
  return localStorage.getItem('token') || '';
};

// Chat service class
export default class ChatService {
  // Fetch all sessions
  static async fetchSessions(): Promise<Session[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/sessions`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`
        },
        params: {
          skip: 0,
          limit: 100
        }
      });
      
      // Sort sessions by updated_at, newest first
      return response.data.sort((a: Session, b: Session) => {
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });
    } catch (error) {
      console.error('Error fetching sessions:', error);
      throw error;
    }
  }

  // Fetch messages for a session
  static async fetchMessages(sessionId: string): Promise<Message[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/sessions/${sessionId}/messages`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`
        },
        params: {
          skip: 0,
          limit: 100
        }
      });
      
      // Check if response has the expected format
      if (response.data && response.data.messages && Array.isArray(response.data.messages)) {
        // Sort messages by created_at, oldest first
        return response.data.messages.sort((a: Message, b: Message) => {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });
      } else {
        console.error('Unexpected response format:', response.data);
        return [];
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  // Create a new session
  static async createSession(title: string = '新建会话', chat_type: string = 'history'): Promise<Session> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/sessions`,
        { title, chat_type },
        {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  // Delete a session
  static async deleteSession(sessionId: string): Promise<void> {
    try {
      console.log(`Deleting session with ID: ${sessionId}`);
      const response = await axios.delete(`${API_BASE_URL}/api/sessions/${sessionId}`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`
        }
      });
      console.log('Session deletion response:', response.status, response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error deleting session:', error);
      if (error.response) {
        console.error('Error response:', error.response.status, error.response.data);
      }
      throw error;
    }
  }

  // Update session title
  static async updateSessionTitle(sessionId: string, title: string): Promise<void> {
    try {
      await axios.patch(
        `${API_BASE_URL}/api/sessions/${sessionId}`,
        { title },
        {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`
          }
        }
      );
    } catch (error) {
      console.error('Error updating session title:', error);
      throw error;
    }
  }



  // Send message and get streaming response (deprecated - use messagesApi instead)
  static async sendMessage(sessionId: string, content: string): Promise<ReadableStreamDefaultReader<Uint8Array>> {
    try {
      const streamUrl = `${API_BASE_URL}/api/sessions/${sessionId}/messages`;
      const requestData = { content };
      
      const response = await fetch(streamUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      if (!response.body) {
        throw new Error('ReadableStream not supported');
      }
      
      return response.body.getReader();
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }
  
  // Send message with image
  static async sendMessageWithImage(sessionId: string, content: string, imageFile: File | null): Promise<ReadableStreamDefaultReader<Uint8Array>> {
    try {
      if (!imageFile) {
        // If no image, use regular message API
        return this.sendMessage(sessionId, content);
      }
      
      const formData = new FormData();
      formData.append('content', content);
      formData.append('image', imageFile);
      
      const streamUrl = `${API_BASE_URL}/api/sessions/${sessionId}/messages-with-image`;
      
      const response = await fetch(streamUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      if (!response.body) {
        throw new Error('ReadableStream not supported');
      }
      
      return response.body.getReader();
    } catch (error) {
      console.error('Error sending message with image:', error);
      throw error;
    }
  }
}
