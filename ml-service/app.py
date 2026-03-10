from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from model import predict_risk, train_and_save
import uvicorn

app = FastAPI(
    title="Behavior Risk Analysis Service",
    description="ML microservice for adaptive exam — analyzes student behavior and returns a risk score using Isolation Forest.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Schema ──────────────────────────────────────────────────────────────────
class BehaviorFeatures(BaseModel):
    eye_deviation:   float = Field(0.0,  description="Eye gaze deviation in degrees")
    head_movement:   float = Field(0.0,  description="Head pose deviation in degrees")
    mouse_idle_time: float = Field(0.0,  description="Mouse idle duration in seconds")
    response_time:   float = Field(60.0, description="Time taken to answer in seconds")


class RiskResponse(BaseModel):
    risk_score:   float
    is_flagged:   bool
    risk_level:   str
    message:      str


# ── Endpoints ────────────────────────────────────────────────────────────────
@app.get("/", summary="Health check")
def health():
    return {"status": "ML service running", "model": "IsolationForest"}


@app.post("/analyze", response_model=RiskResponse, summary="Analyze behavior and return risk score")
def analyze(features: BehaviorFeatures):
    try:
        risk_score = predict_risk(features.dict())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model error: {str(e)}")

    THRESHOLD = 0.6
    is_flagged = risk_score >= THRESHOLD

    if risk_score < 0.3:
        level = "low"
        msg   = "Behavior appears normal."
    elif risk_score < 0.6:
        level = "medium"
        msg   = "Slight anomaly detected. Monitoring closely."
    else:
        level = "high"
        msg   = "High risk detected. Adaptive question replacement triggered."

    return RiskResponse(
        risk_score=risk_score,
        is_flagged=is_flagged,
        risk_level=level,
        message=msg,
    )


@app.post("/retrain", summary="Retrain model with latest synthetic data")
def retrain():
    try:
        train_and_save()
        return {"status": "Model retrained successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health", summary="Detailed health check")
def detailed_health():
    return {
        "status": "ok",
        "service": "Behavior Risk Analysis",
        "algorithm": "IsolationForest",
        "features": ["eye_deviation", "head_movement", "mouse_idle_time", "response_time"],
    }


if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
