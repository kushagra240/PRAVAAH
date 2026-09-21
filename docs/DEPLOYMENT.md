# PRAVAAH — Production Deployment & Cloud Infrastructure Guide

---

## 1. Cloud Architecture Overview

PRAVAAH is designed for deployment on **Google Cloud Platform (GCP)**:

- **Frontend**: Static React + Vite build (`frontend/dist/`) hosted on Firebase Hosting or Cloud Run NGINX container.
- **Backend API**: FastAPI application (`backend/pravaah/main.py`) running on Google Cloud Run (2 vCPU, 4 GB RAM, `min-instances=1`).
- **Storage & Database**: Managed Cloud SQL (PostgreSQL 16 + PostGIS 3.4) for asset directories and audit logs; Cloud Storage (GCS) for static feature cubes and model artifacts.

---

## 2. Environment Variables

| Variable | Description | Default / Example |
|---|---|---|
| `GEMINI_API_KEY` | Google AI Studio API Key for Gemini 3.7 Flash | `AIzaSy...` |
| `GEMINI_MODEL` | Pinned Gemini Model Identifier | `gemini-3.7-flash` |
| `DATABASE_URL` | Database Connection String | `sqlite:///./pravaah.db` / `postgresql://user:pass@host/db` |
| `DEFAULT_REGION` | Initial Region Identifier | `odisha_coastal` |
| `H3_RESOLUTION` | Operational Hexagonal Grid Resolution | `8` |

---

## 3. Docker Container Build

Build and test backend container locally:

```bash
docker build -t pravaah-api -f infrastructure/docker/Dockerfile.api .
docker run -p 8000:8000 -e GEMINI_API_KEY=$GEMINI_API_KEY pravaah-api
```

---

## 4. Deploying Backend to Google Cloud Run

```bash
# 1. Authenticate with GCP
gcloud auth login
gcloud config set project YOUR_GCP_PROJECT_ID

# 2. Build and submit image to Artifact Registry
gcloud builds submit --tag gcr.io/YOUR_GCP_PROJECT_ID/pravaah-api:v1.0 .

# 3. Deploy to Cloud Run with min-instances=1 for zero cold-start latency
gcloud run deploy pravaah-api \
  --image gcr.io/YOUR_GCP_PROJECT_ID/pravaah-api:v1.0 \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated \
  --min-instances 1 \
  --memory 4Gi \
  --cpu 2 \
  --set-env-vars GEMINI_MODEL="gemini-3.7-flash",DEFAULT_REGION="odisha_coastal"
```
