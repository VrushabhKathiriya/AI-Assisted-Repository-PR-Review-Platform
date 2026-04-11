import api from "./axios.js";

export const register = (data) => api.post("/users/register", data);
export const verifyOtp = (data) => api.post("/users/verify-otp", data);
export const login = (data) => api.post("/users/login", data);
export const logout = () => api.post("/users/logout");
export const getCurrentUser = () => api.get("/users/current-user");
export const changePassword = (data) => api.post("/users/change-password", data);
export const updateProfile = (data) => api.patch("/users/update-profile", data);
export const addEmail = (data) => api.post("/users/add-email", data);
export const verifyProfileEmail = (data) => api.post("/users/verify-profile-email", data);
export const forgotPassword = (data) => api.post("/users/forgot-password", data);
export const resetPassword = (token, data) => api.post(`/users/reset-password/${token}`, data);
export const refreshToken = () => api.post("/users/refresh-token");