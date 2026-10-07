import unittest
import os
import sys
from pathlib import Path

# Add backend directory to sys.path so imports work
sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi.testclient import TestClient
from main import app
from utils.cache import CacheManager


class TestKisanAIAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_root_health(self):
        """Verify API root status returns healthy."""
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data.get("status"), "healthy")

    def test_detailed_health_endpoint(self):
        """Verify /api/health returns diagnostic metrics including cache status."""
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data.get("status"), "healthy")
        self.assertIn("cache", data)
        self.assertIn("backend", data["cache"])

    def test_market_prices_default(self):
        """Verify market endpoint returns average price, history, and forecast advisory."""
        response = self.client.get("/api/market/prices?commodity=Tomato")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data.get("commodity"), "Tomato")
        self.assertIn("average_price", data)
        self.assertIn("history", data)
        self.assertIn("forecast", data)
        self.assertIn("advisory", data)
        self.assertIn("recommendation", data["advisory"])

    def test_market_geolocation_distance(self):
        """Verify nearest mandis are computed with distance_km when lat/lon supplied."""
        # Coordinates for New Delhi
        response = self.client.get("/api/market/prices?commodity=Tomato&lat=28.6139&lon=77.2090")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("nearest_markets", data)
        if data["nearest_markets"]:
            # First item should have a valid distance_km
            nearest = data["nearest_markets"][0]
            self.assertIn("distance_km", nearest)
            self.assertIsNotNone(nearest["distance_km"])

    def test_cache_manager_flow(self):
        """Verify CacheManager set, get, and delete operations."""
        test_key = "test_unit_key"
        test_val = {"crop": "Wheat", "price": 2400}
        
        # Set
        success = CacheManager.set(test_key, test_val, ttl_seconds=60)
        self.assertTrue(success)

        # Get
        retrieved = CacheManager.get(test_key)
        self.assertEqual(retrieved, test_val)

        # Delete
        CacheManager.delete(test_key)
        self.assertIsNone(CacheManager.get(test_key))


if __name__ == "__main__":
    unittest.main()
