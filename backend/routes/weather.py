from fastapi import APIRouter, Query, HTTPException
import httpx
import os
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

BASE_URL = "https://api.openweathermap.org/data/2.5"

def _get_weather_key():
    key = os.getenv("OPENWEATHER_API_KEY")
    if not key:
        raise HTTPException(status_code=500, detail="OPENWEATHER_API_KEY not configured")
    return key

@router.get("/current")
async def get_weather(lat: float = Query(...), lon: float = Query(...)):
    """Get current weather by coordinates"""
    # Validate coordinates first — return 400 before making any API call
    if not (-90 <= lat <= 90) or not (-180 <= lon <= 180):
        raise HTTPException(status_code=400, detail="Invalid coordinates")

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"{BASE_URL}/weather",
                params={"lat": lat, "lon": lon, "appid": _get_weather_key(), "units": "metric"}
            )
            if resp.status_code != 200:
                logger.error(f"Weather API error: {resp.status_code} - {resp.text}")
                raise HTTPException(status_code=502, detail="Weather service unavailable")
            data = resp.json()
            return {
                "city":        data.get("name", "Unknown"),
                "temp":        data["main"]["temp"],
                "humidity":    data["main"]["humidity"],
                "description": data["weather"][0]["description"],
                "icon":        data["weather"][0]["icon"],
                "wind_speed":  data["wind"]["speed"],
            }
    except HTTPException:
        raise
    except httpx.TimeoutException:
        logger.error("Weather API timeout")
        raise HTTPException(status_code=504, detail="Weather service timeout")
    except httpx.RequestError as e:
        logger.error(f"Weather API request error: {e}")
        raise HTTPException(status_code=502, detail="Failed to connect to weather service")
    except Exception as e:
        logger.error(f"Unexpected error in weather: {e}")
        raise HTTPException(status_code=500, detail="An error occurred while fetching weather")

@router.get("/forecast")
async def get_forecast(lat: float = Query(...), lon: float = Query(...)):
    """Get 5-day forecast for crop planning"""
    # Validate coordinates first — return 400 before making any API call
    if not (-90 <= lat <= 90) or not (-180 <= lon <= 180):
        raise HTTPException(status_code=400, detail="Invalid coordinates")

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"{BASE_URL}/forecast",
                params={"lat": lat, "lon": lon, "appid": _get_weather_key(), "units": "metric", "cnt": 40}
            )
            if resp.status_code != 200:
                logger.error(f"Forecast API error: {resp.status_code} - {resp.text}")
                raise HTTPException(status_code=502, detail="Weather service unavailable")
            data = resp.json()
            from typing import Dict, Any
            daily_forecasts: Dict[str, Dict[str, Any]] = {}

            for item in data["list"]:
                date = item["dt_txt"].split(" ")[0]
                
                # Check if this is a new date or existing
                if date not in daily_forecasts:
                    daily_forecasts[date] = {
                        "date": date,
                        "temp_max": float(item["main"]["temp_max"]),
                        "temp_min": float(item["main"]["temp_min"]),
                        "description": str(item["weather"][0]["description"]),
                        "icon": str(item["weather"][0]["icon"]),
                        "rain_chance": float(item.get("pop", 0) * 100),
                    }
                else:
                    # Update true daily max and min
                    curr_max = float(daily_forecasts[date]["temp_max"])
                    curr_min = float(daily_forecasts[date]["temp_min"])
                    daily_forecasts[date]["temp_max"] = max(curr_max, float(item["main"]["temp_max"]))
                    daily_forecasts[date]["temp_min"] = min(curr_min, float(item["main"]["temp_min"]))
                    
                    # If this is a daytime reading (e.g. 12:00:00), prefer its weather icon/description
                    time_str = item["dt_txt"].split(" ")[1]
                    if "12" <= time_str[:2] <= "15":
                        daily_forecasts[date]["description"] = str(item["weather"][0]["description"])
                        daily_forecasts[date]["icon"] = str(item["weather"][0]["icon"]).replace("n", "d") # prefer day icon

            forecasts = list(daily_forecasts.values())
            return {"forecast": forecasts}
    except HTTPException:
        raise
    except httpx.TimeoutException:
        logger.error("Forecast API timeout")
        raise HTTPException(status_code=504, detail="Weather service timeout")
    except httpx.RequestError as e:
        logger.error(f"Forecast API request error: {e}")
        raise HTTPException(status_code=502, detail="Failed to connect to weather service")
    except Exception as e:
        logger.error(f"Unexpected error in forecast: {e}")
        raise HTTPException(status_code=500, detail="An error occurred while fetching forecast")
