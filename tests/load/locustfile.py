"""
Load testing with Locust

Simulates realistic user load on the API.
"""
from locust import HttpUser, task, between
import random


# Test messages
TEST_MESSAGES = [
    "คุณมีพัสดุค้างชำระ 50 บาท กรุณาชำระที่ https://fake.com",
    "สวัสดีครับ สบายดีไหม วันนี้อากาศดีมาก",
    "ธนาคารแจ้ง: กรุณาแจ้งรหัส OTP เพื่อยืนยันตัวตน",
    "ยินดีด้วย! คุณถูกรางวัล 100,000 บาท",
    "ลงทุนน้อย รวยเร็ว รับประกันกำไร 30% ต่อเดือน",
    "สำนักงานตำรวจแจ้งว่าคุณมีหมายจับ กรุณาโอนเงินประกัน",
]


class ThaiScamBenchUser(HttpUser):
    """
    Simulate user behavior on ThaiScamBench API
    
    Run with:
        locust -f tests/load/locustfile.py --host=http://localhost:8000
    """
    
    # Wait 1-3 seconds between requests
    wait_time = between(1, 3)
    
    @task(10)
    def detect_scam(self):
        """Test scam detection endpoint (most common)"""
        message = random.choice(TEST_MESSAGES)
        
        self.client.post(
            "/v1/public/detect/text",
            json={
                "message": message,
                "channel": random.choice(["SMS", "LINE", "Email"])
            },
            name="/v1/public/detect/text"
        )
    
    @task(1)
    def submit_feedback(self):
        """Test feedback submission (less common)"""
        # First detect
        response = self.client.post(
            "/v1/public/detect/text",
            json={"message": random.choice(TEST_MESSAGES)}
        )
        
        if response.status_code == 200:
            request_id = response.json().get("request_id")
            
            # Then submit feedback
            self.client.post(
                "/v1/public/feedback",
                json={
                    "request_id": request_id,
                    "is_correct": random.choice([True, False]),
                    "comment": "Test feedback"
                },
                name="/v1/public/feedback"
            )
    
    @task(2)
    def health_check(self):
        """Test health endpoint"""
        self.client.get("/health", name="/health")
    
    def on_start(self):
        """Called when user starts"""
        pass


class AdminUser(HttpUser):
    """
    Simulate admin user behavior
    
    Run with:
        locust -f tests/load/locustfile.py --host=http://localhost:8000 --tags admin
    """
    
    wait_time  = between(2, 5)
    
    # Admin token (should be from env in real scenario)
    admin_token = "your-admin-token-here"
    
    @task
    def get_stats(self):
        """Test admin stats endpoint"""
        self.client.get(
            "/admin/stats/summary",
            headers={"Authorization": f"Bearer {self.admin_token}"},
            name="/admin/stats/summary"
        )
