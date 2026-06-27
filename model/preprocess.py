"""
Dataset Preprocessing & Feature Engineering
Team AntiGravity | Dataport Hackathon 2024
Reads the raw Pangyo traffic CSV, cleans anomalies, aggregates lanes,
engineers ML features (time, lag, physics, safety risk), and saves the clean data.
"""

import pandas as pd
import numpy as np
import os

RAW_CSV_PATH = r"c:\Users\birad\Downloads\AntiGravity\Datport\dataset\Pangyo_14days_lanes_w_arith_adj.csv"
PROCESSED_DIR = r"c:\Users\birad\Downloads\AntiGravity\Datport\backend\data"

os.makedirs(PROCESSED_DIR, exist_ok=True)

print("="*65)
print("  PREPROCESSING: STEP 1 - LOADING DATA")
print("="*65)
df = pd.read_csv(RAW_CSV_PATH)
print(f"Loaded raw dataset with {len(df):,} rows.")

# ─────────────────────────────────────────────
print("\n" + "="*65)
print("  PREPROCESSING: STEP 2 - CLEANING ANOMALIES")
print("="*65)

# 1. Parse datetime
df['datetime'] = pd.to_datetime(df['date'])

# 2. Cap speeds at 150 km/h for realistic dashboard/modeling values
# Any speed above 150 km/h is likely a sensor anomaly or scaling issue.
speed_cols = [c for c in df.columns if 'SPEED' in c]
print("Capping speeds above 150 km/h...")
for col in speed_cols:
    df[col] = df[col].clip(upper=150.0)

# 3. Floor negative values at 0
numeric_cols = df.select_dtypes(include=[np.number]).columns
print("Ensuring no negative values...")
for col in numeric_cols:
    df[col] = df[col].clip(lower=0.0)

print("Anomalies cleaned.")

# ─────────────────────────────────────────────
print("\n" + "="*65)
print("  PREPROCESSING: STEP 3 - LANE AGGREGATION")
print("="*65)
# Aggregate the 6 lanes to get road-link-level metrics
# For speed, we do a weighted average by vehicle count so it represents true traffic speed
vehs_cols = [f'VEHS(ALL)_{i}' for i in range(1, 7)]
harm_cols = [f'SPEEDAVGHARM(ALL)_{i}' for i in range(1, 7)]
arith_cols = [f'SPEEDAVGARITH(ALL)_{i}' for i in range(1, 7)]
delay_cols = [f'QUEUEDELAY(ALL)_{i}' for i in range(1, 7)]
occup_cols = [f'OCCUPRATE(ALL)_{i}' for i in range(1, 7)]

print("Aggregating lane-level variables to road-link-level...")

# Total vehicles across all lanes
df['link_vehs'] = df[vehs_cols].sum(axis=1)

# Weighted average harmonic speed (handling division by zero)
weighted_harm_speed_sum = sum(df[harm_cols[i]] * df[vehs_cols[i]] for i in range(6))
df['link_speed_harm'] = weighted_harm_speed_sum / df['link_vehs']
df['link_speed_harm'] = df['link_speed_harm'].fillna(df[harm_cols].mean(axis=1)) # fallback to simple mean if 0 vehicles

# Weighted average arithmetic speed
weighted_arith_speed_sum = sum(df[arith_cols[i]] * df[vehs_cols[i]] for i in range(6))
df['link_speed_arith'] = weighted_arith_speed_sum / df['link_vehs']
df['link_speed_arith'] = df['link_speed_arith'].fillna(df[arith_cols].mean(axis=1))

# Max queue delay across lanes (represents bottleneck)
df['link_delay_max'] = df[delay_cols].max(axis=1)
df['link_delay_avg'] = df[delay_cols].mean(axis=1)

# Max occupancy rate across lanes
df['link_occup_max'] = df[occup_cols].max(axis=1)
df['link_occup_avg'] = df[occup_cols].mean(axis=1)

