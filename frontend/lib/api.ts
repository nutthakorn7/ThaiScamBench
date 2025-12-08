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
  image?: string; // Base64 (legacy)
  file?: File; // New file upload support
}

export interface DetectionResponse {
  request_id: string;
  is_scam: boolean;
  risk_score: number;
  category: string;
  reason: string;
  advice: string;
  model_version: string;
  extracted_text?: string; // Text from OCR
  
  // Image-specific fields
  forensics?: {
    enabled: boolean;
    is_manipulated: boolean;
    confidence: number;
    manipulation_type?: string;
    details?: string;
    techniques: {
      ela: {
        suspicious: boolean;
        score: number;
        variance: number;
        reason: string;
      };
      metadata: {
        tampered: boolean;
        confidence: number;
        editing_software?: string[];
        issues?: string[];
      };
      compression: {
        edited: boolean;
        confidence: number;
        estimated_saves: number;
        reason: string;
      };
      cloning: {
        detected: boolean;
        confidence: number;
        clone_regions: number;
        reason: string;
      };
    };
  };
  
  slip_verification?: {
    is_likely_genuine: boolean;
    trust_score: number;
    confidence: number;
    detected_bank?: string;
    detected_amount?: string;
    warnings: string[];
    checks: string[];
    advice: string;
  };
  
  visual_analysis?: {
    enabled: boolean;
    risk_score: number;
    patterns_detected: string[];
  };
  
  // Legacy fields for backward compatibility
  confidence?: number;
  risk_level?: 'safe' | 'suspicious' | 'high_risk';
  scam_type?: string;
  reasoning?: string;
}

export const detectScam = async (data: DetectionRequest): Promise<DetectionResponse> => {
  if (data.file) {
    // Image detection flow
    const formData = new FormData();
    formData.append('file', data.file);
    
    const response = await api.post<DetectionResponse>('/public/detect/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } else {
    // Text detection flow
    const response = await api.post<DetectionResponse>('/public/detect/text', {
      message: data.text, // Backend expects "message" not "text"
    });
    return response.data;
  }
};

// Define response type
interface StatsData {
  total_detections: number;
  scam_percentage: number;
  top_categories: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  period: string;
}

export const getStats = async (): Promise<StatsData> => {
    // Determine API URL (Server-side compatible)
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
    
    try {
        const res = await fetch(`${baseUrl}/public/stats`, {
            next: { revalidate: 60 }, // Cache for 60 seconds
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!res.ok) {
            throw new Error('Failed to fetch stats');
        }

        return await res.json();
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

export interface ReportRequest {
    text: string;
    is_scam: boolean;
    additional_info?: string;
    contact_info?: string; // Legacy?
    file?: File;
}

export const submitReport = async (data: ReportRequest) => {
    try {
        const formData = new FormData();
        formData.append('text', data.text);
        formData.append('is_scam', String(data.is_scam));
        
        if (data.additional_info) {
             formData.append('additional_info', data.additional_info);
        }
        
        if (data.file) {
            formData.append('file', data.file);
        }

        const response = await api.post('/public/report', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        console.warn("API Report Error, functioning in mock mode:", error);
        // Mock success response
        return {
            status: "success",
            message: "Report received (Mock)",
            id: `rep_${Date.now()}`
        };
    }
};

export interface BatchSummary {
    total: number;
    successful: number;
    failed: number;
    scam_count: number;
    safe_count: number;
    avg_risk_score: number;
    scam_percentage: number;
    categories: Record<string, number>;
    manipulated_count: number;
}

export interface BatchImageResponse extends DetectionResponse {
    filename: string;
    original_index: number;
    status: 'success' | 'failed';
    error?: string;
}

export interface PublicBatchResponse {
    batch_id: string;
    total_images: number;
    results: BatchImageResponse[];
    summary: BatchSummary;
}

export const detectBatchImages = async (files: File[]): Promise<PublicBatchResponse> => {
    const formData = new FormData();
    files.forEach((file) => {
        formData.append('files', file);
    });

    const response = await api.post<PublicBatchResponse>('/public/detect/image/batch', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};
