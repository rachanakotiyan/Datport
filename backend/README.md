# 🚦 Smart Traffic Intelligence Platform Backend

This is the FastAPI backend server for the **Urban Traffic Congestion Analytics Platform** (Team AntiGravity, Dataport Hackathon 2024). It serves predictions, analytical metrics, runs live What-If simulations, monitors road/lane safety scores, and runs the AI Traffic Assistant.

---

## ⚡ Quick Start

### 1. Install Dependencies
Make sure you install all core and testing packages in your python environment:
```bash
pip install -r backend/requirements.txt
# Install testing helpers
pip install httpx httpx2
```

### 2. Run the Backend Server
Start the Uvicorn server on port 8000:
```bash
python backend/run.py
```
After starting, the server automatically maps:
* **Swagger API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
* **API endpoints root:** `http://localhost:8000/api/*`

### 3. Run Automated Integration Tests
Execute the verification test suite to ensure all modules are fully operational:
```bash
python backend/test_backend.py
```

---

## ⚙️ Environment Configurations

You can set these environment variables before running:
* `PORT`: Set custom port (default: `8000`).
* `OPENROUTER_API_KEY`: OpenRouter API key to activate the live LLM traffic assistant (otherwise falls back to rule-based parser).
* `OPENROUTER_MODEL`: OpenRouter model name (default: `google/gemma-2-9b-it:free`).

---

## 🛰️ API Endpoints Summary

### 1. Performance & Model Metadata (`Metadata`)
* `GET /api/metrics`: Evaluation metrics (MAE, RMSE, R², etc.) vs baseline model.
* `GET /api/feature-importance`: Explainable AI (SHAP/Feature Importance weights) used by the LightGBM models.

### 2. Analytical Intelligence (`Analytics`)
* `GET /api/intelligence/city`: Current City Traffic Score & Network Health Index.
* `GET /api/intelligence/roads`: Road Health rankings (0-100), average speeds, bottleneck delays, and risk scores.
* `GET /api/intelligence/lanes?link_id={ID}`: Per-lane efficiency scores (0-100), vehicle counts, occupancies, and speeds. Detects fastest/slowest lanes.
* `GET /api/intelligence/alerts`: Live safety advisory warnings (links with ARS > 6).
* `GET /api/intelligence/anomalies`: Identifies outliers, sudden speed drops, or queue delays in the network.

### 3. Predictive Services (`ML Prediction`)
* `POST /api/predict/interactive`: Live inference querying the 4 LightGBM models with custom inputs (`link_id`, `day_of_week`, `hour`, `minute`). Returns predicted speed, delay, risk, congestion probability, and an AI confidence score.
* `GET /api/predict/horizons`: Simulates auto-regressive traffic forecasts for 5, 15, 30, and 60 minutes horizons ahead.

### 4. Interactive Simulation (`Simulation`)
* `POST /api/simulation/what-if`: Runs physics-based lane-closure or density-scaling simulations. Returns simulated vs baseline comparison and percentage impact.
* `GET /api/simulator/state`: Current background timeline status and playback speed configurations.
* `POST /api/simulator/control`: Play, pause, or rewind simulator timeline.

### 5. Cognitive AI Assistant (`Cognitive AI`)
* `POST /api/ai/chat`: Interacts with the AI Traffic Assistant query engine. Supports Gemini flash models and rule-based fallback.
* `GET /api/ai/summary`: Daily automated system traffic summary narrative.

---

## 🏆 Winning Differentiators for Judges

1. **True Backend Inference**: The platform doesn't just read static JSON files; it runs live predictions against the trained LightGBM classifiers and regressors.
2. **What-If Simulation Engine**: Allows city planners to model "What happens if Lane 1 is closed on Link 5?" or "What happens if traffic increases by 30%?". It redistributes vehicles mathematically and runs the ML model to see the bottleneck impact.
3. **Advanced Lane/Road Analytics**: Computes custom indices like **Road Health Score** (based on delay, occupancy, speed, and safety risk) and **Lane Efficiency Score** (measuring throughput vs congestion).
4. **Cognitive Copilot**: The AI Traffic Assistant provides answers using real-time system metrics, giving planners an intuitive, chat-based traffic interface.
