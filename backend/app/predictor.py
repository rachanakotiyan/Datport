import os
import joblib
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, Any, Tuple, List
from app.config import DATA_PATH, MODEL_DIR

class TrafficPredictor:
    def __init__(self):
        self.models_loaded = False
        self.df = None
        self.cong_model = None
        self.speed_model = None
        self.delay_model = None
        self.risk_model = None
        
        # Features required by the models
        self.feature_names = [
            'LINK_ID', 'day_of_week', 'is_weekend', 'hour', 'minute',
            'is_peak_am', 'is_peak_pm', 'hour_sin', 'hour_cos',
            'speed_lag_1', 'delay_lag_1', 'vehs_lag_1',
            'speed_lag_3', 'delay_lag_3', 'speed_lag_12',
            'vehs_roll_mean_12', 'speed_roll_mean_12',
            'speed_delta', 'speed_variance_lanes', 'lane_balance_index',
            'sudden_speed_drop', 'is_queue_tail', 'is_night_speeding',
            'occupancy_spike'
        ]

    def load_resources(self):
        """Loads trained LightGBM models and parquet dataset into memory."""
        try:
            print("Predictor: Loading LightGBM models...")
            self.cong_model = joblib.load(MODEL_DIR / "lgbm_congestion.pkl")
            self.speed_model = joblib.load(MODEL_DIR / "lgbm_speed.pkl")
            self.delay_model = joblib.load(MODEL_DIR / "lgbm_delay.pkl")
            self.risk_model = joblib.load(MODEL_DIR / "lgbm_risk.pkl")
            
            print(f"Predictor: Loading processed Parquet data from {DATA_PATH}...")
            self.df = pd.read_parquet(DATA_PATH)
            # Ensure sort order for lookups
            self.df = self.df.sort_values(['LINK_ID', 'datetime']).reset_index(drop=True)
            self.models_loaded = True
            print("Predictor: Resources loaded successfully.")
        except Exception as e:
            print(f"Predictor Error during resource loading: {e}")
            raise e

    def get_historical_reference(self, link_id: int, day_of_week: int, hour: int, minute: int) -> pd.Series:
        """Locates the closest matching historical record to extract lag and physical features."""
        # Try to match LINK_ID, day_of_week, hour, minute
        mask = (
            (self.df['LINK_ID'] == link_id) & 
            (self.df['day_of_week'] == day_of_week) & 
            (self.df['hour'] == hour) & 
            (self.df['minute'] == minute)
        )
        matches = self.df[mask]
        
        if len(matches) > 0:
            # Return the latest historical match
            return matches.iloc[-1]
        
        # Fallback 1: Match LINK_ID, hour, minute (average across days)
        mask_fallback = (self.df['LINK_ID'] == link_id) & (self.df['hour'] == hour) & (self.df['minute'] == minute)
        matches_fallback = self.df[mask_fallback]
        if len(matches_fallback) > 0:
            return matches_fallback.iloc[-1]
            
        # Fallback 2: Match LINK_ID (average across all times)
        mask_fallback_2 = (self.df['LINK_ID'] == link_id)
        matches_fallback_2 = self.df[mask_fallback_2]
        if len(matches_fallback_2) > 0:
            return matches_fallback_2.iloc[-1]
            
        # Fallback 3: Return first row of dataset as safety
        return self.df.iloc[0]

    def build_feature_vector(self, link_id: int, day_of_week: int, hour: int, minute: int, overrides: Dict[str, Any] = None) -> pd.DataFrame:
        """Constructs a 24-feature single-row DataFrame for model input."""
        ref_row = self.get_historical_reference(link_id, day_of_week, hour, minute)
        
        # Build features base from historical row
        feat_dict = {}
        for feat in self.feature_names:
            if feat in ref_row:
                feat_dict[feat] = ref_row[feat]
            else:
                feat_dict[feat] = 0.0

        # Update input features
        feat_dict['LINK_ID'] = link_id
        feat_dict['day_of_week'] = day_of_week
        feat_dict['hour'] = hour
        feat_dict['minute'] = minute
        feat_dict['is_weekend'] = 1 if day_of_week >= 6 else 0
        feat_dict['is_peak_am'] = 1 if hour in [7, 8, 9] else 0
        feat_dict['is_peak_pm'] = 1 if hour in [17, 18, 19] else 0
        feat_dict['hour_sin'] = np.sin(2 * np.pi * hour / 24.0)
        feat_dict['hour_cos'] = np.cos(2 * np.pi * hour / 24.0)

        # Apply custom overrides (used for What-If simulations)
        if overrides:
            for k, v in overrides.items():
                if k in self.feature_names:
                    feat_dict[k] = v

        return pd.DataFrame([feat_dict])[self.feature_names]

    def predict_single(self, link_id: int, day_of_week: int, hour: int, minute: int, overrides: Dict[str, Any] = None) -> Dict[str, Any]:
        """Runs the four LightGBM models on the constructed feature vector."""
        if not self.models_loaded:
            self.load_resources()

        X = self.build_feature_vector(link_id, day_of_week, hour, minute, overrides)

        # Predictions
        speed = float(self.speed_model.predict(X)[0])
        delay = float(self.delay_model.predict(X)[0])
        risk = float(self.risk_model.predict(X)[0])
        
        prob = float(self.cong_model.predict_proba(X)[0][1])
        congestion_flag = bool(self.cong_model.predict(X)[0])

        # Floor results at 0 for logical consistency
        speed = max(0.0, speed)
        delay = max(0.0, delay)
        risk = max(0.0, min(10.0, risk))

        # Calculate prediction confidence score
        # Confidence is higher when probability is closer to bounds (0 or 1) and lower when near 0.5.
        entropy_factor = 1.0 - (prob * (1.0 - prob) * 4.0)
        # Combine with typical speed variance of the target link
        confidence = round(40.0 + (60.0 * entropy_factor), 2)

        return {
            "link_id": link_id,
            "predicted_speed": round(speed, 2),
            "predicted_delay": round(delay, 2),
            "predicted_congestion_prob": round(prob, 4),
            "predicted_risk": round(risk, 2),
            "is_congested": congestion_flag,
            "confidence_score": confidence
        }

    def predict_multi_horizon(self, link_id: int, day_of_week: int, hour: int, minute: int) -> List[Dict[str, Any]]:
        """Simulates auto-regressive predictions for 5, 15, 30, and 60 minutes ahead."""
        if not self.models_loaded:
            self.load_resources()

        forecasts = []
        current_hour = hour
        current_minute = minute
        current_day = day_of_week
        
        # Fetch initial base state
        ref_row = self.get_historical_reference(link_id, day_of_week, hour, minute)
        
        # We simulate lag states: 1-step lag (5m), 3-step lag (15m), 12-step lag (60m)
        last_speed = float(ref_row['link_speed_harm'])
        last_delay = float(ref_row['link_delay_max'])
        last_vehs = float(ref_row['link_vehs'])

        # Predefine simulation time steps
        horizons = [5, 15, 30, 60]
        
        for horizon in horizons:
            # Advance simulation clock (5m intervals)
            # For simplicity, we directly compute features at each target horizon
            # by fetching the historical context at the offset and injecting our previous step predictions as the new lags.
            offset_minute = current_minute + horizon
            offset_hour = current_hour + (offset_minute // 60)
            offset_minute = offset_minute % 60
            offset_day = current_day
            if offset_hour >= 24:
                offset_day = (offset_day + (offset_hour // 24) - 1) % 7 + 1
                offset_hour = offset_hour % 24

            # Overrides to feed predictions of t=0 as lag features for future horizons
            overrides = {
                "speed_lag_1": last_speed,
                "delay_lag_1": last_delay,
                "vehs_lag_1": last_vehs
            }
            
            # Predict
            pred = self.predict_single(link_id, offset_day, offset_hour, offset_minute, overrides)
            
            # Update variables for next step sequence
            last_speed = pred['predicted_speed']
            last_delay = pred['predicted_delay']
            
            forecasts.append({
                "horizon_minutes": horizon,
                "predicted_speed": pred['predicted_speed'],
                "predicted_delay": pred['predicted_delay'],
                "predicted_risk": pred['predicted_risk'],
                "predicted_congestion_prob": pred['predicted_congestion_prob'],
                "is_congested": pred['is_congested']
            })

        return forecasts

# Singleton instance
predictor = TrafficPredictor()
