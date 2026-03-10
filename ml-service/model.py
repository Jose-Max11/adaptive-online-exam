import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import MinMaxScaler
import joblib
import os

# Feature columns
FEATURES = ['eye_deviation', 'head_movement', 'mouse_idle_time', 'response_time']

# Synthetic training data for initial model fitting
# In production, train on real historical behavior logs
def _synthetic_training_data(n=500):
    np.random.seed(42)
    normal = pd.DataFrame({
        'eye_deviation':   np.random.uniform(0, 15, n),
        'head_movement':   np.random.uniform(0, 10, n),
        'mouse_idle_time': np.random.uniform(0, 30, n),
        'response_time':   np.random.uniform(10, 120, n),
    })
    anomalous = pd.DataFrame({
        'eye_deviation':   np.random.uniform(40, 100, n // 5),
        'head_movement':   np.random.uniform(40, 100, n // 5),
        'mouse_idle_time': np.random.uniform(90, 300, n // 5),
        'response_time':   np.random.uniform(1, 4,   n // 5),
    })
    return pd.concat([normal, anomalous], ignore_index=True)


MODEL_PATH = 'isolation_forest_model.pkl'
SCALER_PATH = 'scaler.pkl'


def train_and_save():
    """Train Isolation Forest on synthetic data and persist."""
    df = _synthetic_training_data()
    scaler = MinMaxScaler()
    X_scaled = scaler.fit_transform(df[FEATURES])

    clf = IsolationForest(
        n_estimators=200,
        contamination=0.15,
        random_state=42,
        n_jobs=-1,
    )
    clf.fit(X_scaled)

    joblib.dump(clf, MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)
    return clf, scaler


def load_or_train():
    """Load persisted model or train a fresh one."""
    if os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH):
        clf    = joblib.load(MODEL_PATH)
        scaler = joblib.load(SCALER_PATH)
    else:
        clf, scaler = train_and_save()
    return clf, scaler


def predict_risk(features: dict) -> float:
    """
    features keys: eye_deviation, head_movement, mouse_idle_time, response_time
    Returns: risk_score in [0.0, 1.0]
    """
    clf, scaler = load_or_train()

    row = np.array([[
        features.get('eye_deviation',   0),
        features.get('head_movement',   0),
        features.get('mouse_idle_time', 0),
        features.get('response_time',   60),
    ]])

    row_scaled = scaler.transform(row)
    # Isolation Forest: score_samples returns negative anomaly scores
    raw_score = clf.score_samples(row_scaled)[0]  # range roughly [-0.5, 0.5]
    # Map to [0, 1]: more negative → higher risk
    risk_score = float(np.clip(1.0 - (raw_score + 0.5), 0.0, 1.0))
    return round(risk_score, 4)
