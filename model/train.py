"""
Model Training Script
Team AntiGravity | Dataport Hackathon 2024
Loads preprocessed data, splits by date (train: days 1-10, test: days 11-14),
trains four LightGBM models (congestion, speed, delay, future safety risk),
evaluates metrics against baseline Linear Regression models, and saves the models.
"""

import pandas as pd
import numpy as np
import os
import joblib
import lightgbm as lgb
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.metrics import mean_absolute_error, r2_score, accuracy_score, roc_auc_score, mean_squared_error

PROCESSED_FILE = r"c:\Users\birad\Downloads\AntiGravity\Datport\backend\data\processed_data.parquet"
MODEL_DIR = r"c:\Users\birad\Downloads\AntiGravity\Datport\backend\models"

os.makedirs(MODEL_DIR, exist_ok=True)

print("="*65)
print("  TRAINING: STEP 1 - LOADING DATA & LEAD TARGET CREATION")
print("="*65)
df = pd.read_parquet(PROCESSED_FILE)
df = df.sort_values(['LINK_ID', 'datetime']).reset_index(drop=True)

# Create 15-minute lead target for accident risk (predicting risk 15 minutes ahead)
print("Creating 15-minute lead target for Accident Risk Score (safety forecasting)...")
df['risk_lead_3'] = df.groupby('LINK_ID')['accident_risk_score'].shift(-3)
# Drop the last 3 rows per link since they have no lead target
df = df.dropna(subset=['risk_lead_3']).reset_index(drop=True)

# ─────────────────────────────────────────────
print("\n" + "="*65)
print("  TRAINING: STEP 2 - TRAIN/TEST SPLIT BY DATE")
print("="*65)
# Train: July 1 - July 10 (first 10 days)
# Test: July 11 - July 14 (last 4 days)
split_date = pd.to_datetime("2024-07-11 00:00:00")

train_df = df[df['datetime'] < split_date].reset_index(drop=True)
test_df  = df[df['datetime'] >= split_date].reset_index(drop=True)

print(f"Train set: {len(train_df):,} rows (July 1 - July 10)")
print(f"Test set : {len(test_df):,} rows (July 11 - July 14)")

# ─────────────────────────────────────────────
print("\n" + "="*65)
print("  TRAINING: STEP 3 - FEATURE SELECTION")
print("="*65)

# List of input features for the models
features = [
    'LINK_ID', 'day_of_week', 'is_weekend', 'hour', 'minute',
    'is_peak_am', 'is_peak_pm', 'hour_sin', 'hour_cos',
    'speed_lag_1', 'delay_lag_1', 'vehs_lag_1',
    'speed_lag_3', 'delay_lag_3', 'speed_lag_12',
    'vehs_roll_mean_12', 'speed_roll_mean_12',
    'speed_delta', 'speed_variance_lanes', 'lane_balance_index',
    'sudden_speed_drop', 'is_queue_tail', 'is_night_speeding',
    'occupancy_spike'
]

print(f"Using {len(features)} features for training:")
for i, f in enumerate(features, 1):
    print(f"  {i:2d}. {f}")

X_train, y_train_cong, y_train_speed, y_train_delay, y_train_risk = (
    train_df[features], train_df['is_congested'], train_df['link_speed_harm'], train_df['link_delay_max'], train_df['risk_lead_3']
)

X_test, y_test_cong, y_test_speed, y_test_delay, y_test_risk = (
    test_df[features], test_df['is_congested'], test_df['link_speed_harm'], test_df['link_delay_max'], test_df['risk_lead_3']
)

# ─────────────────────────────────────────────
print("\n" + "="*65)
print("  TRAINING: STEP 4 - MODEL 1: CONGESTION CLASSIFICATION")
print("="*65)
print("Training LightGBM Classifier...")
cong_model = lgb.LGBMClassifier(
    n_estimators=100,
    learning_rate=0.05,
    random_state=42,
    verbosity=-1
)
cong_model.fit(X_train, y_train_cong)

# Evaluation
cong_preds = cong_model.predict(X_test)
cong_probs = cong_model.predict_proba(X_test)[:, 1]
lgbm_acc = accuracy_score(y_test_cong, cong_preds)
lgbm_auc = roc_auc_score(y_test_cong, cong_probs)

# Baseline Logistic Regression
print("Training Baseline Logistic Regression...")
base_cong = LogisticRegression(max_iter=1000, random_state=42)
base_cong.fit(X_train.fillna(0), y_train_cong)
base_preds = base_cong.predict(X_test.fillna(0))
base_acc = accuracy_score(y_test_cong, base_preds)

print(f"\nResults for Congestion Classification:")
print(f"  LightGBM Accuracy : {lgbm_acc*100:.2f}% | AUC-ROC: {lgbm_auc:.4f}")
print(f"  Baseline Accuracy : {base_acc*100:.2f}%")
print(f"  Improvement       : {((lgbm_acc - base_acc)/base_acc)*100:+.2f}%")

joblib.dump(cong_model, os.path.join(MODEL_DIR, "lgbm_congestion.pkl"))

# ─────────────────────────────────────────────
print("\n" + "="*65)
print("  TRAINING: STEP 5 - MODEL 2: SPEED REGRESSION")
print("="*65)
print("Training LightGBM Regressor for Speed...")
speed_model = lgb.LGBMRegressor(
    n_estimators=150,
    learning_rate=0.05,
    random_state=42,
    verbosity=-1
)
speed_model.fit(X_train, y_train_speed)

# Evaluation
speed_preds = speed_model.predict(X_test)
lgbm_speed_mae = mean_absolute_error(y_test_speed, speed_preds)
lgbm_speed_r2 = r2_score(y_test_speed, speed_preds)

