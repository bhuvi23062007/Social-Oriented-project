import axios from 'axios';
import { Platform } from 'react-native';

const localFallback = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || localFallback).replace(/\/$/, '');

export const api = axios.create({ baseURL: API_BASE_URL, timeout: 20000 });
let accessToken: string | null = null;

export function setApiToken(token: string | null) {
  accessToken = token;
}

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

export function getApiError(error: unknown, fallback = 'Something went wrong. Please try again.') {
  const e = error as any;
  const message = e?.response?.data?.message;
  if (Array.isArray(message)) return String(message[0] ?? fallback);
  if (typeof message === 'string') return message;
  if (e?.code === 'ERR_NETWORK' || !e?.response) {
    return `Cannot reach the backend at ${API_BASE_URL}. Check the API URL and that NestJS is running.`;
  }
  return fallback;
}

export async function uploadImage(uri: string, fileName = 'photo.jpg', mimeType = 'image/jpeg') {
  const form = new FormData();
  form.append('file', { uri, name: fileName, type: mimeType } as any);
  const response = await api.post('/storage/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data as { url: string };
}
