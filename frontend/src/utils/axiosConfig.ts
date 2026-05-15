import axios from "axios";

import { clearStoredAuth } from "@/utils/auth";

const api = axios.create({
    baseURL: "https://capstone-ecm-1.onrender.com/api",
    headers: {
        "Content-Type": "application/json",
    },
});

const AUTH_FLOW_PATHS = [
    "/users/login",
    "/users/register-teacher",
    "/users/verify-otp",
    "/users/resend-otp",
];

const isAuthFlowRequest = (url?: string) => {
    if (!url) {
        return false;
    }

    return AUTH_FLOW_PATHS.some((path) => url.includes(path));
};



api.interceptors.request.use((config) => {
    try {
        const userStr = localStorage.getItem("loginResponse");

        if (userStr) {
            const userData = JSON.parse(userStr);

            if (userData?.token) {
                config.headers = config.headers || {};
                config.headers.Authorization = `Bearer ${userData.token}`;
            }
        }
    } catch (error) {
        console.error("Token parse error", error);
    }

    return config;
});

/* Handle unauthorized responses */
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        const requestUrl = error.config?.url;

        if (isAuthFlowRequest(requestUrl)) {
            return Promise.reject(error);
        }

        // 401 UNAUTHORIZED: Token is missing, expired, or invalid. 
        // Action: Log them out.
        if (status === 401) {
            console.warn(`Auth error (401) - logging out`);

            clearStoredAuth();

            // Redirect to login
            if (typeof window !== "undefined" && window.location.pathname !== "/login") {
                window.location.href = "/login";
            }
        }
        // 403 FORBIDDEN: Token is valid, but they don't have the right role.
        // Action: Redirect to Access Denied page (Do NOT log them out).
        else if (status === 403) {
            console.warn(`Access Denied (403) - redirecting`);

            // Redirect to your unauthorized page
            if (typeof window !== "undefined" && window.location.pathname !== "/AccessDenied") {
                window.location.href = "/AccessDenied";
            }
        }

        return Promise.reject(error);
    }
);

export default api;
