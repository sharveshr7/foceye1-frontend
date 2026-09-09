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

  static isExpired(token: string | null): boolean {
    if (!token) return true;
    try {
      const parts = token.split('.');
      if (parts.length < 2) {
        if (token.startsWith('local_jwt_')) {
          const ts = parseInt(token.replace('local_jwt_', ''), 10);
          return Date.now() - ts > 24 * 3600 * 1000;
        }
        return false;
      }
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const payload = JSON.parse(jsonPayload);
      if (typeof payload.exp === 'number') {
        return payload.exp <= Math.floor(Date.now() / 1000);
      }
      return false;
    } catch {
      return false;
    }
  }

  static getToken(): string | null {
    if (!this.token) {
      this.token =
        localStorage.getItem('foceye_auth_token') || localStorage.getItem('foceye_token');
    }
    if (this.token && this.isExpired(this.token)) {
      this.setToken(null);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('foceye:unauthorized'));
      }
      return null;
    }
    return this.token;
  }

  static isAuthenticated(): boolean {
    return Boolean(this.getToken());
  }

  static async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  static async post<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  static async put<T>(endpoint: string, body?: unknown): Promise<T> {
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

  static async downloadBlob(endpoint: string, body?: unknown): Promise<Blob> {
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
