import apiClient from './index'
import type { Session, SessionCreate, SessionDetail, SessionUpdate, SessionUpdateResponse } from '../types/session'

/**
 * Sessions API service
 * Implements the API methods defined in openapi.json
 */
export const sessionsApi = {
  /**
   * Get all sessions for the current user
   * GET /api/sessions
   * @param skip Number of items to skip
   * @param limit Maximum number of items to return
   * @returns Promise with array of sessions
   */
  getSessions: async (skip: number = 0, limit: number = 100): Promise<Session[]> => {
    const response = await apiClient.get<Session[]>('/api/sessions', {
      params: { skip, limit }
    })
    return response.data
  },
  
  /**
   * Create a new session
   * POST /api/sessions
   * @param sessionData Session creation data
   * @returns Promise with created session
   */
  createSession: async (sessionData: SessionCreate = {}): Promise<Session> => {
    const response = await apiClient.post<Session>('/api/sessions', sessionData)
    return response.data
  },
  
  /**
   * Get session details including messages
   * GET /api/sessions/{session_id}
   * @param sessionId Session ID
   * @returns Promise with session details
   */
  getSessionDetail: async (sessionId: number): Promise<SessionDetail> => {
    const response = await apiClient.get<SessionDetail>(`/api/sessions/${sessionId}`)
    return response.data
  },
  
  /**
   * Update session data
   * PATCH /api/sessions/{session_id}
   * @param sessionId Session ID
   * @param sessionData Session update data
   * @returns Promise with updated session data
   */
  updateSession: async (sessionId: number, sessionData: SessionUpdate): Promise<SessionUpdateResponse> => {
    const response = await apiClient.patch<SessionUpdateResponse>(`/api/sessions/${sessionId}`, sessionData)
    return response.data
  },
  
  /**
   * Delete a session
   * DELETE /api/sessions/{session_id}
   * @param sessionId Session ID
   * @returns Promise with void
   */
  deleteSession: async (sessionId: number): Promise<void> => {
    await apiClient.delete(`/api/sessions/${sessionId}`)
  }
}
