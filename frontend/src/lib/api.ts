import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getAuthToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          this.clearAuthToken()
          if (typeof window !== 'undefined') {
            window.location.href = '/auth'
          }
        }
        return Promise.reject(error)
      }
    )
  }

  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('echo_auth_token')
  }

  private setAuthToken(token: string): void {
    if (typeof window === 'undefined') return
    localStorage.setItem('echo_auth_token', token)
  }

  private clearAuthToken(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem('echo_auth_token')
  }

  async get<T>(url: string): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.get(url)
      return {
        success: true,
        data: response.data,
      }
    } catch (error) {
      return this.handleError(error as AxiosError)
    }
  }

  async post<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.post(url, data)
      return {
        success: true,
        data: response.data,
      }
    } catch (error) {
      return this.handleError(error as AxiosError)
    }
  }

  async put<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.put(url, data)
      return {
        success: true,
        data: response.data,
      }
    } catch (error) {
      return this.handleError(error as AxiosError)
    }
  }

  async delete<T>(url: string): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.delete(url)
      return {
        success: true,
        data: response.data,
      }
    } catch (error) {
      return this.handleError(error as AxiosError)
    }
  }

  async upload<T>(url: string, file: File, onProgress?: (progress: number) => void): Promise<ApiResponse<T>> {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await this.client.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            onProgress(progress)
          }
        },
      })

      return {
        success: true,
        data: response.data,
      }
    } catch (error) {
      return this.handleError(error as AxiosError)
    }
  }

  private handleError(error: AxiosError): ApiResponse {
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred'
    
    return {
      success: false,
      error: message,
      message,
    }
  }

  setToken(token: string): void {
    this.setAuthToken(token)
  }

  clearToken(): void {
    this.clearAuthToken()
  }
}

export const apiClient = new ApiClient()
export default apiClient
