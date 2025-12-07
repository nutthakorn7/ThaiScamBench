import requests
import os

# Use one of the generated slide images as a test case
IMAGE_PATH = "/Users/pop7/.gemini/antigravity/brain/97f27e07-9e29-4a02-bfb9-3adeb1b61dd2/problem_slide_1765128489922.png"
API_URL = "http://localhost:8000/v1/public/detect/image"

def test_ocr():
    if not os.path.exists(IMAGE_PATH):
        print(f"Error: Test image not found at {IMAGE_PATH}")
        return

    print(f" sending image: {IMAGE_PATH} to {API_URL}...")
    
    try:
        with open(IMAGE_PATH, 'rb') as f:
            files = {'file': ('test_image.png', f, 'image/png')}
            response = requests.post(API_URL, files=files)
            
        if response.status_code == 200:
            result = response.json()
            print("\n✅ API Response Success!")
            print("-" * 50)
            print(f"Risk Score: {result['risk_score']}")
            print(f"Is Scam: {result['is_scam']}")
            print(f"Category: {result['category']}")
            print("-" * 50)
            print("📜 Extracted Text (OCR Result):")
            print(result['extracted_text'][:500] + "...") # Print first 500 chars
            print("-" * 50)
        else:
            print(f"❌ API Error: {response.status_code}")
            print(response.text)

    except Exception as e:
        print(f"❌ Connection Error: {str(e)}")
        print("Make sure the server is running on localhost:8000")

if __name__ == "__main__":
    test_ocr()
