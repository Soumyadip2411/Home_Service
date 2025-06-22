import axios from "axios";
import SummaryApi from "../common/SummaryApi";

const Axios = axios.create({
  baseURL: "http://localhost:8080",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor → add token
Axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("accesstoken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor → catch 401 and refresh token
Axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if token is expired and not already retried
    if (
      error.response?.status === 401 &&
      error.response?.data?.message?.includes("expired") &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");

        const res = await axios({
          url: SummaryApi.refreshToken.url,
          method: SummaryApi.refreshToken.method,
          data: { refreshToken },
          baseURL: "http://localhost:8080",
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (res.data.success) {
          const newAccessToken = res.data.data.accesstoken;

          // Update access token
          localStorage.setItem("accesstoken", newAccessToken);

          // Update Authorization header for original request
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          // Retry the original request
          return Axios(originalRequest);
        }
      } catch (err) {
        // Refresh token failed, logout user
        localStorage.removeItem("accesstoken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(err);
      }
    }

    // If not a 401 or already retried, just return error
    return Promise.reject(error);
  }
);

export default Axios;
