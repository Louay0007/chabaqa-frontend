/**
 * API Client for Chabaqa Frontend
 * Provides a typed HTTP client with automatic token management
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"

interface RequestConfig extends RequestInit {
  params?: Record<string, any>
}

interface ApiResponse<T = any> {
  data: T
  message?: string
  statusCode?: number
}

class ApiClient {
  private baseURL: string

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  private getToken(isAdmin: boolean = false): string | null {
    if (typeof window === 'undefined') return null
    
    const tokenKey = isAdmin ? 'admin_access_token' : 'accessToken'
    return localStorage.getItem(tokenKey)
  }

  private buildURL(endpoint: string, params?: Record<string, any>): string {
    const url = new URL(`${this.baseURL}${endpoint}`)
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value))
        }
      })
    }
    
    return url.toString()
  }

  private async request<T = any>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const { params, headers, ...restConfig } = config
    
    // Determine if this is an admin request
    const isAdminRequest = endpoint.startsWith('/admin')
    const isAuthEndpoint = endpoint.startsWith('/admin/login') || endpoint.startsWith('/admin/verify-2fa') || endpoint.startsWith('/admin/refresh') || endpoint.startsWith('/admin/logout') || endpoint.startsWith('/admin/forgot-password') || endpoint.startsWith('/admin/reset-password')
    
    // Get appropriate token
    const token = !isAuthEndpoint ? this.getToken(isAdminRequest) : null
    
    const url = this.buildURL(endpoint, params)
    
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(headers as Record<string, string>),
    }
    
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`
    }
    
    try {
      const response = await fetch(url, {
        ...restConfig,
        headers: requestHeaders,
        credentials: 'include',
      })
      
      // Handle non-JSON responses
      const contentType = response.headers.get('content-type')
      if (!contentType?.includes('application/json')) {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        return { data: null as T }
      }
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`)
      }
      
      return data
    } catch (error) {
      console.error(`[API Client] Error:`, error)
      throw error
    }
  }

  async get<T = any>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', params })
  }

  async post<T = any>(endpoint: string, body?: any, params?: Record<string, any>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      params,
    })
  }

  async put<T = any>(endpoint: string, body?: any, params?: Record<string, any>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      params,
    })
  }

  async patch<T = any>(endpoint: string, body?: any, params?: Record<string, any>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
      params,
    })
  }

  async delete<T = any>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE', params })
  }
}

export const apiClient = new ApiClient(API_BASE_URL)
export default apiClient
