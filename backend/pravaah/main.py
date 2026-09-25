from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.pravaah.config import settings
from backend.pravaah.api.v1.router import router as api_v1_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="PRAVAAH — Predictive Resilience & Vulnerability Analytics for Anticipatory Action Hub API"
)

# Enable CORS for local dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API v1 router
app.include_router(api_v1_router, prefix=settings.API_V1_STR)

@app.on_event("startup")
def prewarm_cache():
    """Pre-warms baseline scenario impact summary and Dijkstra spatial indices on startup."""
    try:
        from backend.pravaah.api.v1.router import get_run_impact_summary
        get_run_impact_summary("yaas")
    except Exception as e:
        print(f"Prewarm warning: {e}")

@app.get("/")
def root():
    return {
        "message": "Welcome to PRAVAAH API",
        "docs_url": "/docs",
        "version": settings.VERSION
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.pravaah.main:app", host="0.0.0.0", port=8000, reload=True)

