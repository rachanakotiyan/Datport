import os
import re
import pandas as pd
import requests
from typing import Dict, Any, List, Optional
from app.config import OPENROUTER_API_KEY, OPENROUTER_MODEL
from app.intelligence import get_city_intelligence_metrics, get_road_intelligence_list, get_lane_intelligence_metrics, get_anomalies
from app.simulator import simulator

# Attempt to configure OpenRouter
HAS_OPENROUTER = False
if OPENROUTER_API_KEY:
    HAS_OPENROUTER = True
    print(f"AI Assistant: OpenRouter configured using model: {OPENROUTER_MODEL}")

def generate_offline_fallback(query: str, context: Dict[str, Any]) -> str:
    """Provides detailed rule-based answers based on query analysis when offline."""
    q = query.lower()
    
    # 1. Road rankings / Worst roads
    if any(k in q for k in ["worst", "best", "rank", "health", "health score", "top roads"]):
        roads = context["roads"]
        # Sort roads by Health Score
        roads_sorted = sorted(roads, key=lambda x: x["road_health_score"])
        
        reply = "### 📊 Pangyo Road Health & Performance Rankings\n\n"
        reply += f"Currently, the overall **City Traffic Score** is **{context['city']['city_traffic_score']}/100**.\n\n"
        reply += "Here are the top worst-performing road segments (lowest health first):\n\n"
        reply += "| Link ID | Road Health | Avg Speed | Max Queue Delay | Accident Risk |\n"
        reply += "|:-------:|:-----------:|:---------:|:---------------:|:-------------:|\n"
        for r in roads_sorted[:5]:
            reply += f"| **Link {r['link_id']}** | {r['road_health_score']} | {r['avg_speed']} km/h | {r['avg_delay']}s | {r['accident_risk']}/10 |\n"
            
        reply += "\n*Road health is computed by penalizing slow speeds, lane occupancy congestion, and high accident risk.*"
        return reply

    # 2. Safety / Alerts / Risk
    if any(k in q for k in ["alert", "safety", "accident", "risk", "critical", "danger"]):
        alerts = context["alerts"]
        if not alerts:
            return "### 🟢 Traffic Safety Summary\n\nThere are currently **no high-risk active safety warnings** in the Pangyo road network. All segments are operating under safe thresholds."
            
        reply = f"### 🚨 Active Traffic Safety Warnings ({len(alerts)} alerts)\n\n"
        reply += "The following links are under moderate to critical safety risks:\n\n"
        for a in alerts[:5]:
            badge = "🔴 CRITICAL" if a["severity"] == "CRITICAL" else "🟠 HIGH"
            reply += f"* **Link {a['link_id']}** ({badge} - Risk Score: {a['accident_risk_score']}/10):\n"
            reply += f"  * **Triggers:** {', '.join(a['triggers'])}\n"
            reply += f"  * **Recommendations:** {a['recommendations'][0] if a['recommendations'] else 'Monitor conditions'}\n"
            
        return reply

    # 3. Lane Intelligence
    if any(k in q for k in ["lane", "lanes", "fastest", "slowest", "efficiency"]):
        # Extract link_id if mentioned (e.g. "link 5" or just "5")
        link_id = 5  # default
        match = re.search(r'(?:link|road)?\s*(\d+)', q)
        if match:
            extracted_id = int(match.group(1))
            if 1 <= extracted_id <= 65:
                link_id = extracted_id
                
        lane_metrics = get_lane_intelligence_metrics(link_id, simulator.current_sim_time)
        reply = f"### 🛣️ Lane Intelligence for Link {link_id}\n\n"
        reply += f"* 🏎️ **Fastest Lane:** Lane {lane_metrics['fastest_lane']} ({lane_metrics['lanes'][lane_metrics['fastest_lane']-1]['avg_speed']} km/h)\n"
        reply += f"* 🐢 **Slowest Lane:** Lane {lane_metrics['slowest_lane']} ({lane_metrics['lanes'][lane_metrics['slowest_lane']-1]['avg_speed']} km/h)\n"
        reply += f"* 📦 **Highest Occupancy:** Lane {lane_metrics['highest_occupancy_lane']}\n\n"
        
        reply += "| Lane | Vehicles | Avg Speed | Queue Delay | Occupancy Rate | Efficiency |\n"
        reply += "|:----:|:--------:|:---------:|:-----------:|:--------------:|:----------:|\n"
        for l in lane_metrics["lanes"]:
            reply += f"| Lane {l['lane_number']} | {l['avg_vehicles']} | {l['avg_speed']} km/h | {l['avg_delay']}s | {l['avg_occupancy']:.2f} | **{l['lane_efficiency_score']}%** |\n"
            
        return reply

    # 4. Simulation instructions
    if any(k in q for k in ["simulate", "what-if", "what if", "closure", "multiplier"]):
        return "### 🔮 What-If Traffic Simulation Assistant\n\nYou can simulate custom scenarios in the dashboard or via the API. I can model:\n1. **Traffic Volume scaling** (e.g., scale traffic up by 30% to test bottleneck resilience).\n2. **Lane Closures** (e.g., close Lane 1 and Lane 2 on Link 5 to check speed drops and hazard increases).\n3. **Capacity expansion** (model dynamic shoulders or additional lanes).\n\nUse the **What-If simulation tab** in the dashboard to run these physics models interactively!"

    # 5. Default help
    reply = "### 👋 Hello! I am your AI Traffic Intelligence Assistant.\n\n"
    reply += "I can help analyze the traffic conditions, safety alerts, and ML models for the Pangyo Techno Valley network. You can ask me things like:\n"
    reply += "* *'Which are the worst road links right now?'*\n"
    reply += "* *'Show me active safety alerts and risk scores'*\n"
    reply += "* *'What is the lane efficiency breakdown for Link 5?'*\n"
    reply += "* *'How can I simulate a lane closure?'*\n\n"
    reply += f"**Current Network Status (Simulated time: {context['time']}):**\n"
    reply += f"* City Traffic Score: **{context['city']['city_traffic_score']}/100**\n"
    reply += f"* Active Congested Links: **{context['city']['active_congested_links']}**\n"
    reply += f"* Active Safety Warnings: **{context['city']['total_active_alerts']}**"
    return reply

