import pandas as pd
import numpy as np
from typing import List, Dict, Any
from app.predictor import predictor
from app.intelligence import calculate_road_health, get_current_data_slice

def run_whatif_simulation(
    link_id: int,
    traffic_multiplier: float,
    closed_lanes: List[int],
    capacity_improvement: float,
    current_time: pd.Timestamp = None
) -> Dict[str, Any]:
    """Runs a physical simulation model of traffic modifications on a road link."""
    # 1. Fetch baseline record
    df_slice = get_current_data_slice(current_time)
    link_rows = df_slice[df_slice['LINK_ID'] == link_id]
    
    if link_rows.empty:
        # Fallback to history
        full_df = predictor.df
        link_rows = full_df[full_df['LINK_ID'] == link_id].head(1)
        if link_rows.empty:
            raise ValueError(f"LINK_ID {link_id} not found in dataset.")

    row = link_rows.iloc[0]
    
    # Save baseline metrics
    base_speed = float(row['link_speed_harm'])
    base_delay = float(row['link_delay_max'])
    base_occupancy = float(row['link_occup_max'])
    base_risk = float(row['accident_risk_score'])
    base_congestion = bool(row['is_congested'])
    
    # Check number of active lanes
    vehs_cols = [f'VEHS(ALL)_{i}' for i in range(1, 7)]
    speed_cols = [f'SPEEDAVGHARM(ALL)_{i}' for i in range(1, 7)]
    occup_cols = [f'OCCUPRATE(ALL)_{i}' for i in range(1, 7)]
    
    active_lanes = [i for i in range(1, 7) if row[f'VEHS(ALL)_{i}'] > 0]
    num_active_lanes = len(active_lanes)
    
    # Initialize simulation overrides dictionary
    overrides = {}
    
    # 2. Simulate total lane closure if all active lanes are closed
    actual_closed = [L for L in closed_lanes if L in active_lanes]
    if len(actual_closed) >= num_active_lanes and num_active_lanes > 0:
        # Complete Gridlock / Road Closed
        simulated_speed = 0.0
        simulated_delay = 900.0  # Max delay
        simulated_occupancy = 2.0  # Complete bottleneck
        simulated_risk = 10.0  # Extreme risk
        simulated_congestion = True
    else:
        # 3. Simulate Lane redistribution and dynamic changes
        # Clone lane vehicle counts
        sim_vehs = [float(row[col]) for col in vehs_cols]
        sim_speeds = [float(row[col]) for col in speed_cols]
        sim_occups = [float(row[col]) for col in occup_cols]
        
        # Apply lane closures
        remaining_active = [L for L in active_lanes if L not in closed_lanes]
        num_remaining = len(remaining_active)
        
        if num_remaining > 0 and len(actual_closed) > 0:
            total_closed_vehs = sum(sim_vehs[L - 1] for L in actual_closed)
            # Redistribute closed lane traffic to remaining lanes equally
            added_vehs_per_lane = total_closed_vehs / num_remaining
            
            for i in range(1, 7):
                if i in closed_lanes:
                    sim_vehs[i - 1] = 0.0
                    sim_speeds[i - 1] = 0.0
                    sim_occups[i - 1] = 0.0
                elif i in remaining_active:
                    old_vehs = sim_vehs[i - 1]
                    new_vehs = old_vehs + added_vehs_per_lane
                    sim_vehs[i - 1] = new_vehs
                    # Scale occupancy rate based on new load
                    if old_vehs > 0:
                        sim_occups[i - 1] = sim_occups[i - 1] * (new_vehs / old_vehs)
                    else:
                        sim_occups[i - 1] = min(2.0, added_vehs_per_lane / 100.0) # estimate
                    # Decrease speed slightly as density increases (fundamental diagram physics)
                    sim_speeds[i - 1] = max(10.0, sim_speeds[i - 1] * 0.85)

        # Apply Traffic Multiplier (e.g. increase volume)
        if traffic_multiplier != 1.0:
            for idx in range(6):
                sim_vehs[idx] *= traffic_multiplier
                sim_occups[idx] *= traffic_multiplier
                # Speed decreases with higher traffic density
                if traffic_multiplier > 1.0:
                    sim_speeds[idx] = max(15.0, sim_speeds[idx] * (1.0 - (traffic_multiplier - 1.0) * 0.2))
                else:
                    sim_speeds[idx] = min(130.0, sim_speeds[idx] * (1.0 + (1.0 - traffic_multiplier) * 0.1))

        # Apply Capacity Improvements (e.g. ramp metering, better lane layouts)
        if capacity_improvement > 0.0:
            for idx in range(6):
                sim_occups[idx] *= (1.0 - capacity_improvement)
                sim_speeds[idx] = min(140.0, sim_speeds[idx] * (1.0 + capacity_improvement * 0.1))

        # Recalculate physical aggregated statistics
        sim_total_vehs = sum(sim_vehs)
        sim_max_occup = max(sim_occups) if sim_occups else 0.0
        
        # Calculate new lane balance index
        active_sim_vehs = [v for v in sim_vehs if v > 0]
        if active_sim_vehs:
            mean_vehs = np.mean(active_sim_vehs)
            std_vehs = np.std(active_sim_vehs)
            sim_balance_index = std_vehs / mean_vehs if mean_vehs > 0 else 0.0
        else:
            sim_balance_index = 0.0
            
        # Calculate new speed variance across active lanes
        active_sim_speeds = [s for s in sim_speeds if s > 0]
        sim_speed_var = np.std(active_sim_speeds) if active_sim_speeds else 0.0

        # Inject computed features into model override dictionary
        overrides['vehs_lag_1'] = sim_total_vehs
        overrides['speed_variance_lanes'] = sim_speed_var
        overrides['lane_balance_index'] = sim_balance_index
        overrides['link_occup_max'] = sim_max_occup
        
        # Approximate lags to simulate feedback loop
        overrides['speed_lag_1'] = np.mean(active_sim_speeds) if active_sim_speeds else base_speed
        
        # Calculate sudden speed drop if speed dropped
        speed_delta = base_speed - overrides['speed_lag_1']
        overrides['sudden_speed_drop'] = max(0.0, speed_delta)
        overrides['is_queue_tail'] = 1 if overrides['speed_lag_1'] < 40.0 and base_speed > 80.0 else 0

        # Run LightGBM models with simulation overrides!
        pred = predictor.predict_single(
            link_id=link_id,
            day_of_week=int(row['day_of_week']),
            hour=int(row['hour']),
            minute=int(row['minute']),
            overrides=overrides
        )
        
        simulated_speed = pred['predicted_speed']
        simulated_delay = pred['predicted_delay']
        simulated_occupancy = sim_max_occup
        simulated_risk = pred['predicted_risk']
        simulated_congestion = pred['is_congested']

    # Percent impact comparisons
    def get_pct_change(old, new):
        if old == 0:
            return 100.0 if new > 0 else 0.0
        return round(((new - old) / old) * 100.0, 2)

    impact = {
        "speed": get_pct_change(base_speed, simulated_speed),
        "delay": get_pct_change(base_delay, simulated_delay),
        "occupancy": get_pct_change(base_occupancy, simulated_occupancy),
        "accident_risk": get_pct_change(base_risk, simulated_risk)
    }

    return {
        "link_id": link_id,
        "baseline": {
            "speed": round(base_speed, 2),
            "delay": round(base_delay, 2),
            "occupancy": round(base_occupancy, 2),
            "accident_risk": round(base_risk, 2),
            "is_congested": base_congestion
        },
        "simulated": {
            "speed": round(simulated_speed, 2),
            "delay": round(simulated_delay, 2),
            "occupancy": round(simulated_occupancy, 2),
            "accident_risk": round(simulated_risk, 2),
            "is_congested": simulated_congestion
        },
        "impact": impact
    }