# Number of active lanes (lanes with vehicle count > 0)
df['link_active_lanes'] = (df[vehs_cols] > 0).sum(axis=1)

# ─────────────────────────────────────────────
print("\n" + "="*65)
print("  PREPROCESSING: STEP 4 - TIME FEATURES")
print("="*65)
df['hour'] = df['datetime'].dt.hour
df['minute'] = df['datetime'].dt.minute
df['day_of_week'] = df['datetime'].dt.dayofweek + 1 # 1 = Monday, 7 = Sunday
df['is_weekend'] = df['day_of_week'].apply(lambda x: 1 if x >= 6 else 0)

# Peak hours: Morning rush (7-9am) and Evening rush (5-7pm)
df['is_peak_am'] = df['hour'].apply(lambda h: 1 if h in [7, 8, 9] else 0)
df['is_peak_pm'] = df['hour'].apply(lambda h: 1 if h in [17, 18, 19] else 0)

# Cyclical encoding of hour (behaves continuously from 23 to 0)
df['hour_sin'] = np.sin(2 * np.pi * df['hour'] / 24.0)
df['hour_cos'] = np.cos(2 * np.pi * df['hour'] / 24.0)

print("Time features created.")

# ─────────────────────────────────────────────
print("\n" + "="*65)
print("  PREPROCESSING: STEP 5 - LAG FEATURES")
print("="*65)
# Sort to ensure lag operations work correctly
df = df.sort_values(['LINK_ID', 'datetime']).reset_index(drop=True)

print("Creating lag and rolling history features per road link...")
# We use groupby to make sure lag/rolling features don't leak from one link to another
grouped = df.groupby('LINK_ID')

# 1-step lags (5 minutes ago)
df['speed_lag_1'] = grouped['link_speed_harm'].shift(1)
df['delay_lag_1'] = grouped['link_delay_max'].shift(1)
df['vehs_lag_1']  = grouped['link_vehs'].shift(1)

# 3-step lags (15 minutes ago)
df['speed_lag_3'] = grouped['link_speed_harm'].shift(3)
df['delay_lag_3'] = grouped['link_delay_max'].shift(3)

# 1-hour lag (12 steps of 5-mins)
df['speed_lag_12'] = grouped['link_speed_harm'].shift(12)

# 1-hour rolling average (12 steps)
df['vehs_roll_mean_12']  = grouped['link_vehs'].transform(lambda x: x.rolling(12, min_periods=1).mean())
df['speed_roll_mean_12'] = grouped['link_speed_harm'].transform(lambda x: x.rolling(12, min_periods=1).mean())

# Fill missing lag values with forward/backward fill inside each link
df['speed_lag_1'] = df['speed_lag_1'].fillna(df['link_speed_harm'])
df['delay_lag_1'] = df['delay_lag_1'].fillna(df['link_delay_max'])
df['vehs_lag_1']  = df['vehs_lag_1'].fillna(df['link_vehs'])
df['speed_lag_3'] = df['speed_lag_3'].fillna(df['link_speed_harm'])
df['delay_lag_3'] = df['delay_lag_3'].fillna(df['link_delay_max'])
df['speed_lag_12'] = df['speed_lag_12'].fillna(df['link_speed_harm'])

print("Lag and rolling features created.")

# ─────────────────────────────────────────────
print("\n" + "="*65)
print("  PREPROCESSING: STEP 6 - TRAFFIC SAFETY & PHYSICS FEATURES")
print("="*65)

# 1. Harmonic-Arithmetic speed delta (larger delta = unstable stop-and-go behavior)
df['speed_delta'] = df['link_speed_arith'] - df['link_speed_harm']

# 2. Speed variance across active lanes (high variance = sideswipe crash hazard)
active_lane_speeds = df[[f'SPEEDAVGHARM(ALL)_{i}' for i in range(1, 7)]]
df['speed_variance_lanes'] = active_lane_speeds.std(axis=1).fillna(0)

