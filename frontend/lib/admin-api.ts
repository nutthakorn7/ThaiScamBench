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
  // New Image Stats
  total_images: number;
  scam_images: number;
  
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
  // New fields
  type: 'text' | 'image';
  message?: string | string[];
  image_url?: string;
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
  
  // Image Stats Mock
  total_images: 3450,
  scam_images: 840,

  top_categories: [
    { category: 'financial_scam', count: 2450, percentage: 35.5 },
    { category: 'gambling', count: 1890, percentage: 27.4 },
    { category: 'shopping_scam', count: 1200, percentage: 17.4 },
    { category: 'fake_slip', count: 840, percentage: 12.3 }, // Added fake slip category
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

const getMockUncertainCases = (limit: number = 50): UncertainCasesResponse => {
  // Story Arc: The "Hero Case" for the Demo
  const storyCases: UncertainCase[] = [
    {
      request_id: 'case_hero_001',
      created_at: new Date().toISOString(), // Just now
      message_hash: 'hash_loan_001',
      is_scam: true, // Actually fraud
      risk_score: 0.65, // Uncertain enough to need human review
      category: 'financial_fraud',
      incorrect_feedback_count: 2,
      priority: 'high',
      type: 'image',
      image_url: 'https://placehold.co/600x800/e2e8f0/1e293b.png?text=FAKE+SLIP\n50,000+THB\n(Review+Needed)',
      message: 'Image containing text: "อนุมัติยอด 50,000 บาท"'
    },
    {
       request_id: 'case_hero_002',
       created_at: new Date(Date.now() - 3600000).toISOString(),
       message_hash: 'hash_gambling_01',
       is_scam: true,
       risk_score: 0.55,
       category: 'gambling',
       incorrect_feedback_count: 0,
       priority: 'medium',
       type: 'text',
       message: 'เว็บตรง มั่นคง ปลอดภัย ฝาก-ถอน ออโต้'
    }
  ];
  
  const others: UncertainCase[] = Array.from({ length: limit - 2 }).map((_, i) => ({
    request_id: `req_${i + 1}`,
    created_at: new Date(Date.now() - Math.random() * 86400000).toISOString(),
    message_hash: `hash_${i}`,
    is_scam: i % 2 === 0,
    risk_score: 0.4 + Math.random() * 0.2, // 0.4 - 0.6 range
    category: 'unknown',
    incorrect_feedback_count: Math.floor(Math.random() * 3),
    priority: i % 10 === 0 ? 'high' : 'medium',
    type: i % 3 === 0 ? 'image' : 'text',
    message: i % 3 === 0 ? 'Suspicious Image Analysis...' : 'ข้อความชวนสงสัย...'
  }));

  return {
    cases: [...storyCases, ...others],
    total: 42,
    uncertain_count: 15,
    incorrect_feedback_count: 8
  };
};

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
  // New fields
  type: 'text' | 'image';
  image_url?: string;
}

export interface DetectionListResponse {
  items: DetectionLog[];
  total: number;
  page: number;
  page_size: number;
}

// ... existing code ...

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

const getMockDetections = (page: number, pageSize: number): DetectionListResponse => {
  // Story Arc Data: The "Loan Shark" Campaign
  // Using placeholders since local assets generation is rate-limited
  const storyDetections: DetectionLog[] = [
    {
      id: 'evt_loan_001',
      created_at: new Date(Date.now() - 1000 * 60 * 2).toISOString(), // 2 mins ago
      message: 'อนุมัติวงเงิน 50,000 บาท โอนเข้าบัญชีแล้ว (Fake Slip)',
      is_scam: true,
      risk_score: 0.98,
      category: 'financial_fraud',
      source: 'Line OA: @FastCash',
      ip_address: '171.96.xxx.xxx',
      type: 'image',
      image_url: 'https://placehold.co/600x800/e2e8f0/1e293b.png?text=FAKE+SLIP\n50,000+THB\n(Suspicious)'
    },
    {
      id: 'evt_loan_002',
      created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
      message: 'ยืนยันการโอนเงินค่ามัดจำกู้ (Pattern Match)',
      is_scam: true,
      risk_score: 0.95,
      category: 'financial_fraud',
      source: 'SMS Link',
      ip_address: '49.228.xxx.xxx',
      type: 'image',
      image_url: 'https://placehold.co/600x800/e2e8f0/1e293b.png?text=FAKE+SLIP\nPattern+Match'
    },
    {
       id: 'evt_romance_05',
       created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
       message: 'Hello honey, I need help with hospital bills...',
       is_scam: true,
       risk_score: 0.88,
       category: 'romance_scam',
       source: 'Facebook',
       type: 'text'
    }
  ];

  const others = Array.from({ length: pageSize - 3 }).map((_, i) => ({
    id: `evt_${(page - 1) * pageSize + i + 10}`,
    created_at: new Date(Date.now() - (3600000 * (i + 1))).toISOString(),
    message: i % 3 === 0 ? "สวัสดีครับ สนใจสินเชื่อดอกเบี้ยต่ำไหม" : 
             i % 3 === 1 ? "Click here to claim your daily reward!" : 
             "Urgent: Your account has been locked.",
    is_scam: i % 5 !== 0,
    risk_score: i % 5 === 0 ? 0.1 : 0.8 + (Math.random() * 0.2),
    category: i % 3 === 0 ? 'financial_fraud' : i % 3 === 1 ? 'gambling' : 'phishing',
    source: i % 2 === 0 ? 'SMS' : 'Line',
    ip_address: `192.168.1.${i}`,
    type: (i % 4 === 0 ? 'image' : 'text') as 'image' | 'text'
  }));

  return {
    items: page === 1 ? [...storyDetections, ...others] : others, // Show story only on page 1
    total: 15420,
    page,
    page_size: pageSize
  };
};

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
  name?: string;
  role: 'admin' | 'partner';
  partner_id?: string;
  created_at?: string;
  last_login?: string;
  is_active: boolean; // Added field to match backend
  generated_password?: string; // Optional field for creation response
}

