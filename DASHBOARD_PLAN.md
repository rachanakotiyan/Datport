# 🖥️ Dashboard Build Guide
### Team AntiGravity | Dataport Hackathon 2024
> **For the frontend team.** This document tells you exactly what to build, page by page, component by component. The ML team will hand you a `predictions.json` file — your job is to make it look incredible.

---

## ⚡ Quick Start

### Files You'll Work With
```
Datport/
├── index.html          ← Main file. Build everything here (or split into pages)
├── style.css           ← All your CSS goes here
├── app.js              ← All chart logic and data loading
└── data/
    ├── predictions.json          ← ML model output (handed to you by ML team)
    ├── feature_importance.json   ← Which features drive predictions
    ├── metrics.json              ← Model accuracy numbers
    └── actuals_vs_predicted.json ← For comparison charts
```

### Libraries to Include (CDN links — just paste in `<head>`)
```html
<!-- Charts -->
<script src="https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js"></script>

<!-- CSV Parsing (if loading raw data in browser) -->
<script src="https://cdn.jsdelivr.net/npm/papaparse@5/papaparse.min.js"></script>

<!-- Google Fonts -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

---

## 🎨 Design System (USE THESE EVERYWHERE)

### Colors
```css
:root {
  /* Backgrounds */
  --bg-base:        #0a0f1e;   /* Page background — deep navy */
  --bg-card:        #111827;   /* Card surface */
  --bg-card-hover:  #1a2235;   /* Card on hover */
  --bg-border:      #1e2d45;   /* Card border */

  /* Accent */
  --accent:         #6366f1;   /* Indigo — primary brand color */
  --accent-glow:    rgba(99, 102, 241, 0.3);

  /* Traffic Status Colors */
  --free-flow:      #10b981;   /* Green — safe / good */
  --moderate:       #f59e0b;   /* Amber — watch out */
  --congested:      #ef4444;   /* Red — congested */
  --critical:       #7f1d1d;   /* Dark red — over capacity */
  --predicted:      #6366f1;   /* Indigo — predicted values */
  --actual:         #94a3b8;   /* Gray — actual values */

  /* Risk Colors */
  --risk-low:       #10b981;
  --risk-moderate:  #f59e0b;
  --risk-high:      #f97316;
  --risk-critical:  #ef4444;

  /* Text */
  --text-primary:   #f1f5f9;
  --text-secondary: #94a3b8;
  --text-muted:     #64748b;
}
```

### Typography
```css
body {
  font-family: 'Inter', sans-serif;
  background: var(--bg-base);
  color: var(--text-primary);
}

/* Headings */
h1 { font-size: 2rem;   font-weight: 700; }
h2 { font-size: 1.5rem; font-weight: 600; }
h3 { font-size: 1.1rem; font-weight: 500; }

/* KPI numbers */
.kpi-value { font-size: 2.5rem; font-weight: 700; letter-spacing: -1px; }
.kpi-label { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; color: var(--text-secondary); }
```

### Card Style
```css
.card {
  background: var(--bg-card);
  border: 1px solid var(--bg-border);
  border-radius: 16px;
  padding: 24px;
  transition: transform 0.2s, box-shadow 0.2s;
}
.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
}

