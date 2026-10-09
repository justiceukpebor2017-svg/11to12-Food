/**
 * API Base URL Configuration
 * Handles local dev proxy, Cloud Run deployment, and static hosting (GitHub Pages / 11to12.food).
 */

const LIVE_BACKEND_ORIGIN = 'https://ais-pre-secg2iyogbtgqwhfhfcqb5-158555251553.europe-west1.run.app';

export function getApiBaseUrl(): string {
  if (typeof window === 'undefined') return '';
  const hostname = window.location.hostname.toLowerCase();
  const isStaticHost =
    hostname.includes('github.io') ||
    ((hostname === '11to12.food' || hostname.endsWith('.11to12.food')) && !window.location.port);

  if (isStaticHost) {
    return (import.meta as any).env?.VITE_API_URL || LIVE_BACKEND_ORIGIN;
  }
  return '';
}

export function apiUrl(endpoint: string): string {
  const base = getApiBaseUrl();
  return `${base}${endpoint}`;
}