def get_network_context() -> Dict[str, Any]:
    """Compiles all current traffic variables into a unified context payload."""
    sim_time = simulator.current_sim_time
    city_metrics = get_city_intelligence_metrics(sim_time)
    roads = get_road_intelligence_list(sim_time)
    alerts = simulator.get_active_alerts()
    anomalies = get_anomalies(sim_time)
    
    return {
        "time": str(sim_time),
        "city": city_metrics,
        "roads": roads,
        "alerts": alerts,
        "anomalies": anomalies
    }

def ask_ai_assistant(query: str, history: List[Dict[str, str]] = None) -> Dict[str, Any]:
    """Handles chatbot conversations using OpenRouter free models or offline rule fallbacks."""
    context = get_network_context()
    
    if not HAS_OPENROUTER:
        # Fallback to local intelligence rules
        response = generate_offline_fallback(query, context)
        return {
            "response": response,
            "data_references": {
                "timestamp": context["time"],
                "city_score": context["city"]["city_traffic_score"],
                "active_alerts": context["city"]["total_active_alerts"]
            }
        }

    # If OpenRouter is configured, generate response using OpenRouter API
    try:
        # Build prompt with rich markdown table contexts
        system_prompt = f"""
You are the AI Traffic Intelligence Assistant for the Pangyo Smart Traffic Platform (Team AntiGravity, Dataport Hackathon 2024).
You have access to live traffic metrics, safety warnings, and LightGBM model forecasts.
Your answers should be highly analytical, helpful, professional, and formatted in markdown.

### LIVE SYSTEM DATA (Simulated Time: {context['time']})
- Overall City Traffic Score: {context['city']['city_traffic_score']}/100 (Health Index: {context['city']['traffic_health_index']}/100)
- Total Active Alerts (ARS > 6.0): {context['city']['total_active_alerts']}
- Total Congested Road Segments: {context['city']['active_congested_links']}
- Worst Performing Road: Link {context['city']['worst_road']}

Active Safety Warnings List:
{context['alerts'][:5]}

Anomalies Detected:
{context['anomalies'][:3]}

Road Statistics sample (top 10 links):
{context['roads'][:10]}

Answer the user's question directly based on the provided live data context. If they ask about specific roads/lanes, use the data to justify your recommendations. If they ask about simulations, explain how they can run What-If simulations on the dashboard.
"""
        # Format conversation messages for OpenAI compatible format
        messages = [{"role": "system", "content": system_prompt}]
        if history:
            for h in history:
                role = "user" if h.get("role") == "user" else "assistant"
                messages.append({"role": role, "content": h.get("content")})
        messages.append({"role": "user", "content": query})

        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:8000",
            "X-Title": "Pangyo Smart Traffic Platform"
        }
        
        payload = {
            "model": OPENROUTER_MODEL,
            "messages": messages
        }
        
        # Call OpenRouter API
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=15
        )
        
        if response.status_code == 200:
            res_data = response.json()
            reply_text = res_data["choices"][0]["message"]["content"]
            return {
                "response": reply_text,
                "data_references": {
                    "timestamp": context["time"],
                    "city_score": context["city"]["city_traffic_score"],
                    "active_alerts": context["city"]["total_active_alerts"]
                }
            }
        else:
            raise Exception(f"OpenRouter API returned error status: {response.status_code} - {response.text}")
        
    except Exception as e:
        print(f"OpenRouter API execution error ({e}). Falling back to rule engine.")
        response = generate_offline_fallback(query, context)
        return {
            "response": f"*(AI API offline, displaying fallback report)*\n\n{response}",
            "data_references": {
                "timestamp": context["time"],
                "city_score": context["city"]["city_traffic_score"],
                "active_alerts": context["city"]["total_active_alerts"]
            }
        }

