/**
 * Unified FOCEYE Clinical API Client
 * Connects to FastAPI Backend with automatic cloud fallback and JWT token management.
 */

export class ApiClient {
  static getBaseUrl(): string {
    const raw = (import.meta.env.VITE_API_URL || '').trim();
    if (!raw) {
      return 'https://foceye1-backend-only.onrender.com/api/v1';
    }
    const clean = raw.replace(/\/+$/, '');
    return clean.endsWith('/api/v1') ? clean : `${clean}/api/v1`;
  }

  private static token: string | null =
    localStorage.getItem('foceye_auth_token') || localStorage.getItem('foceye_token');

  static setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('foceye_auth_token', token);
      localStorage.setItem('foceye_token', token);
    } else {
      localStorage.removeItem('foceye_auth_token');
      localStorage.removeItem('foceye_token');
    }
  }

  static getToken(): string | null {
    if (!this.token) {
      this.token =
        localStorage.getItem('foceye_auth_token') || localStorage.getItem('foceye_token');
    }
    return this.token;
  }

  static isAuthenticated(): boolean {
    return Boolean(this.getToken());
  }

  static async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  static async post<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  static async put<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  static async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.getBaseUrl()}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401 && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('foceye:unauthorized'));
      }
      const errorBody = await response.text();
      let errorMsg = `API Error ${response.status}: ${response.statusText}`;
      try {
        const parsed = JSON.parse(errorBody);
        if (parsed.detail) errorMsg = parsed.detail;
      } catch {
        // ignore JSON parse error
      }
      throw new Error(errorMsg);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  static async downloadBlob(endpoint: string, body?: any): Promise<Blob> {
    const url = `${this.getBaseUrl()}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`Download failed with status ${response.status}`);
    }

    return response.blob();
  }
}
