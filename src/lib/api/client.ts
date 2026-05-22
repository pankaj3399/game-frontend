import axios from "axios";
import { getAuthToken } from "@/lib/auth";

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
  return config;
});

export const getBackendUrl = () => baseURL;
