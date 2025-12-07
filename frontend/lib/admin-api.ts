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
import { getSession } from "next-auth/react";

// Add auth interceptor
adminApi.interceptors.request.use(async (config) => {
  // Try to get NextAuth session first
  const session = await getSession();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const token = (session as any)?.accessToken || getAdminToken(); // Fallback to local storage for now
  
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
  requests_per_day?: Array<{
    date: string;
    count: number;
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

// Mock Data Generators
const isBypassToken = () => {
  const token = getAdminToken();
  return token === 'admin123' || token === 'thaiscam2024';
};

const getMockSummary = (): SummaryStats => ({
  total_requests: 15243,
  scam_requests: 6890,
  safe_requests: 8353,
  scam_percentage: 45.2,
  top_categories: [
    { category: 'financial_scam', count: 2450, percentage: 35.5 },
    { category: 'gambling', count: 1890, percentage: 27.4 },
    { category: 'shopping_scam', count: 1200, percentage: 17.4 },
    { category: 'identity_theft', count: 850, percentage: 12.3 },
    { category: 'romance_scam', count: 500, percentage: 7.2 }
  ],
  daily_stats: Array.from({ length: 7 }, (_, i) => ({
    date: new Date(Date.now() - (6 - i) * 86400000).toISOString().split('T')[0],
    total: Math.floor(Math.random() * 500) + 1000,
    scam: Math.floor(Math.random() * 200) + 400
  }))
});

const getMockPartners = (page: number, pageSize: number): PartnerStats => ({
  items: Array.from({ length: pageSize }, (_, i) => ({
    partner_id: `partner_${(page - 1) * pageSize + i + 1}`,
    name: `Partner ${(page - 1) * pageSize + i + 1} Ltd.`,
    total_requests: Math.floor(Math.random() * 10000),
    scam_detected: Math.floor(Math.random() * 4000)
  })),
  total: 45,
  page,
  page_size: pageSize
});

const getMockCategories = (): CategoryStats => ({
  items: [
    { category: 'financial_scam', count: 2450, percentage: 35.5 },
    { category: 'gambling', count: 1890, percentage: 27.4 },
    { category: 'shopping_scam', count: 1200, percentage: 17.4 },
    { category: 'identity_theft', count: 850, percentage: 12.3 },
    { category: 'romance_scam', count: 500, percentage: 7.2 },
    { category: 'job_scam', count: 300, percentage: 4.3 },
    { category: 'fake_loan', count: 150, percentage: 2.1 }
  ],
  total: 7,
  page: 1,
  page_size: 20
});

const getMockUncertainCases = (): UncertainCasesResponse => ({
  total: 12,
  uncertain_count: 8,
  incorrect_feedback_count: 4,
  cases: Array.from({ length: 12 }, (_, i) => ({
    request_id: `req_${Math.random().toString(36).substr(2, 9)}`,
    created_at: new Date(Date.now() - i * 3600000).toISOString(),
    message_hash: `hash_${i}`,
    is_scam: Math.random() > 0.5,
    risk_score: 0.45 + Math.random() * 0.1, // 0.45 - 0.55 (uncertain)
    category: ['financial_scam', 'gambling', 'shopping_scam'][Math.floor(Math.random() * 3)],
    incorrect_feedback_count: Math.random() > 0.7 ? 1 : 0,
    priority: i < 3 ? 'high' : i < 7 ? 'medium' : 'low'
  }))
});

/**
 * Get summary statistics for admin dashboard
 */
export const getAdminSummary = async (days: number = 7): Promise<SummaryStats> => {
  if (isBypassToken()) return getMockSummary();
  const response = await adminApi.get<SummaryStats>(`/stats/summary?days=${days}`);
  return response.data;
};

/**
 * Get partner statistics
 */
export const getPartnerStats = async (page: number = 1, pageSize: number = 50): Promise<PartnerStats> => {
  if (isBypassToken()) return getMockPartners(page, pageSize);
  const response = await adminApi.get<PartnerStats>(`/stats/partners?page=${page}&page_size=${pageSize}`);
  return response.data;
};

/**
 * Get category distribution
 */
export const getCategoryStats = async (page: number = 1, pageSize: number = 20): Promise<CategoryStats> => {
  if (isBypassToken()) return getMockCategories();
  const response = await adminApi.get<CategoryStats>(`/stats/categories?page=${page}&page_size=${pageSize}`);
  return response.data;
};

/**
 * Get uncertain cases for review
 */
export const getUncertainCases = async (limit: number = 50, includeFeedback: boolean = true): Promise<UncertainCasesResponse> => {
  if (isBypassToken()) return getMockUncertainCases();
  const response = await adminApi.get<UncertainCasesResponse>(`/review/uncertain?limit=${limit}&include_feedback=${includeFeedback}`);
  return response.data;
};

export interface RecentActivityItem {
  id: string;
  type: "scam" | "safe";
  message: string;
  time: string;
  location: string;
  source: string;
}

export const getRecentActivity = async (limit: number = 10): Promise<RecentActivityItem[]> => {
  if (isBypassToken()) return []; // Or mock
  const response = await adminApi.get<RecentActivityItem[]>(`/stats/recent?limit=${limit}`);
  return response.data;
};

// -- New Interfaces for Tables --

export interface DetectionLog {
  id: string;
  created_at: string;
  message: string;
  is_scam: boolean;
  risk_score: number;
  category: string;
  source: string;
  ip_address?: string;
}

export interface DetectionListResponse {
  items: DetectionLog[];
  total: number;
  page: number;
  page_size: number;
}

export interface FeedbackLog {
  id: string;
  created_at: string;
  request_id: string;
  feedback_type: 'correct' | 'incorrect';
  comment?: string;
  message_preview?: string; // Optional, joined from detections
}

export interface FeedbackListResponse {
  items: FeedbackLog[];
  total: number;
  page: number;
  page_size: number;
}

// -- Mock Data for Tables --

const getMockDetections = (page: number, pageSize: number): DetectionListResponse => ({
  items: Array.from({ length: pageSize }, (_, i) => ({
    id: `det_${Date.now()}_${i}`,
    created_at: new Date(Date.now() - i * 600000).toISOString(),
    message: [
      "คุณได้รับเงินรางวัล 1000 บาท คลิกที่นี่",
      "ธนาคารแจ้งเตือนบัญชีของคุณถูกระงับ",
      "สวัสดีค่ะ สนใจทำงานเสริมไหมคะ",
      "พัสดุตกค้าง กรุณาชำระภาษี",
      "เงินกู้ด่วน อนุมัติไว ได้เงินจริง"
    ][Math.floor(Math.random() * 5)],
    is_scam: Math.random() > 0.3,
    risk_score: Math.random(),
    category: ['financial_scam', 'gambling', 'loan_scam'][Math.floor(Math.random() * 3)],
    source: 'web'
  })),
  total: 1250,
  page,
  page_size: pageSize
});

const getMockFeedbackList = (page: number, pageSize: number): FeedbackListResponse => ({
  items: Array.from({ length: pageSize }, (_, i) => ({
    id: `fb_${Date.now()}_${i}`,
    created_at: new Date(Date.now() - i * 3600000).toISOString(),
    request_id: `req_${Math.random().toString(36).substr(2, 9)}`,
    feedback_type: Math.random() > 0.8 ? 'incorrect' : 'correct',
    comment: Math.random() > 0.5 ? "ระบบตรวจแม่นยำมากครับ" : undefined,
    message_preview: "ข้อความตัวอย่างที่ถูกตรวจสอบ..."
  })),
  total: 450,
  page,
  page_size: pageSize
});

// -- New API Functions --

export const getDetections = async (page: number = 1, pageSize: number = 50): Promise<DetectionListResponse> => {
  if (isBypassToken()) return getMockDetections(page, pageSize);
  const response = await adminApi.get<DetectionListResponse>(`/detections?page=${page}&page_size=${pageSize}`);
  return response.data;
};

export const getFeedbackList = async (page: number = 1, pageSize: number = 50): Promise<FeedbackListResponse> => {
  if (isBypassToken()) return getMockFeedbackList(page, pageSize);
  const response = await adminApi.get<FeedbackListResponse>(`/feedback?page=${page}&page_size=${pageSize}`);
  return response.data;
};

// -- User Management --

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  status: 'active' | 'banned';
  last_login: string;
  created_at: string;
}

export interface UserListResponse {
  items: User[];
  total: number;
  page: number;
  page_size: number;
}

const getMockUsers = (page: number, pageSize: number): UserListResponse => ({
  items: Array.from({ length: pageSize }, (_, i) => ({
    id: `usr_${Date.now()}_${i}`,
    email: `user${(page - 1) * pageSize + i + 1}@example.com`,
    role: i === 0 ? 'admin' : 'user',
    status: Math.random() > 0.9 ? 'banned' : 'active',
    last_login: new Date(Date.now() - Math.random() * 864000000).toISOString(),
    created_at: new Date(Date.now() - Math.random() * 31536000000).toISOString()
  })),
  total: 1240,
  page,
  page_size: pageSize
});

export const getUsers = async (page: number = 1, pageSize: number = 50): Promise<UserListResponse> => {
  if (isBypassToken()) return getMockUsers(page, pageSize);
  const response = await adminApi.get<UserListResponse>(`/users?page=${page}&page_size=${pageSize}`);
  return response.data;
};
