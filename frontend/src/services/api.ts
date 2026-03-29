/**
 * Centralized API service for TTESOL.
 * Handels Authorization headers and global 401 (Unauthorized) redirect.
 */

const API_BASE = ''; // Use relative path for internal proxy or full URL if needed

export const api = {
    async request(path: string, options: RequestInit = {}) {
        const token = localStorage.getItem('token');
        
        const headers = new Headers(options.headers || {});
        if (token && !headers.has('Authorization')) {
            headers.set('Authorization', `Bearer ${token}`);
        }

        const response = await fetch(`${API_BASE}${path}`, {
            ...options,
            headers,
        });

        if (response.status === 401) {
            // Dispatch a global event so App.tsx can handle logout/redirect once
            window.dispatchEvent(new CustomEvent('tte:unauthorized'));
            // We throw a special error that components can catch if they want, 
            // but the global handler will handle the UI redirect.
            throw new Error('Unauthorized');
        }

        return response;
    },

    async get(path: string, options: RequestInit = {}) {
        return this.request(path, { ...options, method: 'GET' });
    },

    async post(path: string, body?: any, options: RequestInit = {}) {
        return this.request(path, {
            ...options,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers as any),
            },
            body: body ? JSON.stringify(body) : undefined,
        });
    },

    async put(path: string, body?: any, options: RequestInit = {}) {
        return this.request(path, {
            ...options,
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers as any),
            },
            body: body ? JSON.stringify(body) : undefined,
        });
    },

    async delete(path: string, options: RequestInit = {}) {
        return this.request(path, { ...options, method: 'DELETE' });
    }
};
