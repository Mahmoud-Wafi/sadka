import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api",
  timeout: 10000
});

export const getCurrentKhatma = async () => {
  const { data } = await api.get("/current-khatma/");
  return data;
};

export const reserveJuz = async (payload) => {
  const { data } = await api.post("/reserve/", payload);
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

export const incrementTasbeeh = async (phrase) => {
  const { data } = await api.post("/tasbeeh/", { phrase });
  return data;
};

export const getJuzContent = async (juzNumber) => {
  const { data } = await api.get(`/juz/${juzNumber}/`);
  return data;
};

export const parseApiError = (error) => {
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