export interface UserListResponse {
  items: User[];
  total: number;
  page: number;
  page_size: number;
}

const getMockUsers = (page: number, pageSize: number): UserListResponse => {
  const users: User[] = Array.from({ length: pageSize }).map((_, i) => ({
    id: `mock-user-${(page - 1) * pageSize + i + 1}`,
    email: `user${(page - 1) * pageSize + i + 1}@example.com`,
    name: `Mock User ${(page - 1) * pageSize + i + 1}`,
    role: i % 5 === 0 ? 'admin' : 'partner',
    is_active: i % 10 !== 0, // 10% inactive
    created_at: new Date(Date.now() - Math.random() * 31536000000).toISOString(),
    last_login: new Date(Date.now() - Math.random() * 864000000).toISOString()
  }));
  return {
    items: users,
    total: 1240,
    page,
    page_size: pageSize
  };
};

export interface UpdateUserRequest {
  name?: string;
  role?: 'admin' | 'partner';
  is_active?: boolean;
}

export const getUsers = async (
  page: number = 1, 
  pageSize: number = 50,
  q?: string,
  role?: string,
  status?: string
): Promise<UserListResponse> => {
  if (isBypassToken()) return getMockUsers(page, pageSize);
  
  // Build query params
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('page_size', pageSize.toString());
  if (q) params.append('q', q);
  if (role && role !== 'all') params.append('role', role);
  if (status && status !== 'all') params.append('status', status);

  // Endpoint is at /v1/auth/users, adminApi base is /v1/admin
  const response = await adminApi.get<UserListResponse>(`/../auth/users?${params.toString()}`);
  return response.data;
};

export interface CreateUserRequest {
  email: string;
  name?: string;
  role: 'admin' | 'partner';
  password?: string;
}

export const createUser = async (data: CreateUserRequest): Promise<User> => {
   // Endpoint is at /v1/auth/users
   const response = await adminApi.post<User>('/../auth/users', data);
   return response.data;
};

export const updateUser = async (id: string, data: UpdateUserRequest): Promise<User> => {
  const response = await adminApi.patch<User>(`/../auth/users/${id}`, data);
  return response.data;
};

export const deleteUser = async (id: string): Promise<void> => {
  await adminApi.delete(`/../auth/users/${id}`);
};

export const resetUserPassword = async (id: string): Promise<User> => {
  const response = await adminApi.post<User>(`/../auth/users/${id}/reset-password`);
  return response.data;
};

// -- Audit Logging --

export interface AuditLog {
  id: string;
  actor_id: string;
  action: string;
  target_id?: string;
  details?: string;
  ip_address?: string;
  created_at: string;
}

export interface AuditLogListResponse {
  items: AuditLog[];
  total: number;
  page: number;
  page_size: number;
}

export const getAuditLogs = async (
  page: number = 1,
  pageSize: number = 50,
  action?: string,
  actor_id?: string
): Promise<AuditLogListResponse> => {
  if (isBypassToken()) {
      return { items: [], total: 0, page, page_size: pageSize };
  }
  
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('page_size', pageSize.toString());
  if (action && action !== "all") params.append('action', action);
  if (actor_id) params.append('actor_id', actor_id);

  const response = await adminApi.get<AuditLogListResponse>(`/logs?${params.toString()}`);
  return response.data;
};
