// Partner-specific API calls
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// Create partner API instance
export const partnerApi = axios.create({
  baseURL: `${API_BASE_URL}/partner`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth Helpers
export const setPartnerKey = (key: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('partner_api_key', key);
  }
};

export const getPartnerKey = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('partner_api_key');
  }
  return null;
};

export const removePartnerKey = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('partner_api_key');
  }
};

// Interceptor
partnerApi.interceptors.request.use((config) => {
  const key = getPartnerKey();
  if (key) {
    config.headers['X-API-Key'] = key;
  }
  return config;
});

// Interfaces
export interface PartnerDashboardStats {
  company_name: string;
  plan_tier: string;
  total_requests: number;
  requests_limit: number;
  scam_detected: number;
  safe_detected: number;
  recent_logs: Array<{
    id: string;
    timestamp: string;
    endpoint: string;
    status: number;
    latency: string;
  }>;
}

// Mock Data
const MOCK_PARTNER_DATA: PartnerDashboardStats = {
  company_name: "TechSec Systems Ltd.",
  plan_tier: "Enterprise",
  total_requests: 45230,
  requests_limit: 100000,
  scam_detected: 12400,
  safe_detected: 32830,
  recent_logs: Array.from({ length: 10 }, (_, i) => ({
    id: `req_${Date.now()}_${i}`,
    timestamp: new Date(Date.now() - i * 60000).toISOString(),
    endpoint: "/v1/partner/detect",
    status: 200,
    latency: `${Math.floor(Math.random() * 50 + 20)}ms`
  }))
};

// API Functions
export const getPartnerDashboard = async (): Promise<PartnerDashboardStats> => {
  const key = getPartnerKey();
  if (key === 'demo_partner_key') {
    return MOCK_PARTNER_DATA;
  }
  // In real implementation, this would call the backend
  // const response = await partnerApi.get('/dashboard');
  // return response.data;
  
  // For now, always mock if key exists, else error
  if (!key) throw new Error("No API Key");
  return MOCK_PARTNER_DATA;
};
