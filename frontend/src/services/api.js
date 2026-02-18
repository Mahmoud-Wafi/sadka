import axios from "axios";

const LOCAL_API_BASE_URL = "http://127.0.0.1:8000/api";
const PUBLIC_API_BASE_URL = "https://loose-whale-sadka12-a0d22c29.koyeb.app/api";

function isLocalBrowserHost() {
  if (typeof window === "undefined") {
    return true;
  }

  return ["localhost", "127.0.0.1", "0.0.0.0"].includes(window.location.hostname);
}

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  || (isLocalBrowserHost() ? LOCAL_API_BASE_URL : PUBLIC_API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 12000
});

export const getCurrentKhatma = async () => {
  const { data } = await api.get("/current-khatma/");
  return data;
};

export const reserveJuz = async (payload) => {
  const { data } = await api.post("/reserve/", payload);
  return data;
};

export const completeJuz = async (payload) => {
  const { data } = await api.post("/complete-juz/", payload);
  return data;
};

export const getStats = async () => {
  const { data } = await api.get("/stats/");
  return data;
};

export const getTasbeeh = async () => {
  const { data } = await api.get("/tasbeeh/");
  return data;
};

export const incrementTasbeeh = async (payload) => {
  const { data } = await api.post("/tasbeeh/", payload);
  return data;
};

export const getJuzContent = async (juzNumber) => {
  const { data } = await api.get(`/juz/${juzNumber}/`);
  return data;
};

export const getActivityFeed = async (limit = 30) => {
  const { data } = await api.get("/activity/", { params: { limit } });
  return data;
};

export const getDuaWall = async () => {
  const { data } = await api.get("/dua-wall/");
  return data;
};

export const createDua = async (payload) => {
  const { data } = await api.post("/dua-wall/", payload);
  return data;
};

export const getProfileStats = async (name) => {
  const { data } = await api.get("/profile-stats/", { params: { name } });
  return data;
};

export const getKhatmaHistory = async (limit = 20) => {
  const { data } = await api.get("/khatma-history/", { params: { limit } });
  return data;
};

export const getDailyWird = async () => {
  const { data } = await api.get("/daily-wird/");
  return data;
};

export const getReminders = async (name) => {
  const { data } = await api.get("/reminders/", { params: { name } });
  return data;
};

export const parseApiError = (error) => {
  if (error?.code === "ECONNABORTED") {
    return "انتهت مهلة الاتصال بالخادم. حاول مرة أخرى.";
  }

  if (!error?.response || error?.message === "Network Error") {
    return "تعذر الاتصال بالخادم. تحقق من الإنترنت ثم أعد المحاولة.";
  }

  if (error?.response?.data?.detail) {
    return error.response.data.detail;
  }

  if (error?.response?.data && typeof error.response.data === "object") {
    const firstValue = Object.values(error.response.data)[0];
    if (Array.isArray(firstValue) && firstValue[0]) {
      return String(firstValue[0]);
    }
    if (typeof firstValue === "string") {
      return firstValue;
    }
  }

  if (typeof error?.response?.data === "string") {
    return error.response.data;
  }

  return "حدث خطأ غير متوقع. حاول مرة أخرى.";
};
