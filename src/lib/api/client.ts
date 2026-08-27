import axios from "axios";

/**
 * An error the API described, rather than a transport failure.
 *
 * The interceptor below used to flatten every rejection to `new Error(message)`,
 * which threw away the machine-readable `code` some endpoints return. That is
 * fine while a message is only ever shown to a human, and wrong the moment the
 * UI has to *act* on a specific failure - `EMAIL_REQUIRED` from the payments
 * initiate endpoint renders an email field, and matching on a translated
 * message string to decide that would break in Arabic.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    /** Stable identifier, e.g. "EMAIL_REQUIRED". Absent on most errors. */
    readonly code?: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const apiClient = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/v1`,
  headers: {
    "Content-Type": "application/json",
  },
  // Serialize array params as comma-joined values (e.g. ?tags=LIMITED_EDITIONS,LUXURIES)
  // instead of Axios's default bracket form (?tags[]=LUXURIES). The backend's
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
      const data = error.response?.data as
        | { message?: string | string[]; code?: string }
        | undefined;

      // Nest's ValidationPipe returns `message` as an array of strings.
      const raw = data?.message;
      const message =
        (Array.isArray(raw) ? raw[0] : raw) ||
        error.message ||
        "An error occurred";

      return Promise.reject(
        new ApiError(message, data?.code, error.response?.status),
      );
    }
    return Promise.reject(error);
  },
);

export default apiClient;
