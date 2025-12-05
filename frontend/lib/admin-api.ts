// Admin-specific API calls
import axios from 'axios';
import { getAdminToken } from './auth';

const ADMIN_API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'https://api.thaiscam.zcr.ai';

// Create admin API instance with auth interceptor
export const adminApi = axios.create({
  baseURL: `${ADMIN_API_BASE}/admin`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth interceptor
adminApi.interceptors.request.use((config) => {
  const token = getAdminToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interfaces
export interface SummaryStats {
  total_requests: number;
  scam_requests: number;
  safe_requests: number;
  scam_percentage: number;
  top_categories?: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  daily_stats?: Array<{
    date: string;
    total: number;
    scam: number;
  }>;
}

export interface PartnerStats {
  items: Array<{
    partner_id: string;
    name: string;
    total_requests: number;
    scam_detected: number;
  }>;
  total: number;
  page: number;
  page_size: number;
}

export interface CategoryStats {
  items: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  total: number;
  page: number;
  page_size: number;
}

export interface UncertainCase {
  request_id: string;
  created_at: string;
  message_hash: string;
  is_scam: boolean;
  risk_score: number;
  category: string;
  incorrect_feedback_count: number;
  priority: 'high' | 'medium' | 'low';
}

export interface UncertainCasesResponse {
  total: number;
  uncertain_count: number;
  incorrect_feedback_count: number;
  cases: UncertainCase[];
}

// API functions

/**
 * Get summary statistics for admin dashboard
 */
export const getAdminSummary = async (days: number = 7): Promise<SummaryStats> => {
  const response = await adminApi.get<SummaryStats>(`/stats/summary?days=${days}`);
  return response.data;
};

/**
 * Get partner statistics
 */
export const getPartnerStats = async (page: number = 1, pageSize: number = 50): Promise<PartnerStats> => {
  const response = await adminApi.get<PartnerStats>(`/stats/partners?page=${page}&page_size=${pageSize}`);
  return response.data;
};

/**
 * Get category distribution
 */
export const getCategoryStats = async (page: number = 1, pageSize: number = 20): Promise<CategoryStats> => {
  const response = await adminApi.get<CategoryStats>(`/stats/categories?page=${page}&page_size=${pageSize}`);
  return response.data;
};

/**
 * Get uncertain cases for review
 */
export const getUncertainCases = async (limit: number = 50, includeFeedback: boolean = true): Promise<UncertainCasesResponse> => {
  const response = await adminApi.get<UncertainCasesResponse>(`/review/uncertain?limit=${limit}&include_feedback=${includeFeedback}`);
  return response.data;
};
