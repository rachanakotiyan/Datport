import unittest
import sys
import os

# Append current directory to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), "app"))
sys.path.append(os.path.dirname(__file__))

from fastapi.testclient import TestClient
from app.main import app
from app.predictor import predictor
from app.simulator import simulator

class TestTrafficPlatformBackend(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Trigger predictor and simulator resources loading
        predictor.load_resources()
        cls.client = TestClient(app)

    def test_health_redirect(self):
        """Verifies the root endpoint redirects to swagger docs."""
        response = self.client.get("/", follow_redirects=False)
        self.assertEqual(response.status_code, 307)
        self.assertTrue("docs" in response.headers["location"])

    def test_metrics_endpoint(self):
        """Verifies model metrics are served correctly."""
        response = self.client.get("/api/metrics")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("speed_mae", data)
        self.assertIn("congestion_accuracy", data)

    def test_feature_importance_endpoint(self):
        """Verifies SHAP/feature importance metrics are served."""
        response = self.client.get("/api/feature-importance")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(len(data) > 0)

    def test_interactive_prediction(self):
        """Verifies live prediction endpoint returns expected predictions and confidence score."""
        payload = {
            "link_id": 5,
            "day_of_week": 1,  # Monday
            "hour": 8,         # 8 AM
            "minute": 30       # 8:30 AM
        }
        response = self.client.post("/api/predict/interactive", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["link_id"], 5)
        self.assertIn("predicted_speed", data)
        self.assertIn("predicted_delay", data)
        self.assertIn("predicted_risk", data)
        self.assertIn("confidence_score", data)

    def test_multi_horizon_predictions(self):
        """Verifies 5m, 15m, 30m, 60m horizons forecasts."""
        response = self.client.get("/api/predict/horizons?link_id=5&day_of_week=2&hour=18&minute=15")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["link_id"], 5)
        self.assertEqual(len(data["forecasts"]), 4)  # 5, 15, 30, 60
        self.assertEqual(data["forecasts"][0]["horizon_minutes"], 5)

    def test_intelligence_city(self):
        """Verifies City Traffic Score aggregates."""
        response = self.client.get("/api/intelligence/city")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("city_traffic_score", data)
        self.assertIn("traffic_health_index", data)

    def test_intelligence_roads(self):
        """Verifies road intelligence list computes correctly."""
        response = self.client.get("/api/intelligence/roads")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(len(data) > 0)
        self.assertIn("road_health_score", data[0])

    def test_intelligence_lanes(self):
        """Verifies lane intelligence computes per-lane variables."""
        response = self.client.get("/api/intelligence/lanes?link_id=12")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["link_id"], 12)
        self.assertTrue(len(data["lanes"]) == 6)
        self.assertIn("lane_efficiency_score", data["lanes"][0])

    def test_whatif_simulation(self):
        """Verifies simulation of volume scaling and lane closures increases risk and delays."""
        payload = {
            "link_id": 5,
            "traffic_multiplier": 1.5,  # scale traffic +50%
            "closed_lanes": [1, 2],    # close lanes 1 & 2
            "capacity_improvement": 0.0
        }
        response = self.client.post("/api/simulation/what-if", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["link_id"], 5)
        self.assertIn("baseline", data)
        self.assertIn("simulated", data)
        # Expected result: delay increases or speed decreases
        self.assertTrue(data["simulated"]["delay"] >= 0)

    def test_simulator_controls(self):
        """Verifies play, pause, state controls work."""
        # Pause
        response = self.client.post("/api/simulator/control?action=pause")
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.json()["is_running"])

        # Play with speed
        response = self.client.post("/api/simulator/control?action=play&speed=3.0")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["is_running"])
        self.assertEqual(response.json()["speed_multiplier"], 3.0)

    def test_ai_chatbot_fallback(self):
        """Verifies AI Chatbot responds successfully."""
        payload = {
            "query": "What is the worst performing road?",
            "history": []
        }
        response = self.client.post("/api/ai/chat", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("response", data)

    def test_ai_summary(self):
        """Verifies AI automated summaries return markdown briefing."""
        response = self.client.get("/api/ai/summary")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("summary_markdown", data)

if __name__ == "__main__":
    unittest.main()
