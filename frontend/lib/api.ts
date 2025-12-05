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
  is_scam: boolean;
  confidence: number;
  risk_level: 'safe' | 'suspicious' | 'high_risk';
  scam_type?: string;
  reasoning?: string;
  request_id: string;
}

export const detectScam = async (data: DetectionRequest): Promise<DetectionResponse> => {
  const response = await api.post<DetectionResponse>('/public/detect/text', {
    message: data.text, // Backend expects "message" not "text"
  });
  return response.data;
};

export const getStats = async () => {
    const response = await api.get('/public/stats');
    return response.data;
}

export interface FeedbackRequest {
    request_id?: string;
    text?: string;
    is_scam_actual: boolean;
    feedback_type: 'false_positive' | 'false_negative' | 'general';
    comments?: string;
}

export const submitFeedback = async (data: FeedbackRequest) => {
    const response = await api.post('/feedback', data);
    return response.data;
};
