const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

const buildHeaders = (customHeaders = {}) => {
  const headers = {
    "Content-Type": "application/json",
    ...customHeaders,
  };

  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem("farmdirect_admin_token");
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  return headers;
};

const request = async (path, options = {}) => {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: buildHeaders(options.headers),
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload.message || `Request failed: ${path}`);
  }

  return payload;
};

export const api = {
  async get(path) {
    return request(path, { method: "GET" });
  },
  async post(path, body) {
    return request(path, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  async put(path, body) {
    return request(path, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },
};

export const installMockApi = () => {
  if (typeof window === "undefined") {
    return;
  }

  const nativeFetch = window.fetch.bind(window);

  window.fetch = async (input, init) => {
    const requestUrl = typeof input === "string" ? input : input.url;
    const method = (init?.method || "GET").toUpperCase();
    const url = new URL(requestUrl, window.location.origin);
    if (!url.pathname.startsWith("/mock-api/")) {
      return nativeFetch(input, init);
    }

    const handlerPath = url.pathname.replace("/mock-api", "");
    const body = init?.body ? JSON.parse(init.body) : null;
    const handler = mockHandlers[`${method} ${handlerPath}`] || mockHandlers[`GET ${handlerPath}`];
    const data = handler ? await handler({ url, body, method }) : { ok: false, message: "Mock endpoint not found" };

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };
};

const mockHandlers = {};

export const registerMockHandler = (method, path, handler) => {
  mockHandlers[`${method.toUpperCase()} ${path}`] = handler;
};
