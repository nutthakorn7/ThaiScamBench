import unittest
from app.utils.slip_verification import analyze_amount_anomalies, parse_promptpay_amount

class TestSlipVerificationUtils(unittest.TestCase):
    
    def test_analyze_amount_anomalies(self):
        # Good amounts
        self.assertEqual(analyze_amount_anomalies("1,234.56"), [])
        self.assertEqual(analyze_amount_anomalies("500.00"), [])
        
        # Anomalous amounts
        warnings = analyze_amount_anomalies("999,999.00")
        self.assertTrue(any("ในสลิปปลอม" in w for w in warnings))
        
        warnings = analyze_amount_anomalies("50,000.00") # Round number
        self.assertTrue(any("ตัวเลขกลม" in w for w in warnings))
        
        warnings = analyze_amount_anomalies("2,000,000.00") # High amount
        self.assertTrue(any("สูงผิดปกติ" in w for w in warnings))

    def test_parse_promptpay_amount(self):
        # Tag 54 is Amount. 
        # TLV format: ID(2) Length(2) Value(L)
        # ID 54, Length 04, Value "123.00" -> 5406123.00 (Example length logic check)
        # Length of "123.00" is 6. So 54 06 123.00
        
        payload_with_amount = "0002010102115406123.005802TH" 
        # 54 = Tag Amount
        # 06 = Length
        # 123.00 = Value
        
        amount = parse_promptpay_amount(payload_with_amount)
        self.assertEqual(amount, 123.00)
        
        # Invalid payload
        self.assertIsNone(parse_promptpay_amount("invalid"))
        self.assertIsNone(parse_promptpay_amount("0000")) # Too short
