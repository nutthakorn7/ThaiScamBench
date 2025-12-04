# Baseline Models

ThaiScamBench includes several baseline models สำหรับเปรียบเทียบประสิทธิภาพ

---

## 1. Keyword-Based Classifier (Current)

**File:** `baselines/keyword_classifier.py`

### Approach
- Pattern matching with Thai keywords
- Rule-based category assignment
- Fast inference (< 5ms)

### Performance

| Metric | Score |
|--------|-------|
| Accuracy | ~65% |
| F1-Score | ~0.62 |
| Speed | < 5ms |

### Usage

```python
from baselines.keyword_classifier import KeywordBaseline

model = KeywordBaseline()
result = model.predict("คุณมีพัสดุค้างชำระ 50 บาท")
print(result)  # {"category": "parcel_scam", "risk_score": 0.85}
```

---

## 2. TF-IDF + Logistic Regression (Future)

**Status:** Coming soon

### Approach
- TF-IDF vectorization
- Logistic Regression classifier
- Sklearn implementation

### Training

```bash
python baselines/train_tfidf.py \
  --train datasets/train.jsonl \
  --val datasets/val.jsonl \
  --output models/tfidf_lr.pkl
```

### Expected Performance
- **Accuracy:** ~70-75%
- **Speed:** ~10-20ms
- **Model Size:** < 1MB

---

## 3. Thai BERT Fine-tuned (Future)

**Status:** Planned

### Approach
- Pre-trained Thai BERT (WangchanBERTa)
- Fine-tuned on ThaiScamBench dataset
- State-of-the-art Thai NLP

### Training

```bash
python baselines/train_bert.py \
  --model airesearch/wangchanberta-base-att-spm-uncased \
  --train datasets/train.jsonl \
  --val datasets/val.jsonl \
  --epochs 10 \
  --batch-size 16
```

### Expected Performance
- **Accuracy:** ~85-90%
- **Speed:** ~50-100ms (CPU), ~10ms (GPU)
- **Model Size:** ~400MB

---

## Evaluation

Run evaluation on all baselines:

```bash
# Keyword baseline (current)
python scripts/evaluate.py --api-url http://localhost:8000

# TF-IDF baseline (future)
python scripts/evaluate.py --api-url http://localhost:8001

# BERT baseline (future)
python scripts/evaluate.py --api-url http://localhost:8002
```

---

## Leaderboard

| Model | Accuracy | F1 | Speed | Size |
|-------|----------|-----|-------|------|
| Keyword | 65% | 0.62 | 5ms | < 1KB |
| TF-IDF + LR | TBD | TBD | TBD | TBD |
| Thai BERT | TBD | TBD | TBD | TBD |

---

## Contributing

เรายินดีรับ baseline models เพิ่มเติม!

**วิธีการ:**
1. Fork this repository
2. สร้าง model ใหม่ใน `baselines/your_model.py`
3. Run evaluation: `python scripts/evaluate.py`
4. เพิ่มผลลัพธ์ใน leaderboard
5. Submit Pull Request

### Requirements

- รองรับ Python 3.9+
- ใช้งานง่าย (simple API)
- Documented code
- Evaluation results included

---

## Model Interface

ทุก baseline model ควร implement interface นี้:

```python
class BaselineModel:
    def predict(self, text: str) -> dict:
        """
        Predict scam classification
        
        Args:
            text: Thai message to classify
            
        Returns:
            {
                "category": str,  # scam category or "normal"
                "risk_score": float  # 0.0-1.0
            }
        """
        raise NotImplementedError
```

---

**Last Updated:** December 5, 2024
