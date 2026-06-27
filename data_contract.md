# Data Contract: Traffic Congestion Dashboard Data Adapter

This document defines the interface and schema mapping between the ML backend outputs and the frontend dashboard. 

To ensure complete decoupling between UI components and raw data structures (which may change), all visualizations must retrieve data exclusively through these adapter functions.

---

## 📡 Exposed Functions & Schemas

All functions are asynchronous to accommodate future migrations from raw local CSV parsing to REST API/JSON payloads.

### 1. `getHotspots(date, timeWindow)`
Retrieve a ranked list of road segments (links) sorted by their congestion level.

*   **Arguments:**
    *   `date` (string): Date in `YYYY-MM-DD` format (e.g., `"2024-07-08"`).
    *   `timeWindow` (optional object):
        *   `startHour` (number): Integer from `0` to `23`.
        *   `endHour` (number): Integer from `0` to `23`.
*   **Returns:** `Promise<HotspotData[]>`
*   **Schema (`HotspotData`):**
    ```typescript
    interface HotspotData {
      linkId: number;            // Unique road segment ID (1 - 66)
      congestionScore: number;   // Calculated congestion rating (0.0 to 10.0)
      avgSpeed: number;          // Average speed in km/h across active lanes
      avgDelay: number;          // Average queue delay in seconds
      avgOccupancy: number;      // Average occupancy rate (0.0 to 1.0+)
      volume: number;            // Total vehicle count observed in the period
    }
    ```

---

### 2. `getLinkTimeSeries(linkId, date)`
Retrieve 5-minute interval metrics for a specific road segment on a given day.

*   **Arguments:**
    *   `linkId` (number): Road link identifier (1 - 66).
    *   `date` (string): Date in `YYYY-MM-DD` format (e.g., `"2024-07-08"`).
*   **Returns:** `Promise<TimeSeriesData[]>`
*   **Schema (`TimeSeriesData`):**
    ```typescript
    interface TimeSeriesData {
      time: string;              // Time string in HH:MM format (e.g., "08:35")
      timestamp: string;         // ISO-like datetime representation (e.g., "2024-07-08 08:35")
      congestionScore: number;   // Calculated congestion rating (0.0 to 10.0)
      speed: number;             // Average speed in km/h across active lanes
      delay: number;             // Average queue delay in seconds
      occupancy: number;         // Average occupancy rate
      volume: number;            // Total vehicle count observed in this 5-minute window
    }
    ```

---

### 3. `getPredictedPeaks(linkId)`
Retrieve machine learning model predictions for expected daily peak windows.

*   **Arguments:**
    *   `linkId` (number): Road link identifier (1 - 66).
*   **Returns:** `Promise<PeakPrediction[]>`
*   **Schema (`PeakPrediction`):**
    ```typescript
    interface PeakPrediction {
      timeWindow: string;               // Time window description (e.g., "08:00 - 09:30")
      confidence: number;               // Model confidence level (0.0 to 1.0)
      predictedCongestionScore: number; // Forecasted peak score (0.0 to 10.0)
      reason: string;                   // Text justification/risk factor (e.g., "Weekday morning commute")
    }
    ```

---

## 🏗️ Metric Derivation (Temporary Placeholder Formula)

Until final ML outputs are integrated, the adapter computes metrics from the raw lane sensor columns using this placeholder logic:

1.  **Lanes Inspected:** Lanes 1 through 6. A lane $N$ is considered active if it has non-zero vehicle counts or non-zero occupancy rates in the corresponding row.
2.  **Aggregation:**
    *   $\text{avg\_occ} = \text{mean of } \text{OCCUPRATE(ALL)\_N}$ for active lanes.
    *   $\text{avg\_delay} = \text{mean of } \text{QUEUEDELAY(ALL)\_N}$ for active lanes.
    *   $\text{avg\_speed} = \text{mean of } \text{SPEEDAVGHARM(ALL)\_N}$ for active lanes.
3.  **Congestion Score:**
    $$\text{congestionScore} = \min\left(10, \frac{\text{avg\_delay} \times \text{avg\_occ}}{\text{avg\_speed} + 5} \times 1.5\right)$$