# 3. Lane imbalance index (how unevenly distributed traffic volume is across active lanes)
active_lane_vehs = df[[f'VEHS(ALL)_{i}' for i in range(1, 7)]]
mean_vehs_lanes = active_lane_vehs.mean(axis=1)
std_vehs_lanes  = active_lane_vehs.std(axis=1)
df['lane_balance_index'] = (std_vehs_lanes / mean_vehs_lanes).fillna(0)

# 4. Sudden speed drop (current speed minus speed 5 mins ago)
# A large negative value indicates sudden braking/rapid deceleration
df['sudden_speed_drop'] = (df['link_speed_harm'] - df['speed_lag_1']).clip(upper=0.0).abs()

# 5. Queue tail-end zone flag
# High congestion (low speed, high delay) directly preceded by free-flow speed
# (very risky transition area for rear-end collisions)
df['is_queue_tail'] = ((df['link_speed_harm'] < 40.0) & (df['speed_lag_3'] > 80.0)).astype(int)

# 6. Night high speed flag (fatigue + speeding risk)
df['is_night_speeding'] = ((df['is_weekend'] == 0) & (df['hour'] >= 22) & (df['link_speed_harm'] > 120.0)).astype(int)

# 7. Occupancy spike (sudden jump in occupancy rate)
df['occupancy_spike'] = (df['link_occup_max'] - df['link_occup_max'].shift(1).fillna(0)).clip(lower=0.0)

print("Traffic physics features created.")

# ─────────────────────────────────────────────
print("\n" + "="*65)
print("  PREPROCESSING: STEP 7 - ACCIDENT RISK SCORE (ARS) CALCULATION")
print("="*65)

# Normalize components to 0-1 scale for risk scoring
norm_speed_var = df['speed_variance_lanes'] / 50.0  # typical max std speed is 50
norm_speed_gap = df['speed_delta'] / 40.0           # typical max arithmetic-harmonic gap is 40
norm_speed_drop = df['sudden_speed_drop'] / 60.0    # typical max drop in 5 mins is 60 km/h
norm_occupancy = df['link_occup_max'] / 2.0         # occupancy rate max capped around 2.0

# Combine using weighted risk factors (derived from surrogate safety standard principles)
ars_score = (
    0.20 * norm_speed_var.clip(0, 1) +
    0.20 * norm_speed_gap.clip(0, 1) +
    0.20 * norm_speed_drop.clip(0, 1) +
    0.15 * norm_occupancy.clip(0, 1) +
    0.10 * df['is_queue_tail'] +
    0.10 * df['is_night_speeding'] +
    0.05 * df['lane_balance_index'].clip(0, 1)
) * 10.0  # scale to 0 - 10

df['accident_risk_score'] = ars_score.round(2)

print("Accident Risk Score (ARS) calculated.")
print(df['accident_risk_score'].describe())

# ─────────────────────────────────────────────
print("\n" + "="*65)
print("  PREPROCESSING: STEP 8 - CONGESTION TARGETS")
print("="*65)
# Define binary classification target for congestion:
# Congestion = True if max lane occupancy > 0.8 or max queue delay > 500 seconds
df['is_congested'] = ((df['link_occup_max'] > 0.8) | (df['link_delay_max'] > 500.0)).astype(int)
print(f"Congestion rate in dataset: {df['is_congested'].mean() * 100:.2f}% ({df['is_congested'].sum():,} congested intervals)")

# ─────────────────────────────────────────────
print("\n" + "="*65)
print("  PREPROCESSING: STEP 9 - SAVING PROCESSED DATA")
print("="*65)

processed_file = os.path.join(PROCESSED_DIR, "processed_data.parquet")
# We use Parquet for fast reading and smaller file size, keeping all original columns too
df.to_parquet(processed_file)
print(f"Processed dataset successfully saved to: {processed_file}")
print(f"Final Data Shape: {df.shape}")
print("Preprocessing phase complete.")
print("="*65)
