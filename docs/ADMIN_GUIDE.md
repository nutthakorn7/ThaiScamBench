# 🔍 Admin Review Dashboard - User Guide

## Purpose

The Review Dashboard helps identify cases where the model is **uncertain** or **makes mistakes**, which are perfect for:
- 🎯 Adjusting detection rules
- 📝 Improving AI prompts
- 🏋️ Adding to training dataset

## What Gets Flagged

### 1. Uncertain Cases (Risk 40-60%)
Messages where the model isn't confident:
```
Risk Score: 45% - Model can't decide if it's scam or not
→ Perfect for reviewing detection logic
```

### 2. Incorrect Feedback
Messages where users clicked "❌ ผลลัพธ์ไม่ตรง":
```
3+ incorrect feedback = HIGH PRIORITY
→ Model is clearly wrong, needs immediate attention
```

## Priority Levels

| Priority | Criteria | Action |
|----------|----------|--------|
| 🔴 HIGH | 3+ incorrect feedback | Review immediately, add to training |
| 🟡 MEDIUM | 1-2 incorrect feedback | Review when possible |
| 🟢 LOW | Just uncertain (40-60%) | Review for edge cases |

## How to Use

### Access the Dashboard

```
URL: http://localhost:8000/admin/review.html
Auth: Enter admin token when prompted
```

### Review Workflow

1. **Check Stats** - See how many cases need review
2. **Filter Cases** - Use filter buttons:
   - "All Cases" - Everything
   - "Uncertain Only" - Risk 40-60%
   - "Incorrect Feedback" - User-reported errors
   - "High Priority" - Most urgent cases

3. **Review Each Case:**
   - Check risk score and category
   - See incorrect feedback count
   - Note the channel (SMS, LINE, etc.)

4. **Take Action:**
   - 🏷️ "Add to Training" - Mark for model retraining
   - 📝 "Mark Reviewed" - Track what you've checked

5. **Export Data:**
   - Click "📊 Export for Training"
   - Gets JSON file with all cases
   - Use for model improvement

## API Endpoint

```bash
# Get uncertain cases
curl http://localhost:8000/v1/admin/review/uncertain?limit=50 \
  -H "Authorization: Bearer admin-secret-key-2024"
```

**Parameters:**
- `limit` - Max results (default: 50)
- `include_feedback` - Include incorrect feedback (default: true)

**Response:**
```json
{
  "total": 15,
  "uncertain_count": 8,
  "incorrect_feedback_count": 7,
  "cases": [
    {
      "request_id": "abc-123",
      "risk_score": 0.52,
      "category": "normal",
      "incorrect_feedback_count": 3,
      "priority": "high",
      "reason": "incorrect_feedback"
    }
  ]
}
```

## Model Improvement Process

### Step 1: Identify Patterns
Look for common themes in uncertain/incorrect cases:
- Specific scam types being missed
- Normal messages flagged as scams
- New scam patterns not in training data

### Step 2: Adjust Rules
For pattern-based fixes:
- Update keywords in `scam_classifier.py`
- Adjust risk thresholds
- Add new detection patterns

### Step 3: Improve Prompts
For AI explanation issues:
- Update prompts in `llm_explainer.py`
- Add examples for edge cases
- Clarify category definitions

### Step 4: Build Training Set
For model retraining:
```bash
# Export cases
curl http://localhost:8000/v1/admin/review/uncertain?limit=1000 \
  -H "Authorization: Bearer admin-token" \
  > training_candidates.json

# Review and label
# Add to training dataset
# Retrain model with new examples
```

## Example Use Cases

### Case 1: Uncertain Message
```
Message: "โอนเงิน 100 บาท ค่าข้าว"
Risk: 48% (uncertain)
Category: normal

Action: Check if "โอนเงิน" triggers false positives
→ Adjust keyword weights or add context rules
```

### Case 2: High Incorrect Feedback
```
Message: [Legitimate bank notification]
Risk: 85% (high)
Category: fake_officer
Incorrect Feedback: 5 users

Action: This is clearly wrong!
→ Add to training set as "normal" example
→ Review bank notification patterns
```

### Case 3: Edge Case
```
Message: "ลงทุน Bitcoin กับเพื่อน"
Risk: 55% (uncertain)
Category: investment_scam

Action: Personal investment vs scam distinction
→ Add context: "กับเพื่อน" = likely legit
→ Improve keyword context analysis
```

## Dashboard Features

### Visual Indicators
- 🔴 Red border = High priority (3+ incorrect feedback)
- 🟡 Yellow border = Medium priority (1-2 feedback)
- 🟢 Green border = Low priority (just uncertain)

### Stats Overview
- Total cases needing review
- Count of uncertain predictions
- Count with incorrect feedback

### Sorting
Cases are sorted by:
1. Priority (High → Medium → Low)
2. Incorrect feedback count (More → Less)
3. Uncertainty (Closer to 50% first)

## Tips for Effective Review

1. **Start with High Priority** - These are definite mistakes
2. **Look for Patterns** - Don't review one-by-one, find themes
3. **Document Findings** - Note what needs changing
4. **Batch Updates** - Fix similar issues together
5. **Test Changes** - Verify improvements with test cases

## Data Privacy Note

⚠️ **Important:** Message hashes are shown, not original text
- Cannot see actual message content
- Privacy preserved while still useful for analysis
- Use metadata (risk, category, feedback) for decisions

## Next Steps After Review

1. **Quick Fixes** (Today):
   - Adjust problematic keywords
   - Update thresholds if needed

2. **Medium Changes** (This Week):
   - Update AI prompts
   - Add new detection patterns
   - Refine category definitions

3. **Model Retraining** (This Month):
   - Collect 100+ labeled cases
   - Create training dataset
   - Retrain and A/B test new model

## Monitoring

Track improvement over time:
```bash
# Check if uncertain cases are decreasing
Week 1: 50 uncertain cases
Week 2: 35 uncertain cases (improving!)
Week 3: 20 uncertain cases (much better!)

# Check if incorrect feedback is dropping
Month 1: 15% incorrect feedback rate
Month 2: 8% incorrect feedback rate (success!)
```

## Summary

**The Review Dashboard is your model improvement command center!**

Use it to:
- ✅ Find what the model struggles with
- ✅ Collect cases for retraining
- ✅ Track improvement progress
- ✅ Build a better scam detector

**Start reviewing** → **Make improvements** → **Deploy** → **Repeat!**
