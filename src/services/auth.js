/**
 * CO-RESOLVE Frontend Authentication Service
 * Communicates with Python Authentication Service (http://localhost:5002/api/auth)
 */

const AUTH_API_BASE = (import.meta.env.VITE_AUTH_API_URL || 'http://localhost:5002/api/auth').replace(/\/+$/, '');

const TOKEN_KEY = 'co_resolve_token';
const USER_KEY = 'co_resolve_user';

export const auth = {
  getToken() {
    return localStorage.getItem(TOKEN_KEY) || null;
  },

  getUser() {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },

  getRole() {
    const user = this.getUser();
    return user ? user.role : null;
  },

  isAuthenticated() {
    return !!this.getToken();
  },

  async fetchAuth(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(`${AUTH_API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || `HTTP error ${response.status}`);
    }
    return data;
  },

  async login({ email, password }) {
    const data = await this.fetchAuth('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (data.token && data.user) {
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    }
    return data;
  },

  async registerVolunteer(payload) {
    const data = await this.fetchAuth('/register/volunteer', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (data.token && data.user) {
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    }
    return data;
  },

  async registerOrganization(payload) {
    const data = await this.fetchAuth('/register/organization', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (data.token && data.user) {
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    }
    return data;
  },

  async verifySession() {
    const token = this.getToken();
    if (!token) return { authenticated: false };

    try {
      const data = await this.fetchAuth('/me', { method: 'GET' });
      if (data.authenticated && data.user) {
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        return data;
      }
    } catch (e) {
      this.clearSession();
    }
    return { authenticated: false };
  },

  async logout() {
    try {
      await this.fetchAuth('/logout', { method: 'POST' }).catch(() => {});
    } finally {
      this.clearSession();
    }
  },

  clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
};

export default auth;
