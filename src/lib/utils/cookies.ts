import { APP_CONSTANTS } from "../constants";

export const setAuthCookie = (token: string) => {
    document.cookie = `${APP_CONSTANTS.AUTH.COOKIE_NAME}=${token}; path=/; max-age=${APP_CONSTANTS.AUTH.COOKIE_MAX_AGE}; SameSite=Strict`;
};

export const clearAuthCookie = () => {
    document.cookie = `${APP_CONSTANTS.AUTH.COOKIE_NAME}=; path=/; max-age=0; SameSite=Strict`;
};

export const deleteAuthCookie = () => {
    document.cookie = `${APP_CONSTANTS.AUTH.COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict`;
};
