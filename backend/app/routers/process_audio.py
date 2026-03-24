import json
import logging
from io import BytesIO

from fastapi import APIRouter, File, UploadFile
from fastapi.responses import JSONResponse
from openai import OpenAI

from app.config import openai_api_key, openai_chat_model, openai_whisper_model
from app.prompts import SYSTEM_PROMPT_PROCESS_AUDIO

logger = logging.getLogger(__name__)

router = APIRouter(tags=["process-audio"])


@router.post("/api/process-audio")
async def process_audio(
    audio: UploadFile | None = File(None),
    file: UploadFile | None = File(None),
) -> JSONResponse:
    try:
        key = openai_api_key()
        if not key:
            return JSONResponse(
                {"success": False, "error": "Missing OPENAI_API_KEY"},
                status_code=500,
            )

        upload = audio or file
        if upload is None:
            return JSONResponse(
                {
                    "success": False,
                    "error": "Missing or invalid audio file in FormData (use field 'audio' or 'file')",
                },
                status_code=400,
            )

        raw = await upload.read()
        if not raw:
            return JSONResponse(
                {
                    "success": False,
                    "error": "Missing or invalid audio file in FormData (use field 'audio' or 'file')",
                },
                status_code=400,
            )

        client = OpenAI(api_key=key)
        buf = BytesIO(raw)
        buf.name = upload.filename or "audio.webm"

        transcription = client.audio.transcriptions.create(
            model=openai_whisper_model(),
            file=buf,
            response_format="verbose_json",
        )

        segments = getattr(transcription, "segments", None) or []
        if not segments:
            return JSONResponse(
                {
                    "success": False,
                    "error": "Whisper returned no segments (cannot build numbered transcript)",
                },
                status_code=400,
            )

        lines: list[str] = []
        for idx, seg in enumerate(segments):
            start_val = getattr(seg, "start", None)
            start = float(start_val) if start_val is not None else 0.0
            text = getattr(seg, "text", None) or ""
            if not isinstance(text, str):
                text = str(text)
            lines.append(f"[ID: {idx}] (Start: {start:.1f}s): {text}")

        transcript_for_llm = "\n".join(lines)

        completion = client.chat.completions.create(
            model=openai_chat_model(),
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT_PROCESS_AUDIO},
                {"role": "user", "content": transcript_for_llm},
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

        return JSONResponse(
            {
                "success": True,
                "utterances": parsed.get("utterances", []),
                "soapNotes": parsed.get("soapNotes", {}),
                "keywords": parsed.get("keywords", {}),
            }
        )
    except Exception as err:
        logger.exception("process-audio error")
        msg = str(err) if err else "Processing failed"
        return JSONResponse({"success": False, "error": msg}, status_code=500)
