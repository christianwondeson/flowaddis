export const APP_CONSTANTS = {
    AUTH: {
        COOKIE_NAME: 'auth-token',
        COOKIE_MAX_AGE: 86400, // 24 hours
        REDIRECT_PARAM: 'redirect',
        SIGNIN_PATH: '/signin',
    },
    ROLES: {
        ADMIN: 'admin' as const,
        USER: 'user' as const,
    },
    API: {
        BASE_URL: '/api',
        HOTELS: '/api/hotels/search',
        FLIGHTS: '/api/flights/search',
    },
    UI: {
        // Timing constants (in milliseconds)
        DEBOUNCE_DELAY: 300,
        TOAST_DURATION: 3000,
        ANIMATION_DURATION: 200,

        // Pagination
        DEFAULT_PAGE_SIZE: 10,
        MAX_PAGE_SIZE: 50,

        // Search
        MIN_SEARCH_LENGTH: 2,
        MAX_SEARCH_LENGTH: 100,
    },
    Z_INDEX: {
        // Consistent z-index scale
        DROPDOWN: 50,
        STICKY_HEADER: 60,
        MODAL_BACKDROP: 70,
        MODAL: 80,
        POPOVER: 90,
        TOOLTIP: 100,
        TOAST: 110,
    },
} as const;