/* Glass card variant */
.card-glass {
  background: rgba(17, 24, 39, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(99, 102, 241, 0.2);
}
```

### Glow Effect (for KPI cards)
```css
.glow-indigo  { box-shadow: 0 0 24px rgba(99, 102, 241, 0.3); }
.glow-green   { box-shadow: 0 0 24px rgba(16, 185, 129, 0.3); }
.glow-red     { box-shadow: 0 0 24px rgba(239, 68, 68, 0.3);  }
.glow-amber   { box-shadow: 0 0 24px rgba(245, 158, 11, 0.3); }
```

---

## 📐 Layout Structure

### Overall Page Layout
```
┌─────────────────────────────────────────────────────────────────┐
│                        HEADER (fixed top)                        │
├───────────────────────────────────────────────────────────────┬──┤
│                    NAV TABS (sticky)                          │  │
├───────────────────────────────────────────────────────────────┤  │
│                                                               │  │
│                     PAGE CONTENT AREA                        │  │
│                                                               │  │
└───────────────────────────────────────────────────────────────┴──┘
```

### Header HTML
```html
<header class="site-header">
  <div class="header-left">
    <span class="logo">🚦</span>
    <div>
      <h1>Urban Traffic Analytics</h1>
      <span class="subtitle">Pangyo Techno Valley · July 2024</span>
    </div>
  </div>
  <div class="header-right">
    <div class="badge">📡 65 Road Links</div>
    <div class="badge">📊 266K Observations</div>
    <div class="badge">📅 14 Days</div>
    <div id="live-clock" class="clock"></div>
  </div>
</header>
```

### Navigation Tabs
```html
<nav class="tab-nav">
  <button class="tab active" data-page="overview">🏠 Overview</button>
  <button class="tab" data-page="congestion">🔥 Congestion</button>
  <button class="tab" data-page="predictions">🤖 AI Predictions</button>
  <button class="tab" data-page="lanes">🛣️ Lane Analysis</button>
  <button class="tab" data-page="safety">🚨 Accident Risk</button>
  <button class="tab" data-page="recommendations">📋 Recommendations</button>
</nav>
```

---

## PAGE 1 — 🏠 OVERVIEW

### Layout
```
[ KPI Card ] [ KPI Card ] [ KPI Card ] [ KPI Card ] [ KPI Card ] [ KPI Card ]
[                    CONGESTION HEATMAP (wide)                               ]
[ 14-Day Trend Line (half width) ]  [ 24-Hour Radial Clock (half width)      ]
[         Top 10 Congested Links Horizontal Bar (full width)                 ]
```

---

### 1.1 KPI Cards (6 cards, row of 6)

Build each as a `<div class="card kpi-card">` with:

| Card # | Title | Value Source | Glow Color |
|--------|-------|-------------|------------|
| 1 | Total Vehicles | Sum all `VEHS` from dataset | `glow-indigo` |
| 2 | Avg Free-Flow Speed | Avg `SPEEDAVGHARM` where `OCCUPRATE < 0.3` | `glow-green` |
| 3 | Peak Hour Max Delay | Max `QUEUEDELAY` during hours 7–9 | `glow-red` |
| 4 | Road Links | Hardcode: **65** | `glow-indigo` |
| 5 | Most Congested Link | Link ID with highest avg ARS | `glow-amber` |
| 6 | Worst Day | Date with highest total delay | `glow-red` |

**Animation:** On page load, count up from 0 to the final value over 1.5 seconds.
```js
function animateCount(el, target, duration = 1500) {
  let start = 0;
  const step = target / (duration / 16);
  const timer = setInterval(() => {
    start += step;
    if (start >= target) { el.textContent = target.toLocaleString(); clearInterval(timer); }
    else el.textContent = Math.floor(start).toLocaleString();
  }, 16);
}
```

---

### 1.2 Congestion Heatmap (ECharts)

**Type:** `heatmap`  
**X-axis:** Hours 0–23 (labeled as "12am", "1am" … "11pm")  
**Y-axis:** Road Link IDs 1–65  
**Value:** Average `QUEUEDELAY × OCCUPRATE` per link per hour across all 14 days  
**Color range:** `['#10b981', '#f59e0b', '#ef4444']` (green → amber → red)  

```js
option = {
  tooltip: { trigger: 'item', formatter: (p) => `Link ${p.value[1]}, ${p.value[0]}:00<br/>Congestion: ${p.value[2].toFixed(2)}` },
  xAxis: { type: 'category', data: hours },
  yAxis: { type: 'category', data: linkIds },
  visualMap: { min: 0, max: 300, inRange: { color: ['#10b981', '#f59e0b', '#ef4444'] } },
  series: [{ type: 'heatmap', data: heatmapData }]
};
```

**Click interaction:** When a cell is clicked, store `selectedLink` and switch to Page 2 (Congestion) filtered to that link.

---

### 1.3 14-Day Traffic Trend (ECharts Line)

**Type:** `line`  
**X-axis:** July 1–14 dates  
**Y-axis:** Total vehicles per day  
**Toggle buttons:** Volume / Avg Speed / Avg Delay (switch the Y data)  
**Style:** Smooth line, gradient fill under the curve, dots on each data point  
**Color:** `#6366f1` (indigo)

Weekends (July 6–7, 13–14) should show as light gray background shading.

---

### 1.4 24-Hour Radial Clock (ECharts Radar or custom Canvas)

**Type:** `radar` or polar bar  
**Axes:** 24 hours arranged in a circle (0 at top, clockwise)  
**Value:** Avg congestion score at each hour  
**Color zones:**
- Hours 7–9: `#ef4444` (morning rush)  
- Hours 17–19: `#ef4444` (evening rush)  
- Hours 0–5: `#10b981` (night — calm)  
- All others: `#f59e0b`  

This is a **wow chart**. Make it look beautiful. Add a legend: "🔴 Rush Hour | 🟢 Night | 🟡 Daytime".

---

### 1.5 Top 10 Congested Links (Horizontal Bar)

**Type:** `bar` (horizontal)  
**Y-axis:** Top 10 Link IDs  
**X-axis:** Composite congestion score  
**Color:** Bar color based on score:
- Score > 7: `#ef4444`
- Score 4–7: `#f59e0b`
- Score < 4: `#10b981`

Add badge icons: 🥇 🥈 🥉 for top 3.

---

## PAGE 2 — 🔥 CONGESTION ANALYSIS

### Filter Bar (Sticky, below nav)
```html
<div class="filter-bar">
  <select id="filter-link">All Links / 1 / 2 / ... / 65</select>
  <input type="date" id="filter-date-from" value="2024-07-01">
  <input type="date" id="filter-date-to"   value="2024-07-14">
  <select id="filter-daytype">All / Weekday / Weekend</select>
  <input type="range" id="filter-hour-from" min="0" max="23"> → <span>Hour</span>
  <select id="filter-lane">All Lanes / Lane 1–6</select>
  <button id="reset-filters">Reset</button>
</div>
```

All charts on this page must re-render when any filter changes.

---

### 2.1 Calendar Heatmap (ECharts)

**Type:** ECharts `calendar` with `heatmap`  
**Range:** July 1–14  
**Color:** Congestion level per day  
**Click:** Click a day → all other charts filter to just that date

```js
option = {
  calendar: { range: ['2024-07-01', '2024-07-14'], cellSize: 40 },
  series: [{ type: 'heatmap', coordinateSystem: 'calendar', data: dailyData }]
};
```

---

### 2.2 Speed Over Time — Dual Line Chart

**Two lines:**
- Line 1 (dashed, gray `#94a3b8`): `SPEEDAVGARITH`
- Line 2 (solid, indigo `#6366f1`): `SPEEDAVGHARM`

**Shaded area between them:** Color red `rgba(239,68,68,0.2)` when gap > 20 km/h — this visually shows stop-go traffic.

**Tooltip:** Show both values + the gap.

---

### 2.3 Queue Delay Area Chart

**Type:** `line` with `areaStyle`  
**Color:** Gradient fill from `#ef4444` (top) to transparent  
**Threshold line:** Dashed horizontal line at 150 seconds = "danger zone"  
**Above threshold:** Shade the area in red  
**Below threshold:** Shade in green  

---

### 2.4 Occupancy Gauges (6 gauges, one per lane)

**Type:** ECharts `gauge`  
**Value:** Current (or selected-time) `OCCUPRATE` per lane  
**Color zones:**
```js
axisLine: {
  lineStyle: {
    color: [[0.5, '#10b981'], [0.8, '#f59e0b'], [1.0, '#ef4444'], [1.5, '#7f1d1d']]
  }
}
```
**Label:** Show "Lane N" below each gauge. If OCCUPRATE > 1.0, add "⚠️ OVER CAPACITY" text.  
**Layout:** 3 gauges top row, 3 bottom row.

---

### 2.5 Fundamental Traffic Diagram (Scatter)

**Type:** `scatter`  
**X-axis:** Vehicle count (`VEHS`) per 5-min interval  
**Y-axis:** `SPEEDAVGHARM`  
**Color by zone:**
- Volume < 200 and Speed > 100 → green (free flow)
- Speed < 60 → red (congested)
- Everything else → amber (unstable)

Add background zone labels: "FREE FLOW", "UNSTABLE", "CONGESTED" as text annotations.

This is your most impressive chart technically. Add a tooltip showing: `Link ID | Date | Time | Volume | Speed`.

---

### 2.6 Volume by Hour — Grouped Bar

**Type:** `bar` (grouped)  
**Two series:**
- Blue bars: Weekday avg vehicles per hour
- Green bars: Weekend avg vehicles per hour

**X-axis:** Hours 0–23  
**Y-axis:** Avg vehicle count  

---

## PAGE 3 — 🤖 AI PREDICTIONS

> Data comes from `predictions.json` provided by the ML team.

---

### 3.1 Model Performance Scorecard

Build as a **2×3 grid of metric cards**:

| Metric | Key in JSON | Unit | Good if... |
|--------|------------|------|------------|
| Speed MAE | `metrics.speed_mae` | km/h | < 10 |
| Speed R² | `metrics.speed_r2` | — | > 0.85 |
| Delay RMSE | `metrics.delay_rmse` | seconds | < 30 |
| Congestion Accuracy | `metrics.congestion_accuracy` | % | > 85% |
| AUC-ROC | `metrics.congestion_auc` | — | > 0.90 |
| vs Baseline | `metrics.improvement_vs_baseline` | % | Higher = better |

Color each card: green if "good", amber if borderline, red if poor.

---

### 3.2 Predicted vs Actual Chart

**Type:** `line` (dual line)  
**X-axis:** Datetime (July 11–14, 5-min intervals)  
**Two lines:**
- Solid gray line: Actual speed (`actual_speed` from JSON)
- Dashed indigo line: Predicted speed (`predicted_speed` from JSON)

**Toggle:** Speed / Delay / Volume  

Add a small annotation: "Model trained on July 1–10. Predicting July 11–14."

---

### 3.3 Congestion Forecast — 24 Hour View

**Type:** Line or bar chart  
**X-axis:** Hours 0–23  
**Y-axis:** Congestion probability (0–1)  
**Color:** Fill bars green/amber/red based on probability value  
**Dropdown:** Select Road Link (1–65)  

Add threshold lines at 0.5 (moderate) and 0.8 (high risk).

---

### 3.4 Feature Importance Chart

**Type:** Horizontal bar  
**Data source:** `feature_importance.json`  
**Color by category:**
- Time features (hour, day, is_peak): `#6366f1` indigo
- Lag features (speed_lag_1, etc.): `#f59e0b` amber
- Physics features (speed_delta, ARS): `#ef4444` red
- Road features (link_id, lane_count): `#10b981` green

Sort bars descending. Top bar = most important feature.  
Add a label: "These are the factors that matter most to the AI model."

---

### 3.5 Interactive Prediction Widget

This is the most engaging part. Judges will try this.

```html
<div class="prediction-widget card">
  <h3>🎮 Try the AI Predictor</h3>
  <div class="widget-inputs">
    <label>Road Link<br><select id="pred-link">1...65</select></label>
    <label>Day of Week<br><select id="pred-day">Monday...Sunday</select></label>
    <label>Hour<br><input type="range" id="pred-hour" min="0" max="23"><span id="pred-hour-label">8:00</span></label>
  </div>
  <button id="predict-btn">🔮 Predict</button>
  <div class="prediction-output" id="pred-result">
    <!-- Filled dynamically -->
    <div class="pred-item">🚗 Speed: <strong id="out-speed">--</strong> km/h</div>
    <div class="pred-item">⏱️ Delay: <strong id="out-delay">--</strong> sec</div>
    <div class="pred-item">🚦 Risk: <strong id="out-risk">--</strong></div>
    <div class="pred-item">📊 Congestion: <strong id="out-prob">--</strong>%</div>
  </div>
</div>
```

**Logic:** On "Predict" click, look up the matching row in `predictions.json` by `link_id + day_of_week + hour`. Display result with animated colored badge.

---

### 3.6 Residual Error Histogram

**Type:** `bar` (acts as histogram)  
**X-axis:** Error buckets: -30 to +30 km/h in steps of 5  
**Y-axis:** Count of predictions in that error range  
**Expected shape:** Bell curve centered at 0  
**Color:** Center bars green, outer bars red  

Add label: "A bell curve centered at 0 means the model has no bias."

---

## PAGE 4 — 🛣️ LANE ANALYSIS

### 4.1 Lane Radar Chart

**Type:** ECharts `radar`  
**6 axes:** Lane 1, Lane 2, Lane 3, Lane 4, Lane 5, Lane 6  
**Toggle metric:** Speed / Occupancy / Volume  
**Dropdown:** Select Road Link  

```js
option = {
  radar: {
    indicator: [
      { name: 'Lane 1', max: 200 },
      { name: 'Lane 2', max: 200 },
      // ...
    ]
  },
  series: [{ type: 'radar', data: [{ value: [speed1, speed2, ...] }] }]
};
```

Show two series: "Current Selection" (filled polygon, indigo) and "Average" (outline, gray).

---

### 4.2 Lane Distribution Stacked Bar

**Type:** `bar` (stacked)  
**X-axis:** Hours 0–23  
**Y-axis:** Vehicle count  
**6 series:** One per lane, different colors  
**Color palette:** `['#6366f1', '#8b5cf6', '#a78bfa', '#10b981', '#34d399', '#6ee7b7']`

---

### 4.3 Lane Balance Index Line Chart

**Type:** `line`  
**X-axis:** All 14 days (5-min intervals)  
**Y-axis:** Lane balance index (0 = perfect balance, 1 = all traffic in one lane)  

Add a threshold line at 0.5:
- Above 0.5 = "Lane Imbalance Detected" (amber zone background)
- Above 0.7 = "Severe Imbalance" (red zone background)

---

### 4.4 Lane 6 Activity Table

A simple data table showing every timestamp when Lane 6 had `VEHS > 0`:

| Date | Time | Road Link | Vehicles in Lane 6 | Speed | Occupancy | Severity |
|------|----|-----------|---------------------|-------|-----------|---------|

Color "Severity" column: amber/red based on volume.  
Add note: "Lane 6 activating = extreme congestion event."

---

### 4.5 Per-Lane Stats Table

| Lane | Avg Speed (km/h) | Avg Delay (s) | Max Occupancy | Avg Vehicles | Status |
|------|-----------------|--------------|---------------|-------------|--------|
| Lane 1 | | | | | 🟢/🟡/🔴 |
| ...  | | | | | |

Status = green if avg speed > 80, amber if 40–80, red if < 40.

---

## PAGE 5 — 🚨 ACCIDENT RISK & SAFETY

> **ARS = Accident Risk Score** (0–10). Calculated by combining 8 risk signals.

### Risk Score Color Mapping
```js
function riskColor(ars) {
  if (ars < 3) return '#10b981';  // green
  if (ars < 6) return '#f59e0b';  // amber
  if (ars < 8) return '#f97316';  // orange
  return '#ef4444';               // red
}
```

---

### 5.1 Risk Zone Heatmap

**Same layout as Page 1 Heatmap** but color = ARS score instead of delay.  
**X-axis:** Hour 0–23  
**Y-axis:** Link ID 1–65  
**Color:** green → amber → orange → red (0–10 scale)  
**Click:** Select link → all other charts on page filter to it  

---

### 5.2 ARS Trend Over Time

**Type:** `line` with area fill  
**X-axis:** All 14 days (daily average)  
**Y-axis:** Accident Risk Score (0–10)  
**Threshold lines:**
- Dashed line at 3: "Moderate Risk"
- Dashed line at 6: "High Risk"
- Dashed line at 8: "Critical"

**Area fill color:** Changes with value (use `visualMap` or manual gradient).

---

### 5.3 High-Risk Event Feed (Table)

Show all 5-minute intervals where ARS > 6, sorted by ARS descending:

| Time | Road Link | ARS Score | Primary Trigger | Status |
|------|-----------|-----------|----------------|--------|
| Jul 8, 08:30 | Link 5 | 8.4 | Queue Tail + Speed Drop | 🔴 Critical |
| Jul 8, 08:35 | Link 5 | 7.9 | Over Capacity | 🟠 High |
| ... | | | | |

Add a "🔴 Live" blinking badge in the section header (cosmetic — makes it feel real-time).

---

### 5.4 Risk by Hour Radial Chart

**Same as Page 1 Radial Clock** but showing average ARS by hour.  
Expected pattern: Peaks at 7–9am and 6–8pm. Small peak at 11pm–2am (night speed risk).

---

### 5.5 Top 10 Riskiest Links

**Type:** Horizontal bar chart  
**Y-axis:** Top 10 Link IDs  
**X-axis:** Peak ARS score  
**Each bar:** Show the dominant risk signal as a tag (e.g., "🔴 Queue Tail", "🟠 Speed Variance")

---

### 5.6 Risk Signal Breakdown (Stacked Bar)

**Type:** Stacked bar  
**X-axis:** Top 10 riskiest links  
**Y-axis:** Contribution to ARS (%)  
**8 stacks (one per signal):**

| Signal | Color |
|--------|-------|
| Speed Variance | `#ef4444` |
| Harmonic Gap | `#f97316` |
| Sudden Speed Drop | `#f59e0b` |
| Over Capacity | `#dc2626` |
| Queue Tail | `#7f1d1d` |
| Lane Imbalance | `#8b5cf6` |
| Night Speed | `#1e40af` |
| Occupancy Spike | `#d97706` |

---

### 5.7 Auto-Prevention Cards

Generate a card for each high-risk event. Card format:

```html
<div class="alert-card risk-high">
  <div class="alert-header">
    <span class="alert-badge">🔴 HIGH RISK</span>
    <span class="alert-time">Jul 8 · 08:30 · Link 5</span>
  </div>
  <div class="alert-trigger">⚠️ Trigger: Queue Tail Zone + Speed Drop Detected</div>
  <div class="alert-action">
    🚦 Recommended: Flash warning signs 500m before queue start<br>
    📉 Reduce speed limit on Link 4 (approach road) to 60 km/h
  </div>
</div>
```

**Trigger → Action mapping:**
| Trigger | Auto-generated recommendation |
|---------|-------------------------------|
| Queue Tail | Flash warning signs 500m before queue |
| Sudden Speed Drop | Dynamic speed limit reduction |
| Over Capacity | Activate dynamic lane management |
| Night High Speed | Lower limit between 10pm–5am |
| Occupancy Spike | Alert navigation apps |
| Sustained ARS > 6 | Notify traffic police patrol |
| Lane Imbalance | Recommend lane redistribution |

---

## PAGE 6 — 📋 RECOMMENDATIONS

### 6.1 Signal Timing Table

| Road Link | Time Window | Current Delay | Recommended Action | Priority |
|-----------|-------------|---------------|--------------------|----------|
| Link 5 | 7:30–9:00am | 180s | Extend green phase by 15s | 🔴 Urgent |
| Link 12 | 6:00–7:30pm | 145s | Add turn-only phase | 🟡 Medium |

---

### 6.2 Lane Management Cards

```html
<div class="rec-card urgent">
  <span class="rec-badge">🔴 Urgent</span>
  <h4>Link 5 — Lane Imbalance</h4>
  <p>Lane 1 carries 45% of traffic. Lanes 4–5 are underutilized during peak hours.</p>
  <p><strong>Action:</strong> Implement dynamic lane direction control 7–9am</p>
</div>
```

---

### 6.3 Commuter Time Loss Summary

Three big stat cards:
- **Total delay hours across 14 days** (sum all QUEUEDELAY / 3600)
- **Worst commute window** (5-min interval with highest total delay)
- **If we reduce congestion by 20%** → "X,XXX commuter-hours saved per year"

---

### 6.4 Weekly Optimization Calendar

7-column grid, Mon–Sun:

```
| Monday | Tuesday | ... | Sunday |
|--------|---------|-----|--------|
| 🔴 7–9am: Signal timing Link 5 |
| 🟡 6–7pm: Lane control Link 12 |
| 🟢 Monitor Link 34 |
```

---

### 6.5 Export Button

```html
<button onclick="downloadPredictions()">📥 Download Predictions CSV</button>
```

```js
function downloadPredictions() {
  // Convert predictions JSON to CSV and trigger download
  const csv = Papa.unparse(predictionsData);
  const blob = new Blob([csv], {type: 'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'pangyo_predictions.csv'; a.click();
}
```

---

## ✨ Global Micro-Animations (Add These!)

```css
/* Fade in cards on load */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
.card { animation: fadeInUp 0.5s ease forwards; }

/* Stagger delay for card rows */
.card:nth-child(1) { animation-delay: 0.1s; }
.card:nth-child(2) { animation-delay: 0.2s; }
.card:nth-child(3) { animation-delay: 0.3s; }

/* Glowing pulse for live badge */
@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
  50%       { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
}
.live-badge { animation: pulse 2s infinite; }

/* Tab switching transition */
.page-content { transition: opacity 0.3s ease; }
.page-content.hidden { opacity: 0; pointer-events: none; }
```

---

## ⏱️ Loading State

Show this while data is being parsed:
```html
<div id="loading-screen">
  <div class="loader-text">🚦 Loading 266,000 observations...</div>
  <div class="progress-bar"><div id="progress-fill"></div></div>
  <div class="loader-sub">Pangyo Traffic Analytics · Team AntiGravity</div>
</div>
```

---

## 📱 Responsive Breakpoints

```css
/* Desktop: default (all multi-column) */

/* Tablet */
@media (max-width: 1024px) {
  .kpi-row { grid-template-columns: repeat(3, 1fr); }
  .two-col  { grid-template-columns: 1fr; }
}

/* Mobile */
@media (max-width: 640px) {
  .kpi-row  { grid-template-columns: repeat(2, 1fr); }
  .tab-nav  { overflow-x: auto; white-space: nowrap; }
  h1        { font-size: 1.2rem; }
}
```

---

## ✅ Build Checklist

### Foundation
- [ ] `index.html` shell with header + nav tabs
- [ ] `style.css` with full design system (colors, fonts, card styles)
- [ ] Tab switching logic in `app.js`
- [ ] Loading screen with progress bar
- [ ] Live clock in header

### Page 1 — Overview
- [ ] 6 KPI cards with count-up animation
- [ ] Congestion heatmap (ECharts)
- [ ] 14-day trend line chart
- [ ] 24-hour radial clock
- [ ] Top 10 congested links bar

### Page 2 — Congestion
- [ ] Sticky filter bar (all filters wired up)
- [ ] Calendar heatmap
- [ ] Dual speed line chart (with shaded gap)
- [ ] Queue delay area chart
- [ ] 6 occupancy gauges
- [ ] Fundamental traffic diagram (scatter)
- [ ] Volume by hour grouped bar

### Page 3 — AI Predictions
- [ ] Model scorecard (6 metric cards)
- [ ] Predicted vs actual chart
- [ ] 24-hour congestion forecast
- [ ] Feature importance horizontal bar
- [ ] Interactive prediction widget
- [ ] Residual error histogram

### Page 4 — Lane Analysis
- [ ] Lane radar chart with toggle
- [ ] Lane distribution stacked bar
- [ ] Lane balance index line chart
- [ ] Lane 6 activity table
- [ ] Per-lane stats table

### Page 5 — Accident Risk
- [ ] Risk zone heatmap
- [ ] ARS trend line with threshold markers
- [ ] High-risk event feed table
- [ ] Risk by hour radial chart
- [ ] Top 10 riskiest links bar
- [ ] Risk signal breakdown stacked bar
- [ ] Auto-prevention alert cards

### Page 6 — Recommendations
- [ ] Signal timing table
- [ ] Lane management cards
- [ ] Commuter time loss stats
- [ ] Weekly optimization calendar
- [ ] Export CSV button

### Polish
- [ ] All card fade-in animations
- [ ] Hover effects on all cards
- [ ] Chart tooltips on all charts
- [ ] Mobile responsive layout
- [ ] Live clock working

---

*Team AntiGravity | Dataport Hackathon 2024 | Dashboard Build Guide v1.0*
