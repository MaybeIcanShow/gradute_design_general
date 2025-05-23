import apiClient from './index'
import type { Message, MessageCreate, MessageResponse } from '../types/message'

/**
 * Messages API service
 * Implements the API methods defined in openapi.json
 */
export const messagesApi = {
  /**
   * Diagnostic function to check API connectivity
   * This can help identify connection issues
   */
  checkApiConnection: async (): Promise<{success: boolean, message: string, details: any}> => {
    try {
      // Store API URL for logging
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://111.229.252.69:8000';
      console.log('[API] Checking connection to API:', apiBaseUrl);
      
      // Try a simple request to check connectivity
      const response = await fetch(`${apiBaseUrl}/api/health-check`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      console.log('[API] Health check status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          message: 'API connection successful',
          details: {
            apiUrl: apiBaseUrl,
            status: response.status,
            data
          }
        };
      } else {
        // If health-check endpoint doesn't exist, try the base API URL
        try {
          const fallbackResponse = await fetch(apiBaseUrl, {
            method: 'GET'
          });
          
          return {
            success: fallbackResponse.status < 500,
            message: `API health check failed, but base URL is reachable. Status: ${fallbackResponse.status}`,
            details: {
              apiUrl: apiBaseUrl,
              status: fallbackResponse.status,
              originalStatus: response.status
            }
          };
        } catch (fallbackError: any) {
          return {
            success: false,
            message: 'API connection failed completely',
            details: {
              apiUrl: apiBaseUrl,
              originalStatus: response.status,
              fallbackError: fallbackError
            }
          };
        }
      }
    } catch (error: any) {
      console.error('[API] Connection check error:', error);
      return {
        success: false,
        message: `API connection error: ${error.message}`,
        details: {
          apiUrl: import.meta.env.VITE_API_BASE_URL || 'http://111.229.252.69:8000',
          error
        }
      };
    }
  },

  /**
   * Get messages for a session
   * GET /api/sessions/{session_id}/messages
   * @param sessionId Session ID
   * @param skip Number of items to skip
   * @param limit Maximum number of items to return
   * @returns Promise with array of messages
   */
  getMessages: async (sessionId: number, skip: number = 0, limit: number = 100): Promise<Message[]> => {
    const response = await apiClient.get(`/api/sessions/${sessionId}/messages`, {
      params: { skip, limit }
    })
    return response.data.messages
  },
  
  /**
   * Create a new message in a session
   * POST /api/sessions/{session_id}/messages
   * @param sessionId Session ID
   * @param messageData Message creation data
   * @returns Promise with created message
   */
  createMessage: async (
    sessionId: number, 
    messageData: MessageCreate
  ): Promise<void> => {
    // For streaming, we'll implement a custom fetch with ReadableStream
    // This will be handled separately in the component
    throw new Error('Direct message creation is not supported. Use createMessageStream instead.')
  },
  
  /**
   * Upload an image to the server
   * POST /api/sessions/{session_id}/upload-image
   * @param sessionId Session ID
   * @param file Image file to upload
   * @returns Promise with the image path
   */
  uploadImage: async (sessionId: number, file: File): Promise<string> => {
    console.log('[API] uploadImage called with file:', file.name, 'size:', file.size, 'type:', file.type);
    
    try {
      // Create form data
    const formData = new FormData()
    formData.append('file', file)
    
      console.log('[API] FormData created with file appended');
      
      // Get auth token
      const token = localStorage.getItem('token');
      console.log('[API] Token exists:', !!token);
      
      // Enhanced headers for better file upload handling
      const headers = {
        'Content-Type': 'multipart/form-data',
        // Don't set Content-Length, browser will calculate it
        'Accept': 'application/json'
      };
      
      // Log request details
      console.log('[API] Uploading image to:', `/api/sessions/${sessionId}/upload-image`);
      
      // Make the request
    const response = await apiClient.post(
      `/api/sessions/${sessionId}/upload-image`,
      formData,
        { headers }
      );
      
      console.log('[API] Image upload successful, response:', response.status, response.statusText);
      console.log('[API] Image path received:', response.data.image_path);
      
      return response.data.image_path;
    } catch (error: any) {
      console.error('[API] Image upload failed:', error);
      
      // More detailed error logging
      if (error.response) {
        console.error('[API] Upload error response:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
      } else if (error.request) {
        console.error('[API] Upload no response received:', error.request);
      } else {
        console.error('[API] Upload error message:', error.message);
      }
      
      // Try alternative upload approach with fetch API as fallback
      try {
        console.log('[API] Trying alternative upload method with fetch API');
        
        const formData = new FormData();
        formData.append('file', file);
        
        const token = localStorage.getItem('token');
        const headers: Record<string, string> = {};
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const url = `${import.meta.env.VITE_API_BASE_URL}/api/sessions/${sessionId}/upload-image`;
        
        const fetchResponse = await fetch(url, {
          method: 'POST',
          headers,
          body: formData
        });
        
        if (!fetchResponse.ok) {
          throw new Error(`HTTP error! status: ${fetchResponse.status}`);
        }
        
        const data = await fetchResponse.json();
        console.log('[API] Alternative upload successful, response:', data);
        
        return data.image_path;
      } catch (fetchError: any) {
        console.error('[API] Alternative upload also failed:', fetchError);
        throw new Error(`图片上传失败: ${error.message || '未知错误'}`);
      }
    }
  },
  
  /**
   * Create a message with image
   * POST /api/sessions/{session_id}/messages-with-image
   * @param sessionId Session ID
   * @param content Message text content
   * @param imageFile Optional image file
   * @param onChunk Callback function for each chunk of text
   * @param onComplete Callback function when stream completes
   * @param onError Callback function when error occurs
   */
  createMessageWithImage: async (
    sessionId: number,
    content: string,
    imageFile: File | null,
    onChunk: (text: string) => void,
    onComplete: () => void,
    onError: (error: any) => void
  ): Promise<void> => {
    try {
      console.log('[API] createMessageWithImage called with sessionId:', sessionId);
      console.log('[API] content:', content);
      console.log('[API] imageFile:', imageFile ? `${imageFile.name} (${imageFile.size} bytes)` : 'null');
      
      const formData = new FormData()
      formData.append('content', content)
      
      if (imageFile) {
        formData.append('image', imageFile)
        console.log('[API] Added image to FormData:', imageFile.name);
      }
      
      // Get the token from localStorage
      const token = localStorage.getItem('token')
      console.log('[API] Auth token exists:', !!token);
      
      // Create headers with authorization
      const headers: Record<string, string> = {
        'Accept': 'text/event-stream'
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      console.log('[API] Request headers:', JSON.stringify(headers));
      const requestUrl = `${import.meta.env.VITE_API_BASE_URL}/api/sessions/${sessionId}/messages-with-image`;
      console.log('[API] Making request to:', requestUrl);
      
      // Make fetch request with streaming
      const response = await fetch(
        requestUrl,
        {
          method: 'POST',
          headers,
          body: formData
        }
      )
      
      console.log('[API] Response status:', response.status);
      console.log('[API] Response status text:', response.statusText);
      console.log('[API] Response headers:', JSON.stringify(Object.fromEntries([...response.headers])));
      
      if (!response.ok) {
        const errorText = await response.text().catch(e => 'Failed to get response text');
        console.error('[API] Error response body:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, statusText: ${response.statusText}, body: ${errorText}`)
      }
      
      if (!response.body) {
        console.error('[API] Response body is null');
        throw new Error('Response body is null')
      }
      
      console.log('[API] Starting to process stream');
      // Process the stream
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      
      while (true) {
        const { value, done } = await reader.read()
        
        if (done) {
          console.log('[API] Stream reading complete');
          break
        }
        
        // Decode the chunk and process it
        const chunk = decoder.decode(value, { stream: true })
        console.log('[API] Received chunk:', chunk);
        
        // Call the onChunk callback with the new text
        onChunk(chunk)
      }
      
      console.log('[API] Stream completed successfully');
      onComplete()
    } catch (error: any) {
      console.error('[API] Error in createMessageWithImage:', error);
      console.error('[API] Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      onError(error)
    }
  },
  
  /**
   * Create a message with streaming response
   * This is a custom implementation for handling streaming responses
   * @param sessionId Session ID
   * @param messageData Message creation data
   * @param onChunk Callback function for each chunk of text
   * @param onComplete Callback function when stream completes
   * @param onError Callback function when error occurs
   */
  createMessageStream: async (
    sessionId: number,
    messageData: MessageCreate,
    onChunk: (text: string) => void,
    onComplete: () => void,
    onError: (error: any) => void
  ): Promise<void> => {
    try {
      console.log('[API] createMessageStream called with sessionId:', sessionId);
      console.log('[API] messageData:', JSON.stringify(messageData));
      
      // Get the token from localStorage
      const token = localStorage.getItem('token')
      console.log('[API] Auth token exists:', !!token);
      
      // Create headers with authorization
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      console.log('[API] Request headers:', JSON.stringify(headers));
      const requestUrl = `${import.meta.env.VITE_API_BASE_URL}/api/sessions/${sessionId}/messages`;
      console.log('[API] Making request to:', requestUrl);
      
      // Make fetch request with streaming
      const response = await fetch(
        requestUrl,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(messageData)
        }
      )
      
      console.log('[API] Response status:', response.status);
      console.log('[API] Response status text:', response.statusText);
      console.log('[API] Response headers:', JSON.stringify(Object.fromEntries([...response.headers])));
      
      if (!response.ok) {
        const errorText = await response.text().catch(e => 'Failed to get response text');
        console.error('[API] Error response body:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, statusText: ${response.statusText}, body: ${errorText}`)
      }
      
      if (!response.body) {
        console.error('[API] Response body is null');
        throw new Error('Response body is null')
      }
      
      console.log('[API] Starting to process stream');
      // Process the stream
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      
      while (true) {
        const { value, done } = await reader.read()
        
        if (done) {
          console.log('[API] Stream reading complete');
          break
        }
        
        // Decode the chunk and process it
        const chunk = decoder.decode(value, { stream: true })
        console.log('[API] Received chunk:', chunk);
        
        // Call the onChunk callback with the new text
        onChunk(chunk)
      }
      
      console.log('[API] Stream completed successfully');
      onComplete()
    } catch (error: any) {
      console.error('[API] Error in createMessageStream:', error);
      console.error('[API] Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      onError(error)
    }
  }
}
