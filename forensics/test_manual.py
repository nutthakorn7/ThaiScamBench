"""
Simple manual test for forensics service
"""
import requests
import sys
from pathlib import Path

def test_health():
    """Test health endpoint"""
    print("Testing /health endpoint...")
    try:
        resp = requests.get("http://localhost:8001/health", timeout=2)
        print(f"✓ Status: {resp.status_code}")
        print(f"  Response: {resp.json()}")
        return True
    except Exception as e:
        print(f"✗ Failed: {e}")
        return False

def test_analyze(image_path: str):
    """Test analyze endpoint"""
    print(f"\nTesting /forensics/analyze with {image_path}...")
    
    if not Path(image_path).exists():
        print(f"✗ File not found: {image_path}")
        return False
    
    try:
        with open(image_path, 'rb') as f:
            files = {'file': f}
            resp = requests.post("http://localhost:8001/forensics/analyze", 
                               files=files, timeout=10)
        
        print(f"✓ Status: {resp.status_code}")
        result = resp.json()
        print(f"  Result: {result['forensic_result']}")
        print(f"  Score: {result['score']:.2f}")
        print(f"  Reasons: {result['reasons']}")
        
        print("\n  [Features]")
        if "file_metadata" in result["features"]:
            meta = result["features"]["file_metadata"]
            print(f"  • Metadata: Software={meta.get('software_tag')}, Entropy={meta.get('file_entropy', 0):.2f}")
            
        if "jpeg_forensics" in result["features"]:
            jpeg = result["features"]["jpeg_forensics"]
            print(f"  • JPEG: Quality={jpeg.get('estimated_quality')}, Tables={jpeg.get('quantization_tables_count')}")
            if jpeg.get("is_photoshop_qt"):
                print("    ⚠ Photoshop Quantization Table detected")
                
        if "noise_analysis" in result["features"]:
            noise = result["features"]["noise_analysis"]
            print(f"  • Noise: Variance={noise.get('noise_variance', 0):.4f}, Ratio={noise.get('local_noise_ratio', 0):.2f}")
            if noise.get("is_too_smooth"):
                print("    ⚠ Image is unnaturally smooth (AI-like)")
            if noise.get("has_inconsistent_noise"):
                print("    ⚠ Inconsistent noise levels detected (Splicing)")

        if "frequency_analysis" in result["features"]:
            fft = result["features"]["frequency_analysis"]
            print(f"  • FFT: HighFreq={fft.get('high_freq_energy', 0):.2f}, Spikes={fft.get('has_periodic_spikes')}")
            if fft.get("is_gan_artifact"):
                print("    ⚠ Periodic frequency artifacts detected (GAN/AI)")
        
        return True
    except Exception as e:
        print(f"✗ Failed: {e}")
        return False

if __name__ == "__main__":
    print("=" * 50)
    print("Forensics Service Manual Test")
    print("=" * 50)
    
    # Test health
    health_ok = test_health()
    
    # Test analyze if image provided
    if len(sys.argv) > 1:
        analyze_ok = test_analyze(sys.argv[1])
    else:
        print("\nSkipping analyze test (no image provided)")
        print("Usage: python test_manual.py <image_path>")
        analyze_ok = True
    
    print("\n" + "=" * 50)
    if health_ok and analyze_ok:
        print("✓ All tests passed!")
    else:
        print("✗ Some tests failed")
    print("=" * 50)
