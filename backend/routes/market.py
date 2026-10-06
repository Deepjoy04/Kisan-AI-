from fastapi import APIRouter, HTTPException, Query
import httpx
import os
import time
import logging
from copy import deepcopy
from typing import Optional

router = APIRouter()
logger = logging.getLogger(__name__)

_MARKET_CACHE: dict[str, tuple[float, dict]] = {}
_MARKET_CACHE_TTL_SECONDS = int(os.getenv("MARKET_CACHE_TTL_SECONDS", "300"))


def _get_cached_market_response(cache_key: str) -> Optional[dict]:
    cached = _MARKET_CACHE.get(cache_key)
    if not cached:
        return None
    expires_at, payload = cached
    if time.time() >= expires_at:
        _MARKET_CACHE.pop(cache_key, None)
        return None
    response = deepcopy(payload)
    response["cached"] = True
    return response


def _set_cached_market_response(cache_key: str, payload: dict) -> None:
    _MARKET_CACHE[cache_key] = (time.time() + _MARKET_CACHE_TTL_SECONDS, deepcopy(payload))


def _build_derived_trend_history(avg_price: float, spread: float) -> list[dict[str, object]]:
    """Build a deterministic 7-day derived trend from today's snapshot (not random)."""
    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    if avg_price <= 0:
        return [{"day": day, "price": 0} for day in days]

    spread_ratio = min(max(spread / avg_price, 0.0), 0.15)
    multipliers = [
        0.97 - spread_ratio * 0.10,
        0.98 - spread_ratio * 0.05,
        0.99,
        1.00,
        1.01 + spread_ratio * 0.05,
        1.02 + spread_ratio * 0.10,
        1.00,
    ]

    history = []
    for day, m in zip(days, multipliers):
        history.append({"day": day, "price": round(avg_price * m)})
    history[-1]["price"] = round(avg_price)
    return history

@router.get("/prices")
async def get_market_prices(commodity: str = Query("Tomato", description="Commodity name like Tomato, Potato, Onion")):
    cache_key = commodity.strip().lower()
    cached_response = _get_cached_market_response(cache_key)
    if cached_response:
        return cached_response

    api_key = os.getenv("DATA_GOV_IN_API_KEY")
    records = []
    fallback_used = False

    if api_key:
        url = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070"
        params = {
            "api-key": api_key,
            "format": "json",
            "limit": 100,
            "filters[commodity]": commodity
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, params=params, timeout=15.0)
                if response.status_code == 200:
                    data = response.json()
                    records = data.get("records", [])
            except Exception as e:
                logger.warning(f"Failed to fetch live market data from data.gov.in: {e}")

    
    if not records:
        # Fallback mock data if the API is empty today for this crop
        fallback_used = True
        records = [
            {"market": "Azadpur Mandi", "state": "Delhi", "district": "Delhi", "modal_price": 2280, "commodity": commodity},
            {"market": "Vashi APMC", "state": "Maharashtra", "district": "Mumbai", "modal_price": 2350, "commodity": commodity},
            {"market": "Kolar", "state": "Karnataka", "district": "Kolar", "modal_price": 2100, "commodity": commodity},
            {"market": "Chittoor", "state": "Andhra Pradesh", "district": "Chittoor", "modal_price": 2150, "commodity": commodity},
            {"market": "Nashik", "state": "Maharashtra", "district": "Nashik", "modal_price": 2200, "commodity": commodity}
        ]
        
    # Process records to extract valid prices
    valid_records = []
    for r in records:
        try:
            price = float(r.get("modal_price", 0))
            if price > 0:
                valid_records.append({
                    "market": f"{r.get('market')} ({r.get('state')})",
                    "price": price,
                })
        except Exception:
            continue

    if not valid_records:
        raise HTTPException(status_code=404, detail="No price data available for " + commodity)

    # Calculate average
    total_price = sum(r["price"] for r in valid_records)
    avg_price = total_price / len(valid_records)

    # Deterministic % change against current cross-market average
    for item in valid_records:
        item["change"] = round(((item["price"] - avg_price) / avg_price) * 100, 1)
    
    # Sort to find Top Markets
    sorted_markets = sorted(valid_records, key=lambda x: x["price"], reverse=True)
    best_market = sorted_markets[0]

    price_spread = max(r["price"] for r in valid_records) - min(r["price"] for r in valid_records)
    trend_history = _build_derived_trend_history(avg_price=avg_price, spread=price_spread)
    
    # Calculate overarching trend percentage
    start_price = trend_history[0]["price"]
    end_price = trend_history[-1]["price"]
    trend_pct = round(((end_price - start_price) / start_price) * 100, 1)

    payload = {
        "commodity": commodity,
        "average_price": round(avg_price),
        "trend_percentage": trend_pct,
        "best_market": best_market,
        "top_markets": sorted_markets[:10],
        "history": trend_history,
        "data_source": "fallback_sample" if fallback_used else "live_api",
        "trend_note": "Trend is derived from current mandi snapshot and may differ from official historical time-series.",
        "cached": False,
    }

    _set_cached_market_response(cache_key, payload)
    logger.info("Market prices computed for %s (fallback=%s)", commodity, fallback_used)
    return payload
