import axios from "axios";
import { getAuthToken } from "@/lib/auth/storage";

// Must use backend URL directly for cookies to work (browser sends cookies to same origin as cookie domain)
// Same env var as CRA: REACT_APP_BACKEND_URL (Vite exposes it via envPrefix in vite.config)
const baseURL = import.meta.env.REACT_APP_BACKEND_URL;

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Let the browser set multipart boundary; instance default is application/json.
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    if (typeof config.headers.delete === "function") {
      config.headers.delete("Content-Type");
    } else {
      delete (config.headers as Record<string, unknown>)["Content-Type"];
    }
  }
  return config;
});

export const getBackendUrl = () => baseURL;
