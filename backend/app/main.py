import logging

from fastapi import FastAPI

from app.routers import generate_billing, process_audio

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="MediScript AI API", version="0.1.0")

app.include_router(process_audio.router)
app.include_router(generate_billing.router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
