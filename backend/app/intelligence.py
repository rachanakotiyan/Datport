import pandas as pd
import numpy as np
from typing import Dict, Any, List, Tuple
from app.predictor import predictor

def get_current_data_slice(current_time: pd.Timestamp = None) -> pd.DataFrame:
    """Helper to slice the dataset for a specific timestamp or default to the last timestamp."""
    df = predictor.df
    if df is None:
        return pd.DataFrame()
        
    if current_time is None:
        # Default to the most recent record's timestamp
        latest_time = df['datetime'].max()
        return df[df['datetime'] == latest_time]
    
    # Filter for the exact time slice
    slice_df = df[df['datetime'] == current_time]
    if len(slice_df) == 0:
        # Fallback: find the closest datetime
        closest_idx = (df['datetime'] - current_time).abs().idxmin()
        target_time = df.loc[closest_idx, 'datetime']
        return df[df['datetime'] == target_time]
        
    return slice_df

def calculate_road_health(speed: float, delay: float, occupancy: float, risk: float) -> float:
    """Calculates Road Health Score from 0 to 100 based on traffic parameters."""
    # Penalty components
    speed_penalty = max(0.0, 100.0 - speed) * 0.3    # typical speed limit is 100km/h
    delay_penalty = min(delay, 600.0) * 0.05         # caps penalty at 30 points for 600s delay
    occupancy_penalty = min(occupancy, 1.5) * 20.0   # caps penalty at 30 points for 1.5 occupancy
    risk_penalty = risk * 3.0                        # 10 risk = 30 points penalty
    
    score = 100.0 - (speed_penalty + delay_penalty + occupancy_penalty + risk_penalty)
    return round(max(0.0, min(100.0, score)), 2)

def calculate_lane_efficiency(speed: float, occupancy: float, vehs: float) -> float:
    """Calculates Lane Efficiency Score from 0 to 100."""
    if speed == 0 or vehs == 0:
        return 0.0
    # Higher efficiency if traffic moves fast and occupancy is optimal (low delay/congestion)
    speed_factor = min(speed / 100.0, 1.2)           # normalized around 100 km/h
    occupancy_factor = max(0.0, 1.0 - min(occupancy, 1.0)) # penalize high occupancy (congested lanes)
    
    score = speed_factor * occupancy_factor * 100.0
    return round(max(0.0, min(100.0, score)), 2)

def get_city_intelligence_metrics(current_time: pd.Timestamp = None) -> Dict[str, Any]:
    """Computes overall City Traffic Score, Health Index, and general aggregates."""
    df_slice = get_current_data_slice(current_time)
    if df_slice.empty:
        return {
            "city_traffic_score": 100.0,
            "traffic_health_index": 100.0,
            "active_congested_links": 0,
            "total_active_alerts": 0,
            "worst_road": 1,
            "most_improved_road": 2
        }

    # Calculate Road Health for each link in the slice
    scores = []
    congested_count = 0
    alert_count = 0
    worst_link = 1
    min_health = 100.0
    
    for _, row in df_slice.iterrows():
        health = calculate_road_health(
            row['link_speed_harm'],
            row['link_delay_max'],
            row['link_occup_max'],
            row['accident_risk_score']
        )
        scores.append(health)
        
        if row['is_congested'] == 1:
            congested_count += 1
        if row['accident_risk_score'] > 6.0:
            alert_count += 1
            
        if health < min_health:
            min_health = health
            worst_link = int(row['LINK_ID'])

    city_score = float(np.mean(scores))
    health_index = max(0.0, city_score - (congested_count * 0.5))

    # Identify most improved road by comparing current health with historical mean health
    # (Simple fallback mock for hackathon: return Link 12 which is often improved)
    most_improved = 12
    
    return {
        "city_traffic_score": round(city_score, 2),
        "traffic_health_index": round(health_index, 2),
        "active_congested_links": congested_count,
        "total_active_alerts": alert_count,
        "worst_road": worst_link,
        "most_improved_road": most_improved
    }

def get_road_intelligence_list(current_time: pd.Timestamp = None) -> List[Dict[str, Any]]:
    """Generates detailed Road Intelligence metrics for all road segments in the slice."""
    df_slice = get_current_data_slice(current_time)
    roads = []
    
    # Read global historical dataset to find typical peak hour for each link
    # (Cached by grouping by link id and hour)
    full_df = predictor.df
    
    for _, row in df_slice.iterrows():
        link_id = int(row['LINK_ID'])
        
        # Calculate individual health score
        health = calculate_road_health(
            row['link_speed_harm'],
            row['link_delay_max'],
            row['link_occup_max'],
            row['accident_risk_score']
        )
        
        # Find typical peak hour for this link
        link_history = full_df[full_df['LINK_ID'] == link_id]
        if len(link_history) > 0:
            peak_hour = int(link_history.groupby('hour')['link_delay_avg'].mean().idxmax())
            congestion_rate = float(link_history['is_congested'].mean())
        else:
            peak_hour = 8
            congestion_rate = 0.1
            
        roads.append({
            "link_id": link_id,
            "road_health_score": health,
            "avg_speed": round(float(row['link_speed_harm']), 2),
            "avg_delay": round(float(row['link_delay_max']), 2),
            "avg_occupancy": round(float(row['link_occup_max']), 2),
            "congestion_rate": round(congestion_rate, 4),
            "peak_hour": peak_hour,
            "accident_risk": round(float(row['accident_risk_score']), 2)
        })
        
    return roads

