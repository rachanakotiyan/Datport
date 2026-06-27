# 🚦 Smart Traffic Intelligence Platform — Team Walkthrough Guide

Welcome to the team guide for the **Urban Traffic Congestion Analytics Platform** (Team AntiGravity, Dataport Hackathon 2024). This document will guide the frontend and ML engineers on how to set up, re-train models, run the FastAPI backend on your laptops, and integrate the APIs with the frontend dashboard.

---

## 📂 Project Structure Overview

```
Datport/
├── dataset/                  # Contains raw CSV sensor data (~76MB)
├── model/                    # ML pipeline python scripts (exploration, training, exports)
│   ├── explore.py            # Quality analysis on raw CSV
│   ├── preprocess.py         # Feature engineering & anomaly cleanup
│   ├── train.py              # LightGBM models training script
│   └── export.py             # Model exports to dashboard assets
├── backend/                  # Stands as a fully self-contained operational backend
│   ├── app/                  # FastAPI main router, simulator, predictor, & scoring code
│   ├── data/                 # Local copy of preprocessed parquet data
│   ├── models/               # Local copy of trained LightGBM pickle models
│   ├── .env                  # Configuration variables (API keys, ports)
│   ├── .gitignore            # Clean git targets for backend secrets/binaries
│   ├── requirements.txt      # Python dependencies
│   ├── run.py                # Server bootstrap script
│   └── test_backend.py       # Automated integration test runner
└── walkthrough.md            # This file
```

---

## ⚡ Step 1: Python Environment Setup

1. Open your terminal in the workspace root directory `Datport/`.
2. Ensure you have **Python 3.10+** installed.
3. Install the required libraries into your Python environment:
   ```bash
   pip install -r backend/requirements.txt
   # Install testing dependencies
   pip install httpx httpx2
   ```

---

## ⚙️ Step 2: Configure Environment Variables

Create or open the **`backend/.env`** file. Set up your OpenRouter details:
```env
PORT=8000
# Add your OpenRouter API key here
OPENROUTER_API_KEY=your_openrouter_api_key_here
# The default free model that will be queried (highly stable)
OPENROUTER_MODEL=google/gemma-4-31b-it:free
```
*Note: If no API key is specified, the assistant will automatically fall back to a local, deterministic keyword-based rule parser without throwing any connection errors.*

---

## 🚀 Step 3: Run the FastAPI Backend Server

Boot up the Uvicorn web server locally:
```bash
python backend/run.py
```
Upon successful startup, the server will output logs confirming:
* **Interactive Swagger UI (API Docs):** [http://localhost:8000/docs](http://localhost:8000/docs) (Open this in your browser to test endpoints live!)
* **API Endpoints Root:** `http://localhost:8000/api/*`

---

## 🧪 Step 4: Run Verification Tests

Open a separate terminal session and run the test script:
```bash
python backend/test_backend.py
```
This runs **12 automated integration tests** validating predictions, What-If simulation calculations, Road/Lane intelligence scoring, and AI chatbot connectivity.

---

## 🧠 Step 5: How to Re-train the ML Models (Optional)

If the dataset updates or you want to update the training algorithms, you can re-run the ML pipeline:

1. **Verify Raw Data**: Ensure the raw file `dataset/Pangyo_14days_lanes_w_arith_adj.csv` is present.
2. **Install ML dependencies**: Ensure you have `lightgbm` and `scikit-learn` installed.
3. **Preprocess Dataset**:
   ```bash
   python model/preprocess.py
   ```
   *Cleans speeds, aggregates 6 lanes, engineers cyclical/lag features, computes Accident Risk Scores, and outputs processed data directly to `backend/data/processed_data.parquet`.*
4. **Train Models**:
   ```bash
   python model/train.py
   ```
   *Splits data, trains 4 LightGBM models (Speed, Delay, Congestion, Risk), compares them against baseline regressions, and outputs metrics, SHAP feature importance, and `.pkl` binaries directly to `backend/models/`.*

---

## 🎨 Step 6: Frontend Integration Guide

The frontend team (using Next.js/React/shadcn) should query the following endpoints instead of relying on static mock data:

### 1. Core Analytics Dashboard
* **City Metrics:** `GET /api/intelligence/city`
  * Returns the general City Traffic Score, Health Index, and count of active warnings.
* **Road Health List:** `GET /api/intelligence/roads`
  * Returns list of all 65 road segments with their Road Health Scores (0-100), average speeds, queue delays, and accident risk values. Useful for heatmaps and rankings.
* **Lane Efficiency breakdown:** `GET /api/intelligence/lanes?link_id={ID}`
  * Returns lane efficiency ratings, vehicle counts, and occupancy percentages for lanes 1-6. Highlights the fastest and slowest lanes.

### 2. Interactive Prediction Widget
* **Interactive Predictions:** `POST /api/predict/interactive`
  * Send payload: `{"link_id": 5, "day_of_week": 1, "hour": 8, "minute": 30}`
  * Returns: Predicted speed, queue delay, congestion probability, risk score, and model confidence score.
* **Multi-Horizon Forecast:** `GET /api/predict/horizons?link_id={ID}&day_of_week={1-7}&hour={0-23}&minute={0-55}`
  * Returns forecasts for 5, 15, 30, and 60 minutes into the future to draw timeline prediction charts.

### 3. What-If Simulation Engine
* **Simulate Scenarios:** `POST /api/simulation/what-if`
  * Send payload: `{"link_id": 5, "traffic_multiplier": 1.3, "closed_lanes": [1, 2], "capacity_improvement": 0.1}`
  * Returns: Comparison dictionary mapping baseline vs simulated values (speed, delay, risk, occupancy) and the percentage impact.

### 4. AI Traffic Assistant
* **Assistant Chat:** `POST /api/ai/chat`
  * Send payload: `{"query": "Which road has the highest risk score right now?", "history": []}`
  * Returns: Live AI-generated markdown response compiling information and recommendations.
