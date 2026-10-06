from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, field_validator
from services.gemini_service import analyze_soil
from utils.security import get_optional_user_payload
from utils.database import log_user_history
from typing import Optional
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

class SoilData(BaseModel):
    nitrogen: float       # kg/ha
    phosphorus: float     # kg/ha
    potassium: float      # kg/ha
    ph: float             # 0-14
    moisture: float       # percentage
    crop_type: str        # what the farmer wants to grow
    location: str         # state/district

    @field_validator('nitrogen', 'phosphorus', 'potassium')
    @classmethod
    def validate_nutrients(cls, v):
        if v < 0:
            raise ValueError("Nutrient values cannot be negative")
        return v

    @field_validator('ph')
    @classmethod
    def validate_ph(cls, v):
        if not (0 <= v <= 14):
            raise ValueError("pH must be between 0 and 14")
        return v

    @field_validator('moisture')
    @classmethod
    def validate_moisture(cls, v):
        if not (0 <= v <= 100):
            raise ValueError("Moisture must be between 0 and 100 percent")
        return v

    @field_validator('crop_type', 'location')
    @classmethod
    def validate_strings(cls, v):
        if not v or not v.strip():
            raise ValueError("Crop type and location cannot be empty")
        return v

@router.post("/analyze")
async def soil_analysis(data: SoilData, payload: Optional[dict] = Depends(get_optional_user_payload)):
    """
    Submit soil parameters → get fertilizer & crop recommendations
    """
    try:
        result = await analyze_soil(data.model_dump())
        
        if payload and "sub" in payload:
            log_user_history(payload["sub"], "Soil Analysis", {
                "crop": data.crop_type,
                "location": data.location
            })
                
        return result
    except ValueError as e:
        err_str = str(e)
        if "429" in err_str or "quota" in err_str.lower() or "exhausted" in err_str.lower():
            logger.warning(f"AI quota exceeded: {e}")
            raise HTTPException(
                status_code=429,
                detail="Daily AI quota exceeded. Please try again after midnight GMT or contact support."
            )
        logger.error(f"Soil analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
    except Exception as e:
        err_str = str(e)
        if "429" in err_str or "quota" in err_str.lower():
            raise HTTPException(status_code=429, detail="Daily AI quota exceeded. Please try again after midnight GMT.")
        logger.error(f"Unexpected error in soil analysis: {e}")
        raise HTTPException(status_code=500, detail="An error occurred during soil analysis")
