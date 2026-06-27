import threading
import time
import pandas as pd
from typing import Dict, Any, List
from app.predictor import predictor

class TrafficSimulator:
    def __init__(self):
        self.is_running = False
        self.speed_multiplier = 2.5  # 1 step (5 mins) takes 2 seconds in real life
        
        # Test timeline ranges from July 11 to July 14, 2024
        self.start_time = pd.to_datetime("2024-07-11 00:00:00")
        self.end_time = pd.to_datetime("2024-07-14 23:55:00")
        self.current_sim_time = self.start_time
        
        self._thread = None
        self._lock = threading.Lock()
        
    def start(self):
        """Starts the background simulation loop."""
        with self._lock:
            if not self.is_running:
                self.is_running = True
                self._thread = threading.Thread(target=self._run_loop, daemon=True)
                self._thread.start()
                print("Simulator: Background simulation thread started.")

    def stop(self):
        """Stops the background simulation loop."""
        with self._lock:
            self.is_running = False
            print("Simulator: Background simulation thread stopped.")

    def _run_loop(self):
        """Internal background loop running ticks."""
        while True:
            # Check running state safely
            with self._lock:
                running = self.is_running
                speed = self.speed_multiplier
            
            if not running:
                time.sleep(0.5)
                continue
                
            # Sleep duration representing 5 minutes step
            # e.g., if speed is 2.5, we sleep 2.0 seconds
            sleep_duration = 5.0 / speed
            time.sleep(sleep_duration)
            
            with self._lock:
                # Advance simulated time by 5 minutes
                self.current_sim_time += pd.Timedelta(minutes=5)
                
                # Wrap timeline around if limit reached
                if self.current_sim_time > self.end_time:
                    self.current_sim_time = self.start_time
                    print("Simulator: Timeline reached end. Wrapping around to start.")

    def get_state(self) -> Dict[str, Any]:
        """Returns the current state status of the simulation."""
        with self._lock:
            return {
                "current_time": str(self.current_sim_time),
                "is_running": self.is_running,
                "speed_multiplier": self.speed_multiplier,
                "progress_percentage": round(
                    ((self.current_sim_time - self.start_time) / (self.end_time - self.start_time)) * 100.0,
                    2
                )
            }

    def set_control(self, action: str, speed: float = None):
        """Handles play, pause, set speed, and rewind commands."""
        with self._lock:
            if action == "play":
                self.is_running = True
            elif action == "pause":
                self.is_running = False
            elif action == "rewind":
                self.current_sim_time = self.start_time
            
            if speed is not None:
                self.speed_multiplier = max(0.1, min(10.0, speed))

    def get_active_alerts(self) -> List[Dict[str, Any]]:
        """Scans the current simulation time step for warning triggers."""
        # Query matching records for current sim time
        with self._lock:
            sim_time = self.current_sim_time
            
        df = predictor.df
        if df is None:
            return []
            
        # Get slice
        slice_df = df[df['datetime'] == sim_time]
        if slice_df.empty:
            # Closest fallback
            closest_idx = (df['datetime'] - sim_time).abs().idxmin()
            slice_df = df[df['datetime'] == df.loc[closest_idx, 'datetime']]

        alerts = []
        for _, row in slice_df.iterrows():
            link_id = int(row['LINK_ID'])
            risk = float(row['accident_risk_score'])
            occup = float(row['link_occup_max'])
            delay = float(row['link_delay_max'])
            speed = float(row['link_speed_harm'])
            
            # Formulate severity level
            if risk >= 8.0 or occup > 1.1 or delay > 450:
                severity = "CRITICAL"
            elif risk >= 6.0 or occup > 0.8 or delay > 250:
                severity = "HIGH"
            elif risk >= 4.0 or occup > 0.6:
                severity = "MODERATE"
            else:
                continue # Low risk/Normal state link, skip alert creation
                
            triggers = []
            recs = []
            
            # Evaluate Triggers & recommendations
            if risk >= 6.0:
                triggers.append(f"High Accident Risk Score ({risk:.2f})")
                recs.append("Reduce approaching speed limits to 60 km/h dynamically")
                recs.append("Push early hazard notifications to driver navigation systems")
                
            if occup > 0.8:
                triggers.append(f"High Lane Occupancy ({occup:.2f})")
                recs.append("Enable dynamic hard shoulder running / lane control adjustments")
                
            if delay > 250:
                triggers.append(f"Queue bottleneck delay ({delay:.1f}s)")
                recs.append(f"Increase green-light phase duration on LINK {link_id} by 15s")
                
            if speed < 35.0:
                triggers.append(f"Traffic Slowdown ({speed:.1f} km/h)")
                
            if not triggers:
                triggers.append("General slow congestion")
                recs.append("Monitor traffic flow trends")

            alerts.append({
                "timestamp": str(row['date']),
                "link_id": link_id,
                "accident_risk_score": round(risk, 2),
                "severity": severity,
                "triggers": triggers,
                "recommendations": list(set(recs))  # unique recommendations
            })
            
        # Sort critical first, then high risk descending
        alerts.sort(key=lambda x: (x['severity'] == 'CRITICAL', x['accident_risk_score']), reverse=True)
        return alerts

# Singleton instance
simulator = TrafficSimulator()
