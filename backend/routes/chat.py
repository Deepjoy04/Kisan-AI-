from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from services.gemini_service import chat_with_farmer
from utils.security import get_optional_user_payload
from utils.database import log_user_history
from typing import Optional
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

class ChatMessage(BaseModel):
    message: str
    language: str = "en"                         # en, hi, te, ta
    history: list[dict[str, str]] = Field(default_factory=list)  # previous messages for context

@router.post("/message")
async def send_message(data: ChatMessage, payload: Optional[dict] = Depends(get_optional_user_payload)):
    """
    Farmer sends a message in any language → AI responds in same language
    """
    if not data.message or not data.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    if data.language not in ["en", "hi", "te", "ta"]:
        raise HTTPException(status_code=400, detail="Unsupported language. Supported: en, hi, te, ta")

    try:
        response = await chat_with_farmer(
            message=data.message,
            language=data.language,
            history=data.history
        )
        
        if payload and "sub" in payload:
            log_user_history(payload["sub"], "Chat Interaction", {
                "message": data.message[:50] + "..." if len(data.message) > 50 else data.message,
                "language": data.language
            })
                
        return {"reply": response, "language": data.language}
    except ValueError as e:
        err_str = str(e)
        if "429" in err_str or "quota" in err_str.lower() or "exhausted" in err_str.lower():
            logger.warning(f"AI quota exceeded: {e}")
            raise HTTPException(
                status_code=429,
                detail="Daily AI quota exceeded. Please try again after midnight GMT or contact support."
            )
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")
    except Exception as e:
        err_str = str(e)
        if "429" in err_str or "quota" in err_str.lower():
            raise HTTPException(status_code=429, detail="Daily AI quota exceeded. Please try again after midnight GMT.")
        logger.error(f"Unexpected error in chat: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred while processing your message")
