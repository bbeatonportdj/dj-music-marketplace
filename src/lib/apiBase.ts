const envBase = import.meta.env.VITE_API_BASE_URL || '';

export const getApiBaseUrl = () => {
  if (envBase) return envBase.replace(/\/$/, '');
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return '/api';
  }
  return '';
};

export const apiUrl = (path: string) => {
  const base = getApiBaseUrl();
  if (!path.startsWith('/')) {
    path = `/${path}`;
  }
  return `${base}${path}`;
};
