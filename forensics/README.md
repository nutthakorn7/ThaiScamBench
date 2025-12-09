# Forensics Service

Digital forensics service for detecting AI-generated and manipulated images.

## Features

**Phase 1** (Implemented):
- ✅ File & Metadata Analysis (5 features)
  - EXIF data extraction
  - Software tag detection (AI tools, photo editors)
  - JPEG structure analysis (baseline vs progressive)
  - File entropy calculation
  - Timestamp validation

**Coming Soon**:
- ⏳ JPEG Compression Forensics (8 features)
- ⏳ Noise Residual Analysis (7 features)
- ⏳ FFT/Frequency Domain Analysis (8 features)

## Quick Start

```bash
# Install dependencies
cd forensics
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run service
uvicorn main:app --host 0.0.0.0 --port 8001

# Test
curl -X POST http://localhost:8001/forensics/analyze \
  -F "file=@test_image.jpg"
```

## Docker

```bash
# Build
docker build -t thaiscam-forensics .

# Run
docker run -p 8001:8001 thaiscam-forensics
```

## API Endpoints

- `POST /forensics/analyze` - Analyze image
- `GET /health` - Health check
- `GET /metrics` - Service metrics

## Response Format

```json
{
  "forensic_result": "FAKE_LIKELY",
  "score": 0.87,
  "reasons": [
    "ai_software_detected:StableDiffusion",
    "missing_exif"
  ],
  "features": {
    "file_metadata": {
      "exif_exists": false,
      "software_tag": "StableDiffusion",
      "is_ai_generated": true,
      "...": "..."
    }
  }
}
```

## Development

### Adding New Analyzer

1. Create `analyzers/your_analyzer.py`
2. Implement `analyze(image_bytes)` method
3. Import in `main.py`
4. Add to analysis pipeline

### Testing

```bash
pytest tests/
```
