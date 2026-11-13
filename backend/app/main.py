"""
TacticalGhost — Main FastAPI Application Entrypoint.
"See the game beyond the ball."
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes_sequences import router as sequences_router
from app.api.routes_analytics import router as analytics_router
from app.api.routes_comparison import router as comparison_router

app = FastAPI(
    title="TacticalGhost API",
    description="Football tactical intelligence platform analyzing off-ball movement, space creation, pressing, and counterfactual decisions.",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In local dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(sequences_router, prefix="/api")
app.include_router(analytics_router, prefix="/api")
app.include_router(comparison_router, prefix="/api")


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "app": "TacticalGhost",
        "version": "1.0.0",
        "modules": [
            "Space Creation Intelligence",
            "Defensive Vulnerability Detection",
            "Pressing Intelligence",
            "Player Interaction Analysis",
            "Tactical Decision Intelligence"
        ]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
