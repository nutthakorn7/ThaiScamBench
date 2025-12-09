import cv2
import numpy as np
import io
import base64
from PIL import Image, ImageChops, ImageEnhance
import logging

logger = logging.getLogger(__name__)

class ELAAnalyzer:
    """
    Error Level Analysis (ELA) Analyzer.
    Detects manipulation by saving the image at a known quality (90-95%) 
    and checking the difference (error level).
    Edited regions usually have different compression levels than the rest.
    """
    
    def analyze(self, image_bytes: bytes) -> dict:
        try:
            # Load original image
            original = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            
            # 1. Save at 90% quality to a buffer
            buffer = io.BytesIO()
            original.save(buffer, "JPEG", quality=90)
            buffer.seek(0)
            
            # 2. Open the resaved image
            resaved = Image.open(buffer)
            
            # 3. Calculate difference (Error Level)
            ela_image = ImageChops.difference(original, resaved)
            
            # 4. Enhance the difference to make it visible
            # Find maximum difference to scale appropriately
            extrema = ela_image.getextrema()
            max_diff = max([ex[1] for ex in extrema])
            
            if max_diff == 0:
                max_diff = 1 # Avoid division by zero
                
            scale = 255.0 / max_diff
            
            # Enhance: brightness * scale
            ela_enhanced = ImageEnhance.Brightness(ela_image).enhance(scale * 10) # Multiply scale to make it clearly visible
            
            # 5. Convert to Base64 for frontend display
            output_buffer = io.BytesIO()
            ela_enhanced.save(output_buffer, format="JPEG")
            ela_base64 = base64.b64encode(output_buffer.getvalue()).decode('utf-8')
            
            # 6. Calculate an "ELA Score" based on variance of the difference
            # High variance in specific regions = potential edit
            ela_np = np.array(ela_image)
            dmean = np.mean(ela_np)
            dstd = np.std(ela_np)
            
            # Simple heuristic score: if there's significant noise
            score = min(1.0, dmean / 10.0)
            
            return {
                "ela_image": f"data:image/jpeg;base64,{ela_base64}",
                "ela_score": float(score),
                "max_difference": int(max_diff)
            }
            
        except Exception as e:
            logger.error(f"ELA Analysis failed: {str(e)}")
            return {
                "ela_image": None,
                "ela_score": 0.0,
                "error": str(e)
            }
