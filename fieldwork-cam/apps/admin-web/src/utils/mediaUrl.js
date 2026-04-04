const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

const getApiOrigin = () => {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    if (typeof window !== "undefined") {
      return window.location.origin;
    }

    return "";
  }
};

export const resolveMediaUrl = (value = "") => {
  const input = String(value || "").trim();

  if (!input) return "";
  if (input.startsWith("data:") || input.startsWith("blob:")) return input;

  const apiOrigin = getApiOrigin();

  try {
    const parsed = new URL(input);

    if (!parsed.pathname.startsWith("/api/")) {
      return input;
    }

    return `${apiOrigin}${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    if (input.startsWith("/")) {
      return `${apiOrigin}${input}`;
    }

    return input;
  }
};
