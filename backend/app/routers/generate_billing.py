import json
import logging
from typing import Any

from fastapi import APIRouter, Body
from fastapi.responses import JSONResponse
from openai import OpenAI

from app.config import openai_api_key, openai_chat_model
from app.prompts import SYSTEM_PROMPT_BILLING

logger = logging.getLogger(__name__)

router = APIRouter(tags=["generate-billing"])


@router.post("/api/generate-billing")
async def generate_billing(soap_notes: dict[str, Any] = Body(...)) -> JSONResponse:
    try:
        key = openai_api_key()
        if not key:
            return JSONResponse(
                {"success": False, "error": "Missing OPENAI_API_KEY"},
                status_code=500,
            )

        client = OpenAI(api_key=key)
        payload = soap_notes if soap_notes is not None else {}

        completion = client.chat.completions.create(
            model=openai_chat_model(),
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT_BILLING},
                {"role": "user", "content": json.dumps(payload)},
            ],
            response_format={"type": "json_object"},
        )

        content = completion.choices[0].message.content
        if not content:
            return JSONResponse(
                {"success": False, "error": "OpenAI returned no content"},
                status_code=500,
            )

        try:
            parsed = json.loads(content)
        except json.JSONDecodeError:
            return JSONResponse(
                {"success": False, "error": "OpenAI response was not valid JSON"},
                status_code=500,
            )

        cpt = parsed.get("cpt") if isinstance(parsed.get("cpt"), list) else []
        icd10 = parsed.get("icd10") if isinstance(parsed.get("icd10"), list) else []

        return JSONResponse({"success": True, "cpt": cpt, "icd10": icd10})
    except Exception as err:
        logger.exception("generate-billing error")
        msg = str(err) if err else "Billing generation failed"
        return JSONResponse({"success": False, "error": msg}, status_code=500)
