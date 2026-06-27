"""
Export Predictions Script
Team AntiGravity | Dataport Hackathon 2024
Loads the trained models and preprocessed test data, generates predictions,
downsamples them to 15-minute intervals for lightweight dashboard loading,
and exports all prediction JSONs to the dashboard folder.
"""

import pandas as pd
import numpy as np
import os
import joblib
import json

PROCESSED_FILE = r"c:\Users\birad\Downloads\AntiGravity\Datport\backend\data\processed_data.parquet"
MODEL_DIR = r"c:\Users\birad\Downloads\AntiGravity\Datport\backend\models"
DASHBOARD_DIR = r"c:\Users\birad\Downloads\AntiGravity\Datport\dashboard"

os.makedirs(DASHBOARD_DIR, exist_ok=True)

print("="*65)
print("  EXPORT: STEP 1 - LOADING TEST DATA & MODELS")
print("="*65)
df = pd.read_parquet(PROCESSED_FILE)
df = df.sort_values(['LINK_ID', 'datetime']).reset_index(drop=True)

# Add lead target for safety risk forecasting
df['risk_lead_3'] = df.groupby('LINK_ID')['accident_risk_score'].shift(-3)
df = df.dropna(subset=['risk_lead_3']).reset_index(drop=True)

# Filter test set (July 11 - July 14)
split_date = pd.to_datetime("2024-07-11 00:00:00")
test_df = df[df['datetime'] >= split_date].reset_index(drop=True)
print(f"Test dataset has {len(test_df):,} rows.")

# Load models
print("Loading LightGBM models...")
cong_model = joblib.load(os.path.join(MODEL_DIR, "lgbm_congestion.pkl"))
speed_model = joblib.load(os.path.join(MODEL_DIR, "lgbm_speed.pkl"))
delay_model = joblib.load(os.path.join(MODEL_DIR, "lgbm_delay.pkl"))
risk_model = joblib.load(os.path.join(MODEL_DIR, "lgbm_risk.pkl"))

# Features used during training
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

# ─────────────────────────────────────────────
print("\n" + "="*65)
print("  EXPORT: STEP 2 - GENERATING PREDICTIONS")
print("="*65)
X_test = test_df[features]

print("Generating predictions...")
test_df['predicted_congestion_prob'] = cong_model.predict_proba(X_test)[:, 1]
test_df['predicted_congestion'] = cong_model.predict(X_test)
test_df['predicted_speed'] = speed_model.predict(X_test)
test_df['predicted_delay'] = delay_model.predict(X_test)
test_df['predicted_risk'] = risk_model.predict(X_test)

# Floor regressor outputs at 0 for logical consistency
test_df['predicted_speed'] = test_df['predicted_speed'].clip(lower=0.0)
test_df['predicted_delay'] = test_df['predicted_delay'].clip(lower=0.0)
test_df['predicted_risk'] = test_df['predicted_risk'].clip(lower=0.0)

# ─────────────────────────────────────────────
print("\n" + "="*65)
print("  EXPORT: STEP 3 - DOWNSAMPLING FOR DASHBOARD")
print("="*65)
# Downsample to 15-minute intervals (keep every 3rd row, since data is 5-min intervals)
# This reduces the payload size by 3x so the web dashboard loads instantly in-browser.
print("Downsampling test predictions to 15-minute intervals...")
test_df_sorted = test_df.sort_values(['LINK_ID', 'datetime']).reset_index(drop=True)
downsampled_df = test_df_sorted.iloc[::3].copy().reset_index(drop=True)

# Select key columns for dashboard use
export_cols = [
    'LINK_ID', 'date', 'hour', 'minute', 'day_of_week',
    'link_vehs', 'link_speed_harm', 'link_delay_max', 'accident_risk_score', 'is_congested',
    'predicted_congestion_prob', 'predicted_congestion',
    'predicted_speed', 'predicted_delay', 'predicted_risk'
]
export_df = downsampled_df[export_cols]
print(f"Export dataset shape: {export_df.shape} ({len(export_df):,} rows)")

# ─────────────────────────────────────────────
print("\n" + "="*65)
print("  EXPORT: STEP 4 - EXPORTING JSON FILES")
print("="*65)

# 1. Export main predictions list
predictions_path = os.path.join(DASHBOARD_DIR, "predictions.json")
# Format dataframe as list of dicts with clean roundings
export_records = export_df.copy()
export_records['link_speed_harm'] = export_records['link_speed_harm'].round(2)
export_records['link_delay_max'] = export_records['link_delay_max'].round(2)
export_records['predicted_speed'] = export_records['predicted_speed'].round(2)
export_records['predicted_delay'] = export_records['predicted_delay'].round(2)
export_records['predicted_risk'] = export_records['predicted_risk'].round(2)
export_records['predicted_congestion_prob'] = export_records['predicted_congestion_prob'].round(4)

records_list = export_records.to_dict(orient='records')
with open(predictions_path, "w") as f:
    json.dump(records_list, f)
print(f"Saved: {predictions_path} ({os.path.getsize(predictions_path)/1024/1024:.2f} MB)")

# 2. Copy feature importance to dashboard
importance_src = os.path.join(MODEL_DIR, "feature_importance.json")
importance_dst = os.path.join(DASHBOARD_DIR, "feature_importance.json")
import shutil
shutil.copyfile(importance_src, importance_dst)
print(f"Saved: {importance_dst}")

# 3. Copy metrics summary to dashboard
metrics_src = os.path.join(MODEL_DIR, "metrics.json")
metrics_dst = os.path.join(DASHBOARD_DIR, "metrics.json")
shutil.copyfile(metrics_src, metrics_dst)
print(f"Saved: {metrics_dst}")

# 4. Create actual vs predicted time series (subset for LINK_ID 1 to make dashboard line chart lightweight)
actuals_pred_path = os.path.join(DASHBOARD_DIR, "actuals_vs_predicted.json")
link_1_df = export_records[export_records['LINK_ID'] == 1].sort_values('date')
link_1_records = link_1_df[['date', 'link_speed_harm', 'predicted_speed', 'link_delay_max', 'predicted_delay', 'accident_risk_score', 'predicted_risk']].to_dict(orient='records')
with open(actuals_pred_path, "w") as f:
    json.dump(link_1_records, f, indent=2)
print(f"Saved: {actuals_pred_path}")

print("\nAll dashboard predictions and metadata successfully exported.")
print("="*65)
