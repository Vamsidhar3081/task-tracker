import axios from "axios";
import baseURL from "./base";

const axiosInstance = axios.create({
  baseURL,
});

// attach token automatically
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  const isLoginRequest = config.url === "/auth/login";

  if (token && !isLoginRequest) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// handle auth errors
axiosInstance.interceptors.response.use(
  (res) => res,
  (err) => {
    const isLoginRequest = err.config?.url === "/auth/login";
    if (err.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      localStorage.removeItem("role");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default axiosInstance;
