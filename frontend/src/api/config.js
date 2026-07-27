const DEFAULT_API_BASE_URL = 'http://localhost:8080/api/v1';

function normalizeApiBaseUrl(rawUrl) {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed) return DEFAULT_API_BASE_URL;

  const withoutTrailingSlash = trimmed.replace(/\/$/, '');

  if (/^https?:\/\//i.test(withoutTrailingSlash)) {
    if (withoutTrailingSlash.includes('/api/v1')) {
      return withoutTrailingSlash;
    }

    if (withoutTrailingSlash.includes('/api')) {
      return `${withoutTrailingSlash}/v1`;
    }

    return `${withoutTrailingSlash}/api/v1`;
  }

  if (withoutTrailingSlash.startsWith('localhost') || withoutTrailingSlash.startsWith('127.0.0.1')) {
    return `http://${withoutTrailingSlash}`;
  }

  if (withoutTrailingSlash.includes('/api/v1')) {
    return `https://${withoutTrailingSlash}`;
  }

  if (withoutTrailingSlash.includes('/api')) {
    return `https://${withoutTrailingSlash}/v1`;
  }

  return `https://${withoutTrailingSlash}/api/v1`;
}

export function getApiBaseUrl(env = process.env) {
  return normalizeApiBaseUrl(env.REACT_APP_API_BASE_URL || env.REACT_API_BASE_URL || '');
}
