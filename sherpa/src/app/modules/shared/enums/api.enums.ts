import { environment } from '../../../../environments/environment';

const { BASE_API_URL } = environment;
export const API_URL = `${BASE_API_URL}/api`;
export const PUBLIC_FONTS = `${BASE_API_URL}/public/fonts`;
export const LOGIN = `${API_URL}/auth/login`;
export const SIGNUP = `${API_URL}/auth/signup`;
export const USERS = `${API_URL}/users`;
export const USER = `${API_URL}/users/self`;
export const ENTITY_CONFIG = `${API_URL}/config`;
export const ENTITY_CONFIG_WIDGET = `${API_URL}/config/widget`;
export const SUPPORT = `${API_URL}/support`;
export const SESSIONS = `${API_URL}/sessions`;
export const FILES = `${API_URL}/files`;
export const UPLOAD = `${FILES}/upload`;
export const FONTS = `${API_URL}/fonts`;

export const PUBLIC_API_ROUTES = [
  LOGIN,
  SIGNUP,
];
