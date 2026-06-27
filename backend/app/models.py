from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

# Interactive Prediction Schema
class PredictionRequest(BaseModel):
    link_id: int = Field(..., description="Road segment LINK_ID (1 to 65)", ge=1, le=65)
    day_of_week: int = Field(..., description="Day of the week (1=Monday ... 7=Sunday)", ge=1, le=7)
    hour: int = Field(..., description="Hour of the day (0 to 23)", ge=0, le=23)
    minute: int = Field(..., description="Minute interval (0 to 55)", ge=0, le=55)

class PredictionResponse(BaseModel):
    link_id: int
    predicted_speed: float = Field(..., description="Predicted average harmonic speed in km/h")
    predicted_delay: float = Field(..., description="Predicted queue delay in seconds")
    predicted_congestion_prob: float = Field(..., description="Congestion probability (0.0 to 1.0)")
    predicted_risk: float = Field(..., description="Predicted accident risk score (0.0 to 10.0)")
    is_congested: bool = Field(..., description="Is the link predicted to be congested")
    confidence_score: float = Field(..., description="AI confidence score for the prediction (0.0 to 100.0)")

# Multi-Horizon Forecast Schemas
class ForecastHorizonItem(BaseModel):
    horizon_minutes: int
    predicted_speed: float
    predicted_delay: float
    predicted_risk: float
    predicted_congestion_prob: float
    is_congested: bool

class PredictiveHorizonsResponse(BaseModel):
    link_id: int
    current_time: str
    forecasts: List[ForecastHorizonItem]
    confidence_score: float

# What-If Simulation Schema
class WhatIfRequest(BaseModel):
    link_id: int = Field(..., ge=1, le=65)
    traffic_multiplier: float = Field(1.0, description="Scale overall vehicle traffic volume (e.g. 1.2 = +20%)", ge=0.0, le=5.0)
    closed_lanes: List[int] = Field(default_factory=list, description="Lanes to close, 1-indexed (e.g. [1, 2])")
    capacity_improvement: float = Field(0.0, description="Road capacity expansion percentage (e.g. 0.1 = +10%)", ge=0.0, le=1.0)

class WhatIfMetricDetail(BaseModel):
    speed: float
    delay: float
    occupancy: float
    accident_risk: float
    is_congested: bool

class WhatIfResponse(BaseModel):
    link_id: int
    baseline: WhatIfMetricDetail
    simulated: WhatIfMetricDetail
    impact: Dict[str, float] = Field(..., description="Percentage change in metrics")

# Safety Alert Schema
class SafetyAlert(BaseModel):
    timestamp: str
    link_id: int
    accident_risk_score: float
    severity: str  # Low, Moderate, High, Critical
    triggers: List[str]
    recommendations: List[str]

# Road Analytics & Rankings
class RoadIntelligenceItem(BaseModel):
    link_id: int
    road_health_score: float
    avg_speed: float
    avg_delay: float
    avg_occupancy: float
    congestion_rate: float
    peak_hour: int
    accident_risk: float

class CityIntelligenceResponse(BaseModel):
    city_traffic_score: float
    traffic_health_index: float
    active_congested_links: int
    total_active_alerts: int
    worst_road: int
    most_improved_road: int

# Lane Analytics Schemas
class LaneIntelligenceItem(BaseModel):
    lane_number: int
    lane_efficiency_score: float
    avg_speed: float
    avg_delay: float
    avg_occupancy: float
    avg_vehicles: float

class LinkLaneIntelligenceResponse(BaseModel):
    link_id: int
    lanes: List[LaneIntelligenceItem]
    fastest_lane: int
    slowest_lane: int
    highest_occupancy_lane: int
    highest_delay_lane: int

# AI Chat schemas
class AIChatRequest(BaseModel):
    query: str
    history: Optional[List[Dict[str, str]]] = None

class AIChatResponse(BaseModel):
    response: str
    data_references: Optional[Dict[str, Any]] = None
