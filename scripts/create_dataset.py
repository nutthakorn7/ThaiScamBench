"""
Create initial ThaiScamBench dataset from synthetic examples
"""
import json
from pathlib import Path
from datetime import datetime
import random

# Synthetic examples for each category
EXAMPLES = {
    "parcel_scam": [
        "คุณมีพัสดุค้างชำระ 50 บาท กรุณาชำระที่ https://fake-parcel.com",
        "Kerry Express แจ้งพัสดุของคุณถูกกัก ค่าธรรมเนียม 45 บาท",
        "DHL พัสดุรอชำระ กดลิงก์เพื่อยืนยันที่อยู่ http://bit.ly/xxxxx",
        "Flash Express มีพัสดุรอชำระ 35 บาท ชำระภายในวันนี้",
        "ไปรษณีย์ไทย พัสดุค้างศุลกากร จ่าย 120 บาท",
    ],
    "banking_scam": [
        "ธนาคารกรุงเทพแจ้ง: บัญชีของคุณผิดปกติ กรุณาแจ้งรหัส OTP",
        "ระบบตรวจพบบัญชีถูกระงับ โทร 02-XXX-XXXX ด่วน",
        "บัตรเครดิตหมดอายุ กรุณายืนยันตัวตน",
        "ตรวจพบการใช้งานผิดปกติ กรอกรหัส OTP ที่ https://fake-bank.com",
        "LINE Banking: บัญชีถูกระงับ ยืนยัน OTP ทันที",
    ],
    "prize_scam": [
        "ยินดีด้วย! คุณถูกรางวัล 100,000 บาท รับที่ http://prize-fake.com",
        "โชคดี! คุณได้รับ iPhone 15 Pro กดรับรางวัล",
        "Shopee แจ้งคุณชนะ voucher 5,000 บาท",
        "True แจ้ง: คุณถูกรางวัลใหญ่ โทรยืนยัน 1234",
        "ขอแสดงความยินดี ได้ทอง 2 บาท ชำระค่าธรรมเนียม 500",
    ],
    "investment_scam": [
        "ลงทุนน้อย รวยเร็ว กำไร 30% ต่อเดือน Forex รับประกัน",
        "โอกาสพิเศษ! ลงทุน Bitcoin 10,000 ได้คืน 50,000 ภายใน 1 เดือน",
        "MLM ธุรกิจออนไลน์ รายได้เดือนละแสน ผลตอบแทน 300%",
        "คริปโต รวยเร็ว ลงทุนวันนี้ ได้กำไร 50% พรุ่งนี้",
        "หุ้น AI ผลตอบแทนสูง 200% ต่อปี รับประกันกำไร",
    ],
    "impersonation_scam": [
        "ตำรวจแจ้งว่าท่านมีหมายจับ กรุณาโอนเงิน 50,000 เพื่อประกันตัว",
        "กรมสรรพากรแจ้งว่าท่านค้างภาษี ติดต่อ 02-XXX-XXXX ด่วน",
        "DSI เรียกตัว พบกิจกรรมผิดกฎหมาย โทรด่วน",
        "ด่วน! คดีความผิดทางอาญา ติดต่อกลับทันที",
        "ศาลแจ้งหมายเรียก คุณโดนฟ้องร้อง",
    ],
    "loan_scam": [
        "กู้เงินด่วน ไม่ต้องค้ำ ไม่เช็คเครดิต อนุมัติทันที 100,000",
        "สินเชื่อง่าย โอนภายใน 30 นาที ดอกเบี้ย 0%",
        "Loan พิเศษ ไม่มีค่าใช้จ่าย ผ่อน 12 เดือน",
        "สินเชื่อออนไลน์ อนุมัติ 24 ชม. โอนเงินทันที",
        "บัตรเครดิตออนไลน์ วงเงิน 200,000 ไม่เช็คบูโร",
    ],
    "normal": [
        "สวัสดีครับ วันนี้ทานข้าวหรือยัง",
        "ขอบคุณมากครับสำหรับความช่วยเหลือ",
        "นัดพบกันที่ร้านกาแฟตอน 2 โมงเย็นนะครับ",
        "ประชุมพรุ่งนี้ 9 โมงเช้า อย่าลืมนะ",
        "เอกสารส่งให้แล้ว เช็คอีเมลด้วยครับ",
        "อากาศวันนี้ดีมาก ไปเดินเล่นกันไหม",
        "สุขสันต์วันเกิดนะครับ ขอให้มีความสุขมากๆ",
        "รถติดมาก คงไปถึงช้านิดหน่อย",
    ],
}

def create_dataset():
    """สร้าง dataset ตัวอย่างจาก synthetic examples"""
    
    all_examples = []
    msg_id = 1
    
    # สร้าง examples
    for label, messages in EXAMPLES.items():
        for text in messages:
            example = {
                "id": f"msg_{msg_id:04d}",
                "text": text,
                "label": label,
                "source": "synthetic",
                "metadata": {
                    "channel": random.choice(["SMS", "LINE", "Email", "WhatsApp"]),
                    "created_at": datetime.now().isoformat(),
                    "language": "th"
                }
            }
            all_examples.append(example)
            msg_id += 1
    
    # Shuffle
    random.seed(42)
    random.shuffle(all_examples)
    
    # Split: 70% train, 15% val, 15% test
    total = len(all_examples)
    train_size = int(total * 0.7)
    val_size = int(total * 0.15)
    
    train_data = all_examples[:train_size]
    val_data = all_examples[train_size:train_size + val_size]
    test_data = all_examples[train_size + val_size:]
    
    # Create datasets directory
    Path("datasets").mkdir(exist_ok=True)
    
    # Write files
    def write_jsonl(data, path):
        with open(path, "w", encoding="utf-8") as f:
            for ex in data:
                f.write(json.dumps(ex, ensure_ascii=False) + "\n")
    
    write_jsonl(train_data, "datasets/train.jsonl")
    write_jsonl(val_data, "datasets/val.jsonl")
    write_jsonl(test_data, "datasets/test.jsonl")
    
    # Print stats
    print("✅ Dataset created successfully!\n")
    print(f"Train: {len(train_data)} examples")
    print(f"Val:   {len(val_data)} examples")
    print(f"Test:  {len(test_data)} examples")
    print(f"Total: {len(all_examples)} examples\n")
    
    # Label distribution
    print("Label distribution:")
    for split_name, split_data in [("Train", train_data), ("Val", val_data), ("Test", test_data)]:
        label_counts = {}
        for ex in split_data:
            label = ex["label"]
            label_counts[label] = label_counts.get(label, 0) + 1
        print(f"\n{split_name}:")
        for label, count in sorted(label_counts.items()):
            print(f"  {label}: {count}")

if __name__ == "__main__":
    create_dataset()
