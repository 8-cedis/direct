import { dashboardSummary, revenueSeries, categoryBreakdown, recentOrdersFeed, activeAlerts, inventorySummary, orders, customers, products, farmers, drivers, transactions, tickets, campaigns, settings } from "../data";

const jsonResponse = (data) =>
  new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

const mockFetchers = {
  "GET /api/dashboard/summary": () => ({ summary: dashboardSummary, revenueSeries, categoryBreakdown, recentOrdersFeed, activeAlerts }),
  "GET /api/orders": () => orders,
  "GET /api/customers": () => customers,
  "GET /api/products": () => products,
  "GET /api/farmers": () => farmers,
  "GET /api/drivers": () => drivers,
  "GET /api/transactions": () => transactions,
  "GET /api/tickets": () => tickets,
  "GET /api/campaigns": () => campaigns,
  "GET /api/settings": () => settings,
  "GET /api/inventory": () => ({ summary: inventorySummary, products }),
  "GET /api/reports": () => ({ reports: [] }),
};

export const installMockApi = () => {
  if (typeof window === "undefined") {
    return;
  }

  const nativeFetch = window.fetch.bind(window);

  window.fetch = async (input, init = {}) => {
    const requestUrl = typeof input === "string" ? input : input.url;
    const method = (init.method || "GET").toUpperCase();
    const url = new URL(requestUrl, window.location.origin);

    if (!url.pathname.startsWith("/api/")) {
      return nativeFetch(input, init);
    }

    const key = `${method} ${url.pathname}`;
    const exact = mockFetchers[key];
    const fallback = mockFetchers[`${method} ${url.pathname.replace(/\/[^/]+$/, "")}`];
    const handler = exact || fallback;

    if (!handler) {
      if (method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE") {
        return jsonResponse({ ok: true, message: "Mock action completed" });
      }
      return jsonResponse({ error: "Mock endpoint not implemented", path: url.pathname });
    }

    return jsonResponse(await handler());
  };
};
