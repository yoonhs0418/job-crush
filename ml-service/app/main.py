from __future__ import annotations

import os
import tempfile

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.schemas import (
    HealthResponse,
    SttResponse,
    VideoAnalysisResponse,
)
from app.services import stt as stt_service
from app.services.video import analyze_video

settings = get_settings()

app = FastAPI(title="Job Crush ML Service", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",")] or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def _save_upload(file: UploadFile, suffix: str) -> str:
    """업로드 파일을 임시 파일로 저장하고 경로를 반환."""
    fd, path = tempfile.mkstemp(suffix=suffix)
    try:
        with os.fdopen(fd, "wb") as out:
            while chunk := await file.read(1024 * 1024):
                out.write(chunk)
    except Exception as exc:  # noqa: BLE001
        os.unlink(path)
        raise HTTPException(status_code=400, detail=f"업로드 처리 실패: {exc}") from exc
    return path


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        whisper_model=settings.whisper_model,
        device=settings.whisper_device,
    )


@app.post("/stt", response_model=SttResponse)
async def speech_to_text(file: UploadFile = File(...)) -> SttResponse:
    """답변 오디오 → 텍스트. 턴 단위 처리(꼬리질문 생성)에 사용."""
    suffix = os.path.splitext(file.filename or "")[1] or ".webm"
    path = await _save_upload(file, suffix)
    try:
        transcript, language, duration, words = stt_service.transcribe(path)
        speech_rate = stt_service.estimate_speech_rate_wpm(len(words), duration)
        return SttResponse(
            transcript=transcript,
            language=language,
            duration_sec=round(duration, 2),
            speech_rate_wpm=speech_rate,
            words=words,
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"STT 처리 실패: {exc}") from exc
    finally:
        if os.path.exists(path):
            os.unlink(path)


@app.post("/analyze-video", response_model=VideoAnalysisResponse)
async def analyze_video_endpoint(
    file: UploadFile = File(...),
) -> VideoAnalysisResponse:
    """세션 전체 영상 → 표정/시선/음성톤/rPPG 심박 종합 분석. 세션 종료 후 일괄 처리."""
    suffix = os.path.splitext(file.filename or "")[1] or ".webm"
    path = await _save_upload(file, suffix)
    try:
        return analyze_video(path)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"영상 분석 실패: {exc}") from exc
    finally:
        if os.path.exists(path):
            os.unlink(path)
