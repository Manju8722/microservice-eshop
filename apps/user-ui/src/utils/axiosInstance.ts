import axios from "axios";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_SERVER_URI,
  withCredentials: true,
});

let isRefreshing = false;

let refreshSubscribers: (() => void)[] = [];

const handlelogout = () => {
  if (window.location.pathname !== "login") {
    window.location.href = "/login";
  }
};

//handle adding a new access token to quue requests

const subscribeToRefrehToken = (callback: () => void) => {
  refreshSubscribers.push(callback);
};

// excute quued request aftre refresh
const onRefreshSuccess = () => {
  refreshSubscribers.forEach((cb) => cb());

  refreshSubscribers = [];
};

axiosInstance.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalReq = error.config;

    if (error.response?.status === 401 && !originalReq?._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeToRefrehToken(() => resolve(axiosInstance(originalReq)));
        });
      }

      originalReq._retry = true;

      isRefreshing = true;

      try {
        await axios.post(
          `${`${process.env.NEXT_PUBLIC_SERVER_URI}/api/refresh-token-user`}`,
          {},
          {
            withCredentials: true,
          }
        );
        isRefreshing = false;
        onRefreshSuccess();
        return axiosInstance(originalReq);
      } catch (refreshRError) {
        isRefreshing = false;
        refreshSubscribers = [];
        handlelogout();
        return Promise.reject(refreshRError);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
