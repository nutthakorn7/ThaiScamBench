import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface DetectionRequest {
  text?: string;
  image?: string; // Base64
}

export interface DetectionResponse {
  request_id: string;
  is_scam: boolean;
  risk_score: number;
  category: string;
  reason: string;
  advice: string;
  model_version: string;
  // Legacy fields for backward compatibility
  confidence?: number;
  risk_level?: 'safe' | 'suspicious' | 'high_risk';
  scam_type?: string;
  reasoning?: string;
}

export const detectScam = async (data: DetectionRequest): Promise<DetectionResponse> => {
  const response = await api.post<DetectionResponse>('/public/detect/text', {
    message: data.text, // Backend expects "message" not "text"
  });
  return response.data;
};

export const getStats = async () => {
    try {
        const response = await api.get('/public/stats');
        return response.data;
    } catch (error) {
        console.warn("API Error, returning mock stats:", error);
        // Mock data for fallback
        return {
            total_detections: 12543,
            scam_percentage: 42.5,
            top_categories: [
                { category: "online_gambling", count: 3200, percentage: 35 },
                { category: "loan_scam", count: 2100, percentage: 23 },
                { category: "purchase_scam", count: 1800, percentage: 19 },
                { category: "giveaway_scam", count: 1200, percentage: 13 },
                { category: "romance_scam", count: 900, percentage: 10 }
            ],
            period: "Last 30 Days"
        };
    }
}

export interface FeedbackRequest {
    request_id: string;
    feedback_type: 'correct' | 'incorrect';
    comment?: string;
}

export const submitFeedback = async (data: FeedbackRequest) => {
    try {
        const response = await api.post('/public/feedback', data);
        return response.data;
    } catch (error) {
        console.warn("API Feedback Error, functioning in mock mode:", error);
        // Mock success response to allow UI testing
        return {
            status: "success",
            message: "Feedback received (Mock)",
            data: data
        };
    }
};