# Baseline Linear Regression
print("Training Baseline Linear Regression for Speed...")
base_speed = LinearRegression()
base_speed.fit(X_train.fillna(0), y_train_speed)
base_speed_preds = base_speed.predict(X_test.fillna(0))
base_speed_mae = mean_absolute_error(y_test_speed, base_speed_preds)

print(f"\nResults for Speed Regression (SPEEDAVGHARM):")
print(f"  LightGBM MAE      : {lgbm_speed_mae:.3f} km/h | R2: {lgbm_speed_r2:.4f}")
print(f"  Baseline MAE      : {base_speed_mae:.3f} km/h")
print(f"  Improvement (MAE) : {((base_speed_mae - lgbm_speed_mae)/base_speed_mae)*100:+.2f}% reduction in error")

joblib.dump(speed_model, os.path.join(MODEL_DIR, "lgbm_speed.pkl"))

# ─────────────────────────────────────────────
print("\n" + "="*65)
print("  TRAINING: STEP 6 - MODEL 3: QUEUE DELAY REGRESSION")
print("="*65)
print("Training LightGBM Regressor for Delay...")
delay_model = lgb.LGBMRegressor(
    n_estimators=150,
    learning_rate=0.05,
    random_state=42,
    verbosity=-1
)
delay_model.fit(X_train, y_train_delay)

# Evaluation
delay_preds = delay_model.predict(X_test)
lgbm_delay_mae = mean_absolute_error(y_test_delay, delay_preds)
lgbm_delay_rmse = np.sqrt(mean_squared_error(y_test_delay, delay_preds))
lgbm_delay_r2 = r2_score(y_test_delay, delay_preds)

# Baseline Linear Regression
print("Training Baseline Linear Regression for Delay...")
base_delay = LinearRegression()
base_delay.fit(X_train.fillna(0), y_train_delay)
base_delay_preds = base_delay.predict(X_test.fillna(0))
base_delay_mae = mean_absolute_error(y_test_delay, base_delay_preds)

print(f"\nResults for Delay Regression:")
print(f"  LightGBM MAE      : {lgbm_delay_mae:.2f} s | RMSE: {lgbm_delay_rmse:.2f} s | R2: {lgbm_delay_r2:.4f}")
print(f"  Baseline MAE      : {base_delay_mae:.2f} s")
print(f"  Improvement (MAE) : {((base_delay_mae - lgbm_delay_mae)/base_delay_mae)*100:+.2f}% reduction in error")

joblib.dump(delay_model, os.path.join(MODEL_DIR, "lgbm_delay.pkl"))

# ─────────────────────────────────────────────
print("\n" + "="*65)
print("  TRAINING: STEP 7 - MODEL 4: ACCIDENT RISK FORECASTING (15m lead)")
print("="*65)
print("Training LightGBM Regressor for Future Safety Risk...")
risk_model = lgb.LGBMRegressor(
    n_estimators=150,
    learning_rate=0.05,
    random_state=42,
    verbosity=-1
)
risk_model.fit(X_train, y_train_risk)

# Evaluation
risk_preds = risk_model.predict(X_test)
lgbm_risk_mae = mean_absolute_error(y_test_risk, risk_preds)
lgbm_risk_r2 = r2_score(y_test_risk, risk_preds)

# Baseline Linear Regression
print("Training Baseline Linear Regression for Risk...")
base_risk = LinearRegression()
base_risk.fit(X_train.fillna(0), y_train_risk)
base_risk_preds = base_risk.predict(X_test.fillna(0))
base_risk_mae = mean_absolute_error(y_test_risk, base_risk_preds)

print(f"\nResults for 15-Minute Safety Risk Forecasting (ARS):")
print(f"  LightGBM MAE      : {lgbm_risk_mae:.3f} | R2: {lgbm_risk_r2:.4f}")
print(f"  Baseline MAE      : {base_risk_mae:.3f}")
print(f"  Improvement (MAE) : {((base_risk_mae - lgbm_risk_mae)/base_risk_mae)*100:+.2f}% reduction in error")

joblib.dump(risk_model, os.path.join(MODEL_DIR, "lgbm_risk.pkl"))

# ─────────────────────────────────────────────
print("\n" + "="*65)
print("  TRAINING: STEP 8 - FEATURE IMPORTANCE ANALYSIS")
print("="*65)
importance_df = pd.DataFrame({
    'Feature': features,
    'Importance': speed_model.feature_importances_
}).sort_values('Importance', ascending=False)

print("Top 10 Most Influential Features (Speed Model):")
print(importance_df.head(10).to_string(index=False))

# Save importance metadata for dashboard chart
import json
importance_dict = dict(zip(importance_df['Feature'], importance_df['Importance'].astype(int).tolist()))
with open(os.path.join(MODEL_DIR, "feature_importance.json"), "w") as f:
    json.dump(importance_dict, f, indent=2)

# Save evaluation metrics details
metrics_summary = {
    "speed_mae": round(lgbm_speed_mae, 3),
    "speed_r2": round(lgbm_speed_r2, 4),
    "delay_rmse": round(lgbm_delay_rmse, 2),
    "delay_r2": round(lgbm_delay_r2, 4),
    "congestion_accuracy": round(lgbm_acc * 100, 2),
    "congestion_auc": round(lgbm_auc, 4),
    "risk_mae": round(lgbm_risk_mae, 3),
    "risk_r2": round(lgbm_risk_r2, 4),
    "improvement_vs_baseline": round(((base_speed_mae - lgbm_speed_mae)/base_speed_mae)*100, 2)
}
with open(os.path.join(MODEL_DIR, "metrics.json"), "w") as f:
    json.dump(metrics_summary, f, indent=2)

print("\nModel training, evaluation, and serialization complete.")
print("="*65)
