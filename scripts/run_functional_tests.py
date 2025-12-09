
import asyncio
import httpx
import sys
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("FunctionalTest")

API_URL = "http://localhost:8000"
FORENSICS_URL = "http://localhost:8001"
NGINX_URL = "http://localhost:80" # Maps to 80 locally for Nginx if strictly using http, or 443 for https. 
# Based on docker-compose, nginx maps 80:80 and 443:443.

# Test Data
SAFE_TEXT = "สวัสดีครับ วันนี้อากาศดีมาก"
SCAM_TEXT = "คุณเป็นผู้โชคดีได้รับรางวัล Iphone 15 Pro Max คลิกเลย bit.ly/scam"
TEST_IMAGE_PATH = Path("forensics/test_simple.jpg")

async def wait_for_service(url, name, retries=30):
    logger.info(f"Waiting for {name} at {url}...")
    async with httpx.AsyncClient() as client:
        for i in range(retries):
            try:
                resp = await client.get(f"{url}/health")
                if resp.status_code == 200:
                    logger.info(f"✅ {name} is UP!")
                    return True
            except Exception:
                pass
            await asyncio.sleep(2)
            print(".", end="", flush=True)
    logger.error(f"❌ {name} failed to start.")
    return False

async def test_text_detection():
    logger.info("\n🧪 Testing Public Text Detection...")
    async with httpx.AsyncClient() as client:
        # Scam Case
        payload = {"message": SCAM_TEXT, "channel": "SMS"}
        try:
            resp = await client.post(f"{API_URL}/v1/public/detect/text", json=payload)
            if resp.status_code == 200:
                data = resp.json()
                if data.get("is_scam") == True:
                    logger.info("✅ Text Scam Detected Correctly")
                else:
                    logger.warning(f"⚠️ Text Scam Missed: {data}")
            else:
                 logger.error(f"❌ Text API Error: {resp.status_code} - {resp.text}")
        except Exception as e:
            logger.error(f"❌ Text Detection Failed: {e}")

async def test_forensics_analysis():
    logger.info("\n🧪 Testing Forensics Image Analysis...")
    if not TEST_IMAGE_PATH.exists():
        logger.error(f"❌ Test image not found at {TEST_IMAGE_PATH}")
        return

    async with httpx.AsyncClient() as client:
        files = {"file": open(TEST_IMAGE_PATH, "rb")}
        try:
            resp = await client.post(f"{FORENSICS_URL}/forensics/analyze", files=files)
            if resp.status_code == 200:
                data = resp.json()
                logger.info(f"✅ Forensics Analysis Success: {data.get('forensic_result')}")
            else:
                logger.error(f"❌ Forensics API Error: {resp.status_code} - {resp.text}")
        except Exception as e:
            logger.error(f"❌ Forensics Analysis Failed: {e}")

async def main():
    logger.info("🚀 Starting Functional Tests")
    
    # 1. Wait for services
    api_up = await wait_for_service(API_URL, "Main API")
    forensics_up = await wait_for_service(FORENSICS_URL, "Forensics Service")
    
    if not (api_up and forensics_up):
        logger.error("🛑 Aborting tests: Services not ready.")
        sys.exit(1)
        
    # 2. Run Tests
    await test_text_detection()
    await test_forensics_analysis()
    
    logger.info("\n🎉 All Tests Completed!")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
