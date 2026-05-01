export const formatCurrency = (value) =>
  new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

export const formatDate = (value) => {
  const date = new Date(value);
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
};

export const formatTime = (value) =>
  new Intl.DateTimeFormat("en-GH", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

export const getPercentChange = (current, previous) => {
  if (!previous) return 0;
  return ((current - previous) / previous) * 100;
};

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
