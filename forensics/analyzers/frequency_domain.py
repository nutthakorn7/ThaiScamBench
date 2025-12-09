"""
Frequency Domain Analyzer (FFT)

Analyze image in frequency domain to detect periodic patterns (GAN artifacts),
high-frequency energy anomalies, and deepfake artifacts.
"""
import numpy as np
from scipy import fftpack
from PIL import Image
import io
from typing import Dict, List, Optional, Tuple

class FrequencyDomainAnalyzer:
    """Analyze images in frequency domain using FFT"""
    
    def analyze(self, image_bytes: bytes) -> Dict:
        """
        Analyze frequency spectrum
        
        Returns:
            dict with features and suspicious indicators
        """
        features = {}
        warnings = []
        score = 0.0
        
        try:
            # Load and convert to grayscale
            image = Image.open(io.BytesIO(image_bytes)).convert('L')
            
            # Resize for consistent analysis (std 512x512)
            # Powers of 2 are faster for FFT
            if image.width != 512 or image.height != 512:
                image = image.resize((512, 512), Image.Resampling.LANCZOS)
                
            img_array = np.array(image, dtype=float)
            
            # 1. Compute 2D FFT
            f = fftpack.fft2(img_array)
            fshift = fftpack.fftshift(f)
            magnitude_spectrum = 20 * np.log(np.abs(fshift) + 1e-6)
            
            # 2. Analyze Azimuthal Average (Radial Profile)
            # AI images often have different spectral decay rates
            # (drop off faster in high frequencies)
            features["high_freq_energy"] = self._calculate_high_freq_energy(magnitude_spectrum)
            
            # Check for AI artifact: Low high-frequency energy (Too smooth/blur at fine scales)
            # Threshold needs tuning, but < 0.15 is often suspicious for sharp-looking images
            if features["high_freq_energy"] < 0.15:
                warnings.append("low_high_frequency_energy")
                features["is_ai_smooth_spectrum"] = True
                score += 0.3
            
            # 3. Detect Periodic Spikes (Grid Artifacts)
            # GANs and some Diffusion models leave grid-like artifacts in frequency domain
            # We look for bright spots in the spectrum (excluding center)
            has_spikes = self._detect_periodic_spikes(magnitude_spectrum)
            features["has_periodic_spikes"] = has_spikes
            
            if has_spikes:
                warnings.append("periodic_frequency_artifacts")
                features["is_gan_artifact"] = True
                score += 0.5
                
            # 4. Phase Coherence (Simplified)
            # Real images have strong phase coherence for edges
            # Deepfakes sometimes mess this up (hard to calculate cheaply, placeholder for now)
            
        except Exception as e:
            return {
                "error": str(e), 
                "score": 0.0, 
                "features": {}, 
                "warnings": ["frequency_analysis_failed"]
            }
            
        return {
            "features": features,
            "warnings": warnings,
            "score": min(score, 1.0)
        }
    
    def _calculate_high_freq_energy(self, magnitude_spectrum: np.ndarray) -> float:
        """Calculate ratio of energy in high frequencies vs total"""
        h, w = magnitude_spectrum.shape
        cy, cx = h//2, w//2
        
        # Total energy (sum of magnitude)
        total_energy = np.sum(magnitude_spectrum)
        
        # Low frequency energy (center circle)
        y, x = np.ogrid[:h, :w]
        mask_area = (x - cx)**2 + (y - cy)**2 <= (h//4)**2
        low_freq_energy = np.sum(magnitude_spectrum[mask_area])
        
        # High freq is roughly Total - Low
        high_freq_energy = total_energy - low_freq_energy
        
        if total_energy == 0: return 0.0
        return float(high_freq_energy / total_energy)

    def _detect_periodic_spikes(self, magnitude_spectrum: np.ndarray) -> bool:
        """Detect bright spikes in spectrum (excluding DC center)"""
        h, w = magnitude_spectrum.shape
        cy, cx = h//2, w//2
        
        # Mask out the DC component (center star)
        # Natural images have high energy at center
        y, x = np.ogrid[:h, :w]
        center_mask = (x - cx)**2 + (y - cy)**2 <= 20**2 # 20px radius
        
        spectrum_no_dc = magnitude_spectrum.copy()
        spectrum_no_dc[center_mask] = 0
        
        # Calculate threshold for "spike"
        # Spikes are significantly brighter than local neighborhood
        mean = np.mean(spectrum_no_dc)
        std = np.std(spectrum_no_dc)
        threshold = mean + 5 * std  # Very bright spots
        
        # Count spikes
        spikes = np.sum(spectrum_no_dc > threshold)
        
        # If too many spikes (starry sky), likely GAN grid artifacts
        # Natural images are usually smooth clouds in freq domain
        return bool(spikes > 10)
