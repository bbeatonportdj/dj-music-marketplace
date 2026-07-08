const envBase = import.meta.env.VITE_API_BASE_URL || '';

export const getApiBaseUrl = () => {
  if (envBase) return envBase.replace(/\/$/, '');
  return '';
};

export const apiUrl = (path: string) => {
  const base = getApiBaseUrl();
  if (!path.startsWith('/')) {
    path = `/${path}`;
  }
  return `${base}${path}`;
};
