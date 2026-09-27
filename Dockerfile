# Multi-stage Docker build for PRAVAAH (FastAPI + React Production Image)

# Stage 1: Build React Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Production Python Backend Container
FROM python:3.12-slim AS runner
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code, region data, and built frontend dist
COPY backend ./backend
COPY regions ./regions
COPY cache ./cache
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Set production environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

EXPOSE 8000

# Healthcheck endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8000/api/v1/health || exit 1

# Launch uvicorn web server
CMD ["sh", "-c", "python -m uvicorn backend.pravaah.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