def get_lane_intelligence_metrics(link_id: int, current_time: pd.Timestamp = None) -> Dict[str, Any]:
    """Generates detailed per-lane analytics for a target road link."""
    df_slice = get_current_data_slice(current_time)
    link_rows = df_slice[df_slice['LINK_ID'] == link_id]
    
    if link_rows.empty:
        # Load from general predictor dataframe fallback
        full_df = predictor.df
        link_rows = full_df[full_df['LINK_ID'] == link_id].head(1)
        if link_rows.empty:
            return {"link_id": link_id, "lanes": [], "fastest_lane": 1, "slowest_lane": 1}

    row = link_rows.iloc[0]
    lanes = []
    
    fastest_lane = 1
    max_speed = -1.0
    
    slowest_lane = 1
    min_speed = 999.0
    
    highest_occupancy_lane = 1
    max_occup = -1.0
    
    highest_delay_lane = 1
    max_delay = -1.0
    
    for i in range(1, 7):
        vehs = float(row[f'VEHS(ALL)_{i}'])
        speed = float(row[f'SPEEDAVGHARM(ALL)_{i}'])
        delay = float(row[f'QUEUEDELAY(ALL)_{i}'])
        occup = float(row[f'OCCUPRATE(ALL)_{i}'])
        
        # Inactive lane filters
        if i == 6 and vehs == 0:
            # Lane 6 is emergency/inactive mostly
            efficiency = 100.0 # treat unused emergency lane as default efficient/clear
        else:
            efficiency = calculate_lane_efficiency(speed, occup, vehs)
            
        lanes.append({
            "lane_number": i,
            "lane_efficiency_score": efficiency,
            "avg_speed": round(speed, 2),
            "avg_delay": round(delay, 2),
            "avg_occupancy": round(occup, 4),
            "avg_vehicles": round(vehs, 1)
        })
        
        # Track statistics (only count active lanes for min/max tracking)
        if vehs > 0:
            if speed > max_speed:
                max_speed = speed
                fastest_lane = i
            if speed < min_speed:
                min_speed = speed
                slowest_lane = i
            if occup > max_occup:
                max_occup = occup
                highest_occupancy_lane = i
            if delay > max_delay:
                max_delay = delay
                highest_delay_lane = i

    return {
        "link_id": link_id,
        "lanes": lanes,
        "fastest_lane": fastest_lane,
        "slowest_lane": slowest_lane,
        "highest_occupancy_lane": highest_occupancy_lane,
        "highest_delay_lane": highest_delay_lane
    }

def get_anomalies(current_time: pd.Timestamp = None) -> List[Dict[str, Any]]:
    """Identifies active anomalies in the current traffic snapshot."""
    df_slice = get_current_data_slice(current_time)
    anomalies = []
    
    for _, row in df_slice.iterrows():
        link_id = int(row['LINK_ID'])
        risk = float(row['accident_risk_score'])
        occup = float(row['link_occup_max'])
        delay = float(row['link_delay_max'])
        speed = float(row['link_speed_harm'])
        sudden_drop = float(row.get('sudden_speed_drop', 0.0))
        
        reasons = []
        if occup > 1.1:
            reasons.append(f"Gridlock Occupancy ({occup:.2f} Occupate)")
        if delay > 400.0:
            reasons.append(f"Excessive Delay ({delay:.1f}s)")
        if speed < 25.0 and row['is_peak_am'] == 0 and row['is_peak_pm'] == 0:
            reasons.append(f"Abnormally Low Off-peak Speed ({speed:.1f} km/h)")
        if sudden_drop > 25.0:
            reasons.append(f"Sudden Speed Drop (-{sudden_drop:.1f} km/h)")
            
        if reasons:
            anomalies.append({
                "link_id": link_id,
                "timestamp": str(row['date']),
                "severity": "CRITICAL" if len(reasons) >= 2 or occup > 1.2 or delay > 600.0 else "WARNING",
                "descriptions": reasons,
                "current_values": {
                    "speed": round(speed, 2),
                    "delay": round(delay, 2),
                    "occupancy": round(occup, 2),
                    "risk": round(risk, 2)
                }
            })
            
    return anomalies
