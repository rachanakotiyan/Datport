# 🚦 Urban Traffic Congestion Analytics
### Team AntiGravity | Dataport Hackathon 2024
**Location:** Pangyo Techno Valley, South Korea  
**Dataset:** 14 days of lane-level traffic sensor data (July 1–14, 2024)  
**Goal:** Identify congestion hotspots, predict peak traffic, assess accident risk zones, and recommend optimization strategies for city planners.

---

## 📑 Table of Contents
1. [Dataset Overview](#-dataset-overview)
2. [What is ML? (Simple Explanation)](#-what-is-ml-simple-explanation)
3. [Our ML Model](#-our-ml-model)
4. [🚨 Accident Risk Prediction & Prevention](#-accident-risk-prediction--prevention)
5. [Dashboard — All 6 Pages](#-dashboard--all-6-pages)
6. [Tech Stack](#-tech-stack)
7. [Project Structure](#-project-structure)
8. [How to Run](#-how-to-run)

---

## 📦 Dataset Overview

**File:** `Pangyo_14days_lanes_w_arith_adj.csv`  
**Size:** ~76MB | **Rows:** ~266,000 | **Duration:** July 1–14, 2024

### What is each row?
Every row = **one 5-minute traffic snapshot** for one road segment + one time window.

### Columns Explained

| Column | Meaning |
|--------|---------|
| `TIMEINT` | Time interval (in seconds from midnight) |
| `date` | Date + time of the 5-minute window |
| `LINK_ID` | Road segment ID (1 to 65) |
| `DAY` | Day of week (1 = Monday … 7 = Sunday) |
| `VEHS(ALL)_N` | Number of vehicles in Lane N |
| `SPEEDAVGARITH(ALL)_N` | Average speed in Lane N (arithmetic mean, km/h) |
| `SPEEDAVGHARM(ALL)_N` | Average speed in Lane N (harmonic mean — more accurate for stop-go traffic) |
| `QUEUEDELAY(ALL)_N` | Queue delay in Lane N (how long cars are waiting, in seconds) |
| `OCCUPRATE(ALL)_N` | Occupancy rate of Lane N (0 to 1+; above 1.0 = over capacity = gridlock!) |

> **N = 1 to 6** → Up to 6 lanes per road link. Lane 6 often has zero values (inactive lane).

### Key Observations
- **65 unique road links** (road segments)
- **5-minute granularity** = 288 time slots per day × 14 days × 65 links
- **Peak hours (8–9am, 6–7pm):** 400–500 vehicles, delays > 200s, occupancy > 1.2 (over capacity)
- **Off-peak (late night):** Low volume, high speeds, near-zero delays
- **Lane 6** is mostly inactive — used only during extreme congestion events

---

## 🧠 What is ML? (Simple Explanation)

### One Line Summary
> **ML = Teaching a computer to make smart guesses by showing it examples.**

### Real World Analogy
Imagine you've been stuck in traffic in Pangyo every day for 14 days.  
After 14 days, you naturally start to know:
- "It's Monday 8:30am → this road is always jammed"
- "It's Sunday 2am → this road is always empty"
- "Yesterday was slow in the morning → today will probably be slow too"

**That's exactly what ML does.** We show it 14 days of traffic data, and it learns those patterns automatically.

### The 3 Steps

**Step 1: Feed it data (Training)**
```
We show the model:
"On July 1st at 8am, Road Link 5 had:
  - 450 vehicles, speed 45 km/h, delay 180 seconds"
"On July 2nd at 8am, Road Link 5 had:
  - 480 vehicles, speed 42 km/h, delay 200 seconds"
...repeat for 10 days of data...
```

**Step 2: It finds patterns (Learning)**
```
The model figures out on its own:
- "More vehicles = slower speed"
- "8am on weekdays = always bad"
- "If last 5 minutes were slow → next 5 minutes will also be slow"
```

**Step 3: It makes predictions (Testing)**
```
We ask: "It's Monday 8am, Road Link 5, 460 vehicles right now..."
It answers:
  - Predicted speed: 43 km/h
  - Predicted delay: 190 seconds
  - Congestion probability: 89% 🔴
```

### How We Know If It's Good?
We hide the **last 4 days** of data from the model during training.  
Then we ask: *"Predict what happened on July 11–14"*  
We compare predictions vs what actually happened:
```
Actual speed on July 11, 8am, Link 5:  42 km/h
Model predicted:                        44 km/h
Error:                                   2 km/h ← small = good model! ✅
```

---

## 🤖 Our ML Model

### Model Choice: LightGBM (Gradient Boosted Trees)

| Model | Like a student who... | Our Use |
|-------|----------------------|---------|
| Linear Regression | Uses a simple formula. Fast but dumb | ✅ Baseline for comparison |
| Random Forest | Asks 100 friends and takes a vote | ❌ Slower, less accurate |
| **LightGBM** | Learns from its mistakes, corrects itself repeatedly | ✅ **Main model** |
| LSTM (Deep Learning) | A genius but needs weeks of study | ❌ Overkill for this data |

### What We Predict (4 Targets)

| # | What We Predict | Column | Type |
|---|-----------------|--------|------|
| 1 | Is this road congested? | `OCCUPRATE > 0.8` → Yes/No | Classification |
| 2 | What will the speed be? | `SPEEDAVGHARM` | Regression |
| 3 | How long will the queue delay be? | `QUEUEDELAY` | Regression |
| 4 | How many vehicles expected? | `VEHS` | Regression |

### Features We Feed Into the Model

**Time Features**
- Hour of day (0–23)
- Day of week (Mon–Sun)
- Is it a weekend? (Yes/No)
- Is it peak AM (7–9am)? Is it peak PM (5–7pm)?
- Cyclical encoding of hour using sin/cos (so midnight connects to 11:59pm)

**Lag Features (Recent History)**
- Speed 5 minutes ago
- Speed 15 minutes ago
- Speed 1 hour ago
- Average vehicle count over the last 1 hour
- Speed variance over the last 1 hour

**Physics-Derived Features**
- `speed_delta` = Arithmetic speed − Harmonic speed → bigger gap = more stop-go congestion
- `congestion_score` = Queue Delay × Occupancy / Harmonic Speed
- `lane_balance_index` = How unevenly distributed vehicles are across lanes

### Train / Test Split
- **Training data:** July 1–10 (10 days)
- **Test data:** July 11–14 (4 days) — *hidden from model during training*
- This simulates predicting future days from past data — realistic and rigorous

### Output Files
After training, the model generates:
```
predictions.json        → Predicted speed, delay, congestion for all test intervals
feature_importance.json → Which features matter most to the model
metrics.json            → MAE, RMSE, R², AUC-ROC scores
actuals_vs_predicted.json → For the comparison chart in the dashboard
```

---

---

## 🚨 Accident Risk Prediction & Prevention

> We don't need separate accident data — we derive accident risk **directly from the traffic columns we already have.**  
> This is a real technique used in traffic safety research called **"surrogate safety measures"**.

---

### 🤔 How Can We Predict Accidents Without Accident Data?

Accidents don't appear randomly. They happen when specific dangerous conditions line up:
- A fast car hits a sudden traffic jam (rear-end collision)
- Lanes have wildly different speeds (sideswipe)
- Road is over capacity and vehicles are weaving
- Late night + high speed + low volume = risk of loss of control

All of these conditions are **already measurable** from our dataset.

---

### 🔴 Accident Risk Signals We Extract from the Data

| Signal | How We Calculate It | What It Indicates |
|--------|--------------------|-----------------|
| **Speed Variance Across Lanes** | `std(SPEEDAVGHARM lanes 1–5)` | High = lanes have wildly different speeds = sideswipe risk |
| **Harmonic-Arithmetic Speed Gap** | `SPEEDAVGARITH − SPEEDAVGHARM` | High = severe stop-go braking = rear-end collision risk |
| **Sudden Speed Drop** | `speed_t − speed_(t-1)` (large negative) | Sudden braking = vehicle ahead stopped unexpectedly |
| **Over-Capacity Occupancy** | `OCCUPRATE > 1.0` on any lane | Road is past its safe limit = shunting collision risk |
| **Queue Tail-End Zone** | High congestion road followed by free-flow | Transition zones = most dangerous spot for rear-end crashes |
| **Lane Imbalance Under Speed** | High `lane_balance_index` + low speed | Forced lane changes at speed = merging accident risk |
| **Night High Speed** | `hour in [22–5]` + `SPEEDAVGHARM > 130 km/h` | Fatigue + reduced visibility = run-off-road risk |
| **Occupancy Spike** | Sudden OCCUPRATE jump > 0.3 in one interval | Unexpected traffic materialising = surprise stop risk |

---

### 🧮 Composite Accident Risk Score (ARS)

We combine all signals into one **Accident Risk Score (0 to 10)** per road link per 5-minute window:

```
ARS = w1 × SpeedVariance
    + w2 × HarmonicArithmeticGap
    + w3 × SuddenSpeedDrop
    + w4 × OverCapacityFlag
    + w5 × QueueTailFlag
    + w6 × NightHighSpeedFlag
    + w7 × LaneImbalanceScore
```

Weights (w1–w7) are tuned based on traffic safety research standards.

**ARS Levels:**
| Score | Level | Action |
|-------|-------|--------|
| 0–3 | 🟢 Low Risk | Monitor normally |
| 3–6 | 🟡 Moderate Risk | Issue advisory |
| 6–8 | 🟠 High Risk | Reduce speed limit, alert drivers |
| 8–10 | 🔴 Critical | Consider lane closure / emergency signal |

---

### 🔮 What the Model Predicts

We train a **LightGBM classifier** specifically for accident risk:

| Input | Output |
|-------|--------|
| Current + lag traffic features | Predicted ARS for next 5–30 minutes |
| Speed variance trend | High Risk Zone flag (Yes/No) |
| Occupancy + delay trends | Probability of critical risk event (0–1) |

**Why this is powerful:**  
We're not just reacting — we're **predicting** that a road will become dangerous *before* it happens, giving authorities time to act.

---

### 🛡️ Prevention Recommendations Generated

When ARS crosses a threshold, the system auto-generates prevention actions:

| Risk Type Detected | Recommended Prevention |
|-------------------|------------------------|
| Rear-end risk (speed drop) | ⚠️ Dynamic speed limit reduction on approach roads |
| Queue tail-end zone | 🚦 Flash warning signs 500m before queue start |
| Over-capacity + lane imbalance | 🛣️ Activate dynamic lane management |
| Night high speed | 🌙 Lower speed limit between 10pm–5am |
| Occupancy spike | 📻 Push real-time alert to navigation apps (Kakao, T-map) |
| Sustained high ARS > 6 | 🚔 Notify traffic police for patrol deployment |

---

### 📊 Accident Risk Dashboard Components

Added to **Page 5 (Safety)** in the dashboard:

| Component | Description |
|-----------|-------------|
| 🗺️ **Risk Zone Map** | Heatmap overlay: which links are high-risk right now (or predicted) |
| 📈 **ARS Over Time** | Line chart showing accident risk score trend for selected link |
| ⚡ **Live Alert Feed** | Rolling list of roads that just crossed risk threshold |
| 🕐 **Risk by Hour** | Radial chart — which hours of day are most dangerous |
| 📅 **Risk Calendar** | 14-day calendar: which days had most high-risk events |
| 🏆 **Highest Risk Links** | Ranked list of most dangerous road segments |
| 🛡️ **Prevention Panel** | Auto-generated action cards per detected risk type |
| 📊 **Risk Breakdown** | Stacked bar: which signals contributed most to each risk event |

---

### 💡 Why This Stands Out to Judges

1. **No accident data needed** — We derive risk from physics, not just counts. Smart.
2. **Proactive not reactive** — We predict danger before it happens, not after.
3. **Direct human value** — "We can prevent X accidents per month" is a powerful pitch.
4. **Real prevention actions** — Not just a pretty chart; actual intervention recommendations.
5. **Novel feature engineering** — Speed variance across lanes is not an obvious metric.

---

## 🖥️ Dashboard — All 6 Pages

### Page 1 — 🏠 Overview (Command Center)
> *First impression. Wows judges instantly.*

---

**KPI Cards (Top Row)**
| Card | Shows |
|------|-------|
| Total Vehicles Observed | Sum of all vehicles across 14 days |
| Avg Free-Flow Speed | Average speed during off-peak hours |
| Peak Hour Max Delay | Worst queue delay during 7–9am |
| Road Links Monitored | 65 |
| Most Congested Link | Top road by congestion score |
| Worst Day | Day with highest total delay |

**Charts**
- 🔥 **Congestion Heatmap** — Road Link (Y) × Hour of Day (X) — click any cell to drill in
- 📈 **14-Day Traffic Trend** — Vehicle count per day, shows weekday vs weekend
- 🕐 **24-Hour Radial Clock** — Circular chart of congestion by hour (morning/evening peaks glow red)
- 🏆 **Top 10 Congested Links** — Horizontal bar chart, color-coded by severity

---

### Page 2 — 🔥 Congestion Analysis
> *Deep analytics with filters.*

**Filters:** Road Link | Date Range | Day Type | Time Range | Lane

**Charts**
- 🗓️ **14-Day Calendar Heatmap** — GitHub-style, color = congestion per day
- 📉 **Speed Over Time** — SPEEDAVGARITH vs SPEEDAVGHARM, gap shaded red when stop-go detected
- ⏱️ **Queue Delay Timeline** — Area chart over 24 hours, peaks highlighted
- 🌡️ **Occupancy Gauges** — 6 radial gauges, one per lane (green → red → dark red when over capacity)
- 🔵 **Fundamental Traffic Diagram** — Speed vs Volume scatter plot (free flow / unstable / congested zones)
- 📊 **Volume by Hour** — Weekday vs weekend grouped bar chart

---

### Page 3 — 🤖 AI Predictions
> *Where the LightGBM model shines.*

**Sections**
- 🎯 **Model Performance Scorecard** — MAE, RMSE, R², AUC-ROC vs baseline
- 📈 **Predicted vs Actual Chart** — How well the model tracked reality on test days
- 🔮 **Congestion Forecast** — 24-hour forward-looking congestion probability per link
- 🧠 **Feature Importance Chart** — What factors drive congestion most (hour, lag speed, link ID…)
- 🎮 **Interactive Prediction Widget** — User picks a road + time → model returns prediction
- 📉 **Residual Error Distribution** — Histogram of prediction errors (shows model is unbiased)

---

### Page 4 — 🛣️ Lane Analysis
> *Most teams won't go per-lane. This differentiates us.*

**Charts**
- 🕸️ **Lane Radar Chart** — Spider chart comparing all 6 lanes (speed / occupancy / volume)
- 📊 **Lane Distribution** — Stacked bar: vehicle count per lane over 24 hours
- ⚖️ **Lane Balance Index** — Line chart over time; high = imbalanced = opportunity to redistribute
- 🚨 **Lane 6 Activity Monitor** — Table of timestamps when the "emergency" lane activated
- 📋 **Per-Lane Stats Table** — Avg speed, delay, max occupancy, avg vehicles for each lane

---

### Page 5 — 🚨 Accident Risk & Safety
> *Unique safety-first angle. No other team will have this.*

**Charts & Components**
- 🗺️ **Risk Zone Heatmap** — Road Link × Hour, colored by Accident Risk Score
- 📈 **ARS Trend Line** — Accident Risk Score over 14 days for selected link
- ⚡ **High-Risk Event Feed** — Table of all intervals where ARS > 6 (with link, time, trigger reason)
- 🕐 **Risk by Hour (Radial)** — Which hours are most dangerous? (expect late night + peak AM)
- 🏆 **Top 10 Riskiest Links** — Ranked by peak ARS, with dominant risk factor shown
- 📊 **Risk Signal Breakdown** — Stacked bar: what caused each high-risk event (speed drop? over-capacity? lane imbalance?)
- 🛡️ **Auto-Prevention Panel** — Cards: "Link 5 at 8:30am — Queue Tail Detected → Recommend speed limit reduction + warning signs"

---

### Page 6 — 📋 Recommendations
> *Turns data into action. City planner output.*

**Sections**
- 🚦 **Smart Signal Timing Suggestions** — "Extend green phase by X seconds at Link 12, 8–9am"
- 🛣️ **Lane Management Cards** — Dynamic lane assignment recommendations with severity badges
- ⏰ **Commuter Time Loss Summary** — "X,XXX commuter-hours wasted per week. A 20% reduction saves XX,XXX hours/year"
- 📅 **Weekly Optimization Calendar** — 7-column grid, top 3 interventions per day
- 📤 **Export** — Download predictions as CSV

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| ML Model | Python + LightGBM | Best for tabular traffic data — fast, accurate, explainable |
| Data Processing | pandas, numpy | Industry standard for data manipulation |
| Model Export | scikit-learn, pickle | Save trained models, export predictions to JSON |
| Frontend | HTML5 + Vanilla CSS + JavaScript | No build step, fast to build, fully custom |
| Charts | Apache ECharts | Richer than Chart.js, handles heatmaps and radial charts |
| CSV Parsing | PapaParse.js | Parse 76MB CSV in-browser if needed |
| Design | Dark glassmorphism, Inter font, CSS animations | Premium look |

---

## 📂 Project Structure

```
Datport/
├── data/
│   └── Pangyo_14days_lanes_w_arith_adj.csv   # raw dataset
├── model/
│   ├── preprocess.py                          # feature engineering
│   ├── train.py                               # LightGBM training
│   ├── evaluate.py                            # metrics + charts
│   ├── export.py                              # generate JSON outputs
│   └── outputs/
│       ├── predictions.json
│       ├── feature_importance.json
│       ├── metrics.json
│       └── actuals_vs_predicted.json
├── dashboard/
│   ├── index.html                             # main dashboard
│   ├── style.css                              # design system
│   └── app.js                                # chart logic
└── README.md                                  # this file
```

---

## ▶️ How to Run

### 1. Install Python dependencies
```bash
pip install lightgbm scikit-learn pandas numpy matplotlib seaborn
```

### 2. Preprocess the data
```bash
python model/preprocess.py
```

### 3. Train the model
```bash
python model/train.py
```

### 4. Evaluate & export predictions
```bash
python model/evaluate.py
python model/export.py
```

### 5. Open the dashboard
```bash
# Just open index.html in your browser
# Or run a local server:
python -m http.server 8000
# Then go to http://localhost:8000
```

---

## 🎨 Design System

| Element | Value |
|---------|-------|
| Background | `#0a0f1e` Deep Navy |
| Card Surface | `#111827` |
| Accent | `#6366f1` Indigo |
| Free Flow (Good) | `#10b981` Green |
| Moderate Congestion | `#f59e0b` Amber |
| Heavy Congestion | `#ef4444` Red |
| Over Capacity | `#7f1d1d` Dark Red |
| Font | Inter (Google Fonts) |

---

## 🏅 Why We'll Stand Out

1. **Traffic science depth** — Harmonic vs arithmetic speed delta, fundamental traffic diagram
2. **Full ML pipeline** — Not just charts; a trained model with real predictions
3. **Per-lane analysis** — Most teams only do road-level; we go 6 levels deeper
4. **Actionable output** — Recommendations panel gives city planners concrete next steps
5. **Interactive prediction** — Judges can try it themselves: pick a road, get a prediction
6. **Human cost framing** — "X commuter-hours lost per year" makes data emotionally resonant

---

---

## 🏅 Complete Feature Summary

| Category | Features | Stand-Out Factor |
|----------|----------|------------------|
| Congestion Analysis | Heatmaps, speed trends, delay charts | ✅ Required by PS |
| ML Predictions | LightGBM, 4 targets, interactive widget | ⭐ Goes beyond PS |
| **Accident Risk** | **ARS score, 8 risk signals, prevention cards** | **🔥 Unique differentiator** |
| Lane Analysis | Radar chart, balance index, Lane 6 monitor | ⭐ Goes beyond PS |
| Recommendations | Signal timing, lane management, commuter cost | ✅ Required by PS |
| Design | Dark glassmorphism, animations, radial charts | 🎨 Premium look |

---

*Team AntiGravity | Dataport Hackathon 2024*
