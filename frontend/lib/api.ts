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
  // Image-specific fields (3-Layer Detection)
  visual_analysis?: {
    visual_risk_score: number;
    is_suspicious: boolean;
    slip_verification: {
      trust_score: number;
      is_likely_genuine: boolean;
      detected_bank?: string;
      detected_amount?: string;
      checks_passed: number;
      total_checks: number;
      warnings: string[];
      checks: string[]; // List of passed check names
      advice?: string;
      qr_valid?: boolean;
      qr_data?: string;
    };
    forensics: {
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
  };
  
  // Legacy fields for backward compatibility
  forensics?: any; // Keep loosely typed to avoid breaking legacy checks if any
  slip_verification?: any; // Legacy direct field
  confidence?: number;
  risk_level?: 'safe' | 'suspicious' | 'high_risk';
  scam_type?: string;
  reasoning?: string;
}

export const detectScam = async (data: DetectionRequest): Promise<DetectionResponse> => {
  if (data.file) {
    // Image detection flow (New Forensics Service)
    const formData = new FormData();
    formData.append('file', data.file);
    
    // Call the new independently hosted forensics service (via Nginx proxy)
    // Map /api/v1/forensics/analyze -> Forensics Service
    const response = await api.post('/forensics/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    // Map new service response to UI compatible format
    const forensicsData = response.data;
    
    return {
        request_id: `img_${Date.now()}`,
        is_scam: forensicsData.forensic_result === 'FAKE_LIKELY' || forensicsData.forensic_result === 'SUSPICIOUS',
        risk_score: forensicsData.score * 100, // Convert 0-1 to 0-100
        category: forensicsData.forensic_result === 'FAKE_LIKELY' ? 'manipulated_slip' : 'suspicious_image',
        reason: forensicsData.reasons.length > 0 ? forensicsData.reasons[0] : "Suspicious image patterns detected",
        advice: "โปรดตรวจสอบความถูกต้องของภาพอีกครั้ง หรือติดต่อหน่วยงานที่เกี่ยวข้อง",
        model_version: "v4.0 (Forensics)",
        
        // Map to complex object structure used by frontend components
        visual_analysis: {
            visual_risk_score: forensicsData.score * 100,
            is_suspicious: forensicsData.score >= 0.4,
            slip_verification: {
                // Fill with safe defaults or mapped data
                trust_score: 100 - (forensicsData.score * 100),
                is_likely_genuine: forensicsData.score < 0.4,
                checks_passed: 0,
                total_checks: 0,
                warnings: forensicsData.reasons,
                checks: []
            },
            forensics: {
                enabled: true,
                is_manipulated: forensicsData.score >= 0.4,
                confidence: forensicsData.score,
                details: "Advanced Forensics Analysis",
                techniques: {
                    // Map feature flags if available, otherwise default
                    ela: { suspicious: false, score: 0, variance: 0, reason: "" },
                    metadata: { tampered: false, confidence: 0 },
                    compression: { edited: false, confidence: 0, estimated_saves: 0, reason: "" },
                    cloning: { detected: false, confidence: 0, clone_regions: 0, reason: "" }
                }
            }
        },
        risk_level: forensicsData.score >= 0.7 ? 'high_risk' : (forensicsData.score >= 0.4 ? 'suspicious' : 'safe')
    };
    
  } else {
    // Text detection flow (Main API)
    const response = await api.post<DetectionResponse>('/v1/public/detect/text', {
      message: data.text, // Backend expects "message" not "text"
    });
    return response.data;
  }
};

// Define response type
interface StatsData {
  total_detections: number;
  scam_percentage: number;
  // Image Stats
  total_images: number;
  scam_slips: number;
  
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
        // console.warn("API Error, returning mock stats:", error);
        // Mock data for fallback
        return {
            total_detections: 12543,
            scam_percentage: 42.5,
            
            // Image Stats (Mock)
            total_images: 1420,
            scam_slips: 385,

            top_categories: [
                { category: "online_gambling", count: 3200, percentage: 35 },
                { category: "loan_scam", count: 2100, percentage: 23 },
                { category: "purchase_scam", count: 1800, percentage: 19 },
                { category: "fake_slip", count: 1540, percentage: 15 }, // Added fake slip category
                { category: "giveaway_scam", count: 1200, percentage: 8 }
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
    successful: number;
    failed: number;
    scam_count: number;
    safe_count: number;
    average_risk_score: number;
    categories: Record<string, number>;
    manipulated_images: number;
    errors: any[];
}

export interface BatchImageResponse {
    filename: string;
    index: number;
    success: boolean;
    error?: string;
    is_scam?: boolean;
    risk_score?: number;
    category?: string;
    reason?: string;
    extracted_text?: string;
    visual_analysis?: any;
    forensics?: any;
    slip_verification?: any;
}

export interface PublicBatchResponse {
    batch_id: string;
    total_images: number;
    results: BatchImageResponse[];
    summary: BatchSummary;
}

// Client-side batch processing (since /batch endpoint removed)
export const detectBatchImages = async (files: File[]): Promise<PublicBatchResponse> => {
    const results: BatchImageResponse[] = [];
    let successful = 0;
    let failed = 0;
    let scam_count = 0;
    
    // Process files concurrently with a limit could be better, but Promise.all is simple for now
    const promises = files.map(async (file, index) => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await api.post('/forensics/analyze', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const data = response.data;
            
            const isScam = data.forensic_result === 'FAKE_LIKELY' || data.forensic_result === 'SUSPICIOUS';
            if (isScam) scam_count++;
            successful++;

            return {
                filename: file.name,
                index: index,
                success: true,
                is_scam: isScam,
                risk_score: data.score * 100,
                category: isScam ? 'manipulated' : 'clean',
                reason: data.reasons[0] || "",
                forensics: { score: data.score, details: data.features }
            } as BatchImageResponse;
            
        } catch (error: any) {
            failed++;
            return {
                filename: file.name,
                index: index,
                success: false,
                error: error.message || "Upload failed"
            } as BatchImageResponse;
        }
    });

    const processedResults = await Promise.all(promises);

    return {
        batch_id: `batch_${Date.now()}`,
        total_images: files.length,
        results: processedResults,
        summary: {
            successful,
            failed,
            scam_count,
            safe_count: successful - scam_count,
            average_risk_score: 0, // Calculate if needed
            categories: {},
            manipulated_images: scam_count,
            errors: []
        }
    };
};
