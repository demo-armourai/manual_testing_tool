/**
 * API Configuration
 * Centralized configuration for all API calls
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * API endpoints
 */
export const API = {
    // Base URLs
    BASE_URL: API_BASE_URL,
    API_URL: API_URL,

    // Health check
    HEALTH: `${API_BASE_URL}/health`,

    // Audit endpoints
    AUDITS: {
        START: `${API_URL}/audits/start`,
        SYNC_AUTOMATED: (id) => `${API_URL}/audits/${id}/sync-automated`,
        SYNC_AUTOMATED_SC: (id, scId) => `${API_URL}/audits/${id}/sync-automated/${scId}`,
        SYNC_AUTOMATED_PAGE: (id) => `${API_URL}/audits/${id}/sync-automated-page`,
        LIST: `${API_URL}/audits`,
        UPDATE: (id) => `${API_URL}/audits/${id}`,
        DELETE: (id) => `${API_URL}/audits/${id}`,
    },

    // Conditions (WCAG criteria)
    CONDITIONS: `${API_URL}/conditions`,

    // Results endpoints
    RESULTS: {
        CREATE: `${API_URL}/results`,
        BY_AUDIT: (auditId) => `${API_URL}/results/audit/${auditId}`,
        BY_AUDIT_AND_SC: (auditId, scId) => `${API_URL}/results/audit/${auditId}/sc/${scId}`,
        BY_ID: (resultId) => `${API_URL}/results/${resultId}`,
        DELETE: (resultId) => `${API_URL}/results/${resultId}`,
    },

    // Findings endpoints
    FINDINGS: {
        LIST: `${API_URL}/findings`,
        CREATE: `${API_URL}/findings`,
        BY_AUDIT: (auditId) => `${API_URL}/findings/audit/${auditId}`,
        BY_RESULT: (resultId) => `${API_URL}/findings/result/${resultId}`,
        BY_ID: (findingId) => `${API_URL}/findings/${findingId}`,
        UPDATE: (findingId) => `${API_URL}/findings/${findingId}`,
        DELETE: (findingId) => `${API_URL}/findings/${findingId}`,
    },

    // Reports endpoints
    REPORTS: {
        GENERATE: `${API_URL}/reports/generate`,
        LIST: `${API_URL}/reports`,
        BY_AUDIT: (auditId) => `${API_URL}/reports/audit/${auditId}`,
        BY_AUDIT_JSON: (auditId) => `${API_URL}/reports/audit/${auditId}/json`,
        BY_ID: (reportId) => `${API_URL}/reports/${reportId}`,
        UPDATE: (reportId) => `${API_URL}/reports/${reportId}`,
    },

    // Compliance Scores endpoints (WCAG automated scans)
    COMPLIANCE_SCORES: {
        BY_USER: (userId) => `${API_URL}/compliance-scores/user/${userId}`,
        BY_PAGE: (pageId) => `${API_URL}/compliance-scores/page/${pageId}`,
        BY_ID: (id) => `${API_URL}/compliance-scores/${id}`,
        RECENT: `${API_URL}/compliance-scores/recent`,
    },

    // New User Selection endpoints
    USERS: {
        LIST: `${API_URL}/users`,
        STATS: `${API_URL}/users/stats`,
        WEBSITES: (userId) => `${API_URL}/users/${userId}/websites`,
    },
};

/**
 * Helper function to make API requests
 * @param {string} url - API endpoint URL
 * @param {Object} options - Fetch options
 * @returns {Promise} Response data
 */
export async function apiRequest(url, options = {}) {
    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({
                error: 'Request failed',
                message: response.statusText,
            }));
            throw new Error(error.message || 'Request failed');
        }

        return await response.json();
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
}

/**
 * API client with helper methods
 */
export const apiClient = {
    get: (url) => apiRequest(url, { method: 'GET' }),

    post: (url, data) => apiRequest(url, {
        method: 'POST',
        body: JSON.stringify(data),
    }),

    put: (url, data) => apiRequest(url, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),

    delete: (url) => apiRequest(url, { method: 'DELETE' }),
};

export default API;