def get_automated_system_summary() -> str:
    """Generates a comprehensive summary report of the network's health."""
    context = get_network_context()
    sim_time = context["time"]
    city = context["city"]
    
    summary = f"### 🚦 Pangyo Smart Network Report\n"
    summary += f"**Reporting Period:** {sim_time} | **Platform:** Smart Traffic Intelligence v1.0\n\n"
    
    summary += "#### 📈 Network Aggregates\n"
    summary += f"* **City Traffic Score:** `{city['city_traffic_score']}/100` (Standard operational rating)\n"
    summary += f"* **Traffic Health Index:** `{city['traffic_health_index']}/100` (Reduces with congestion density)\n"
    summary += f"* **Bottlenecks:** `{city['active_congested_links']}` road links reporting queue delays\n"
    summary += f"* **Critical Risks:** `{city['total_active_alerts']}` road segments with high Accident Risk Scores\n\n"
    
    # Details on Worst Link
    worst_id = city["worst_road"]
    roads_map = {r["link_id"]: r for r in context["roads"]}
    worst_road = roads_map.get(worst_id)
    
    if worst_road:
        summary += "#### ⚠️ Worst Performing Segment\n"
        summary += f"* **Link ID:** `{worst_id}`\n"
        summary += f"* **Harmonic Speed:** `{worst_road['avg_speed']} km/h` | **Max Delay:** `{worst_road['avg_delay']} seconds`\n"
        summary += f"* **Dominant Factors:** High occupancy (`{worst_road['avg_occupancy']}`) and elevated Accident Risk Score (`{worst_road['accident_risk']}/10`)\n\n"
        
    # Active alerts summary
    summary += "#### ⚡ Traffic Control Advisories\n"
    if context["alerts"]:
        for a in context["alerts"][:2]:
            summary += f"* **Link {a['link_id']}**: {a['triggers'][0]}. *Advisory:* {a['recommendations'][0]}\n"
    else:
        summary += "* *Dynamic network advice:* Traffic flow is stable. Continue normal signaling schedules.\n"
        
    return summary
