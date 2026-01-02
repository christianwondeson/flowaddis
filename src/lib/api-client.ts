import { APP_CONSTANTS } from "./constants";

export interface ApiResponse<T> {
    data: T;
    error?: string;
}

export const apiClient = {
    async get<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
        const url = new URL(path, window.location.origin);
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined) {
                    url.searchParams.append(key, value.toString());
                }
            });
        }

        const response = await fetch(url.toString());
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Failed to fetch from ${path}`);
        }

        return response.json();
    },

    async post<T>(path: string, body: any): Promise<T> {
        const response = await fetch(path, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Failed to post to ${path}`);
        }

        return response.json();
    }
};
