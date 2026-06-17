import axios from "axios";

const apiClient = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/v1`,
  headers: {
    "Content-Type": "application/json",
  },
  // Serialize array params as comma-joined values (e.g. ?tags=ORIGINALS,LUXURIES)
  // instead of Axios's default bracket form (?tags[]=ORIGINALS). The backend's
  // whitelist validation only recognizes the bracket-less `key`, so the bracketed
  // form is stripped and the filter is silently ignored — making every tag/color/
  // size filter return ALL products. The API splits these comma lists server-side.
  paramsSerializer: (params: Record<string, unknown>) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) {
        const items = value.filter((v) => v !== undefined && v !== null);
        if (items.length > 0) search.append(key, items.join(","));
      } else {
        search.append(key, String(value));
      }
    }
    return search.toString();
  },
});

// Request interceptor — attach auth token when available
apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("qafila_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor — unwrap data, normalize errors, handle 401
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401 && typeof window !== "undefined") {
        localStorage.removeItem("qafila_token");
        localStorage.removeItem("qafila_user");
        window.dispatchEvent(new Event("qafila:logout"));
      }
      const message =
        error.response?.data?.message || error.message || "An error occurred";
      return Promise.reject(new Error(message));
    }
    return Promise.reject(error);
  },
);

export default apiClient;
