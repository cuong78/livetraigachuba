import axios from "axios";
import type {
  Stream,
  DailyRecording,
  UserLocation,
  SaveLocationRequest,
} from "@/types";

export const getStorageItem = (key: string): string | null => {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const setStorageItem = (key: string, value: string): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, value);
  } catch {}
};

export const removeStorageItem = (key: string): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch {}
};

const getBaseApiUrl = () => {
  if (typeof window === "undefined") {
    const backend = process.env.BACKEND_API_URL || "https://traigabaanhem.com";
    return `${backend}/api`;
  }
  return "/api";
};

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Check token validity.
 * Returns true if token exists, false if missing.
 */
export const checkTokenAndLogout = (): boolean => {
  const token = getStorageItem("admin_token");
  return !!token;
};

export const isTokenExpired = (_token: string): boolean => {
  return false;
};

// Attach admin token to every authenticated request
api.interceptors.request.use((config) => {
  const token = getStorageItem("admin_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401/403 from server → token was revoked or invalid → logout
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      removeStorageItem("admin_token");
      removeStorageItem("admin_user");
      removeStorageItem("refresh_token");
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (username: string, password: string) => {
    const response = await api.post("/auth/login", { username, password });
    if (response.data.token) {
      setStorageItem("admin_token", response.data.token);
    }
    if (response.data.refreshToken) {
      setStorageItem("refresh_token", response.data.refreshToken);
    }
    if (response.data.user) {
      setStorageItem("admin_user", JSON.stringify(response.data.user));
    }
    return response.data;
  },

  logout: async () => {
    const refreshToken = getStorageItem("refresh_token");
    try {
      await api.post("/auth/logout", { refreshToken });
    } catch {
      // Ignore errors on logout
    }
    removeStorageItem("admin_token");
    removeStorageItem("admin_user");
    removeStorageItem("refresh_token");
  },
};

export const streamApi = {
  getCurrentStream: async (): Promise<Stream | null> => {
    const url = `${getBaseApiUrl()}/stream/current`;
    const response = await axios.get(url, { timeout: 8000 });
    return response.data;
  },
};

export const recordingApi = {
  // Get recent recordings (last 3 days)
  getRecentRecordings: async (): Promise<DailyRecording[]> => {
    const url = `${getBaseApiUrl()}/recordings/recent`;
    const response = await axios.get(url, { timeout: 8000 });
    return response.data;
  },

  // Get recording by specific date
  getRecordingByDate: async (date: string): Promise<DailyRecording | null> => {
    const url = `${getBaseApiUrl()}/recordings/date/${date}`;
    const response = await axios.get(url);
    return response.data;
  },

  // Admin: Trigger merge for today's recordings
  triggerMerge: async (
    date: string
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(`/recordings/admin/merge/${date}`);
    return response.data;
  },

  // Admin: Delete recording by date
  deleteRecording: async (
    date: string
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/recordings/admin/delete/${date}`);
    return response.data;
  },
};

export const locationApi = {
  // Save user location
  saveLocation: async (request: SaveLocationRequest): Promise<UserLocation> => {
    const response = await axios.post(`/api/location`, request);
    return response.data;
  },

  // Get current user location
  getCurrentLocation: async (): Promise<UserLocation | null> => {
    const response = await api.get(`/location/current`);
    return response.data;
  },

  // Get location history
  getLocationHistory: async (): Promise<UserLocation[]> => {
    const response = await api.get(`/location/history`);
    return response.data;
  },
};

export default api;

