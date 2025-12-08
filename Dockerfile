# ==============================================================================
# Layer 1: Base Python Image
# ==============================================================================
FROM python:3.9-slim AS base

# Set environment variables for Python
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# ==============================================================================
# Layer 2: Build Dependencies (gcc, etc.)
# ==============================================================================
FROM base AS build-deps

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# ==============================================================================
# Layer 3: Python Dependencies (cached layer)
# ==============================================================================
FROM build-deps AS python-deps

# Copy only requirements first for better caching
COPY requirements.txt .

# Install Python packages globally (not --user)
RUN pip install --no-cache-dir -r requirements.txt

# ==============================================================================
# Layer 4: Runtime Base (minimal runtime dependencies)
# ==============================================================================
FROM base AS runtime

# Install only runtime dependencies (not build tools)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user early
RUN useradd -m -u 1000 -s /bin/bash appuser

# ==============================================================================
# Layer 5: Final Application Image
# ==============================================================================
FROM runtime AS production

# Copy installed Python packages from python-deps stage
COPY --from=python-deps /usr/local/lib/python3.9/site-packages /usr/local/lib/python3.9/site-packages
COPY --from=python-deps /usr/local/bin /usr/local/bin

# Copy application code
COPY --chown=appuser:appuser . .

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"

# Default command
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
