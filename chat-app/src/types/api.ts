// API response types
export interface ApiError {
  detail: string | Array<{
    loc: string[]
    msg: string
    type: string
  }>
  status_code: number
}

// Pagination parameters
export interface PaginationParams {
  skip?: number
  limit?: number
}

// Generic API response
export interface ApiResponse<T> {
  data: T
  status: number
  statusText: string
}
