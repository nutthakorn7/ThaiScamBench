# ThaiScamBench Dataset

## Dataset Structure

ข้อมูลเก็บในรูปแบบ JSONL (JSON Lines) ไฟล์ละ 1 record ต่อบรรทัด

### Train Set: `train.jsonl`
- จำนวน: 1,000+ samples
- ใช้สำหรับ: train baseline models

### Validation Set: `val.jsonl`  
- จำนวน: 200+ samples
- ใช้สำหรับ: hyperparameter tuning

### Test Set: `test.jsonl`
- จำนวน: 500+ samples  
- ใช้สำหรับ: final evaluation
- **ห้าม** ใช้ในการ train

---

## Record Format

```json
{
  "id": "msg_001",
  "text": "คุณมีพัสดุค้างชำระ 50 บาท กรุณาชำระที่ https://fake-link.com",
  "label": "parcel_scam",
  "source": "synthetic",
  "metadata": {
    "channel": "SMS",
    "created_at": "2024-12-01T10:00:00Z",
    "language": "th"
  }
}
```

### Fields

- **id** (string): Unique identifier
- **text** (string): Message content (Thai language)
- **label** (string): Scam category (see below)
- **source** (string): Data source (synthetic/public/anonymized)
- **metadata** (object): Additional context

---

## Labels

| Label | Thai Name | Description |
|-------|-----------|-------------|
| `normal` | ข้อความปกติ | Normal, safe messages |
| `parcel_scam` | หลอกลวงพัสดุ | Fake parcel delivery scams |
| `banking_scam` | หลอกลวงธนาคาร/OTP | Bank/OTP phishing |
| `prize_scam` | หลอกลวงรางวัล | Fake prize/lottery scams |
| `investment_scam` | หลอกลวงลงทุน | Investment fraud |
| `impersonation_scam` | แอบอ้างเจ้าหน้าที่ | Government official impersonation |
| `loan_scam` | หลอกลวงสินเชื่อ | Loan scams |

---

## Privacy & PDPA Compliance

### ข้อมูลที่ใช้ใน Dataset

✅ **ปลอดภัย - ใช้ได้:**
- Synthetic messages (สร้างขึ้นจากรูปแบบ)
- Public examples (จากข่าว, social media ที่ public)
- Anonymized patterns (ข้อมูลจริงที่ผ่านการ anonymize)

❌ **ห้ามใช้:**
- ข้อความจริงที่มี PII (เบอร์โทร, ชื่อ, ที่อยู่)
- ข้อมูลจากระบบจริงที่ไม่ผ่านการ anonymize
- ข้อมูลที่ไม่ได้รับอนุญาต

### Data Anonymization Process

ถ้าต้องการใช้ข้อมูลจริง:

1. **Remove PII:**
   - เบอร์โทร → `08X-XXX-XXXX`
   - ชื่อบุคคล → `[NAME]`
   - URL → `https://[DOMAIN].com`

2. **Hash sensitive data:**
   ```python
   import hashlib
   hashed = hashlib.sha256(message.encode()).hexdigest()
   ```

3. **Get consent** (ถ้าเป็นข้อมูลผู้ใช้จริง)

---

## Dataset Statistics

| Split | Normal | Scam | Total |
|-------|--------|------|-------|
| Train | TBD | TBD | 1,000+ |
| Val | TBD | TBD | 200+ |
| Test | TBD | TBD | 500+ |

---

## How to Use

### Load Dataset

```python
import json

def load_dataset(path: str):
    examples = []
    with open(path, encoding="utf-8") as f:
        for line in f:
            examples.append(json.loads(line))
    return examples

train_data = load_dataset("datasets/train.jsonl")
```

### Create New Dataset

```bash
python scripts/create_dataset.py
```

---

## Citation

If you use this dataset, please cite:

```bibtex
@misc{thaiscambench2024,
  title={ThaiScamBench: A Benchmark for Thai Scam Message Detection},
  author={Your Name},
  year={2024},
  url={https://github.com/nutthakorn7/ThaiScamBench}
}
```

---

## License

Dataset is released under [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)

- ✅ Use for research
- ✅ Modify and share
- ❌ Commercial use without permission
