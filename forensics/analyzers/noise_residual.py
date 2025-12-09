"""
Noise Residual Analyzer

Analyze image noise patterns to detect AI generation (often too smooth/consistent)
and splicing (inconsistent noise levels).
"""
import numpy as np
import pywt
from scipy.stats import skew, kurtosis
from PIL import Image
import io
from typing import Dict, List, Optional, Tuple

class NoiseResidualAnalyzer:
    """Analyze noise residuals using Wavelet Denoising"""
    
    def analyze(self, image_bytes: bytes) -> Dict:
        """
        Analyze noise patterns
        
        Returns:
            dict with features and suspicious indicators
        """
        features = {}
        warnings = []
        score = 0.0
        
        try:
            # Load image and convert to grayscale for noise analysis
            image = Image.open(io.BytesIO(image_bytes)).convert('L')
            
            # Resize if too large to speed up processing (max 1024x1024)
            if image.width > 1024 or image.height > 1024:
                image.thumbnail((1024, 1024))
            
            img_array = np.array(image, dtype=float)
            
            # 1. Extract Noise Residual using Wavelet Transform
            noise = self._extract_noise_wavelet(img_array)
            
            # 2. Calculate Global Statistics
            noise_flat = noise.flatten()
            
            # Variance (Noise Level)
            variance = np.var(noise_flat)
            features["noise_variance"] = float(variance)
            
            # Kurtosis (Peakedness) - Normal distribution should be ~3.0
            # AI images often have non-Gaussian noise (either too flat or too peaked)
            kurt = float(kurtosis(noise_flat))
            features["noise_kurtosis"] = kurt
            
            # Skewness (Asymmetry)
            skew_val = float(skew(noise_flat))
            features["noise_skewness"] = skew_val
            
            # 3. Analyze Patterns
            
            # Check 1: Too Smooth (Typical of AI or excessive filtering)
            # Real cameras usually have variance > 2.0 (depending on ISO)
            # Check 1: Too Smooth (Typical of AI or excessive filtering)
            # Real cameras usually have variance > 2.0 (depending on ISO)
            if variance < 0.5:
                warnings.append("Noise Too Smooth - จุดรบกวนในภาพเรียบเนียนผิดปกติ (มักพบในภาพ AI หรือภาพที่ถูกลบรอย)")
                features["is_too_smooth"] = True
                score += 0.4
            
            # Check 2: Non-Gaussian Noise
            # High kurtosis means heavy tails (outliers)
            if kurt > 10.0:
                warnings.append("Abnormal Noise Distribution - การกระจายตัวของจุดรบกวนผิดธรรมชาติ")
                score += 0.2
            
            # Check 3: Local Noise Consistency (Simplified)
            # Split into 4 blocks and compare variance
            h, w = noise.shape
            h2, w2 = h//2, w//2
            blocks = [
                noise[0:h2, 0:w2], noise[0:h2, w2:w],
                noise[h2:h, 0:w2], noise[h2:h, w2:w]
            ]
            block_vars = [np.var(b) for b in blocks]
            var_ratio = max(block_vars) / (min(block_vars) + 1e-6)
            
            features["local_noise_ratio"] = float(var_ratio)
            
            # If one block has much more noise than others -> Splicing/Editing
            if var_ratio > 3.0: 
                warnings.append("Inconsistent Noise - ระดับจุดรบกวนไม่สม่ำเสมอ (อาจมีการตัดต่อหรือแก้ไขเฉพาะจุด)")
                features["has_inconsistent_noise"] = True
                score += 0.3
                
        except Exception as e:
            return {
                "error": str(e), 
                "score": 0.0, 
                "features": {}, 
                "warnings": ["ไม่สามารถวิเคราะห์จุดรบกวนได้"]
            }
            
        return {
            "features": features,
            "warnings": warnings,
            "score": min(score, 1.0)
        }
    
    def _extract_noise_wavelet(self, img: np.ndarray) -> np.ndarray:
        """
        Extract noise using Wavelet Denoising method.
        Noise = Original - Denoised
        """
        # Decompose using Daubechies wavelet
        coeffs = pywt.dwt2(img, 'db4')
        LL, (LH, HL, HH) = coeffs
        
        # Estimate noise sigma from the finest scale detailed coefficients (HH)
        # using Robust Median Estimator
        sigma = np.median(np.abs(HH)) / 0.6745
        
        # Soft thresholding
        threshold = 3 * sigma
        
        # Threshold high frequency components
        LH_t = pywt.threshold(LH, threshold, mode='soft')
        HL_t = pywt.threshold(HL, threshold, mode='soft')
        HH_t = pywt.threshold(HH, threshold, mode='soft')
        
        # Reconstruct denoised image
        denoised = pywt.idwt2((LL, (LH_t, HL_t, HH_t)), 'db4')
        
        # Ensure dimensions match (wavelet transform can change size by 1px)
        h, w = img.shape
        dh, dw = denoised.shape
        denoised = denoised[:h, :w]
        
        # Residual = Noise
        residual = img - denoised
        return residual
