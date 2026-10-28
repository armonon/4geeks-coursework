"""Reusable sentiment inference for WeLoveReviews customer feedback."""

from __future__ import annotations

import re
from collections.abc import Callable, Sequence
from typing import Any

import pandas as pd


MODEL_NAME = "nlptown/bert-base-multilingual-uncased-sentiment"
# Immutable revision from the model's official Hugging Face repository.
MODEL_REVISION = "8f6f4e3a8f70be4b65d3a4a8762b6d781cda240d"
REQUIRED_COLUMNS = {"review_id", "rating", "review_text"}


def stars_to_sentiment(stars: int) -> str:
    """Map the required 1–5 model output to three business-friendly bands."""

    if stars not in {1, 2, 3, 4, 5}:
        raise ValueError(f"Expected a star value from 1 to 5, received {stars!r}")
    if stars <= 2:
        return "negative"
    if stars == 3:
        return "neutral"
    return "positive"


def parse_star_label(label: str) -> int:
    """Extract the integer from Hugging Face labels such as ``'4 stars'``."""

    match = re.fullmatch(r"\s*([1-5])\s+stars?\s*", label, flags=re.IGNORECASE)
    if not match:
        raise ValueError(f"Unexpected model label: {label!r}")
    return int(match.group(1))


def validate_reviews(frame: pd.DataFrame, *, expected_rows: int | None = None) -> None:
    """Fail early when the input cannot satisfy the assignment contract."""

    missing_columns = REQUIRED_COLUMNS.difference(frame.columns)
    if missing_columns:
        raise ValueError(f"Missing required columns: {sorted(missing_columns)}")
    if expected_rows is not None and len(frame) != expected_rows:
        raise ValueError(f"Expected {expected_rows} reviews, found {len(frame)}")
    if frame[list(REQUIRED_COLUMNS)].isna().any().any():
        raise ValueError("Required review fields cannot contain missing values")
    if not frame["review_id"].is_unique:
        raise ValueError("review_id must be unique")
    if not frame["rating"].between(1, 5).all():
        raise ValueError("rating values must be between 1 and 5")
    if frame["review_text"].astype(str).str.strip().eq("").any():
        raise ValueError("review_text cannot be blank")


def load_classifier() -> Callable[..., Sequence[dict[str, Any]]]:
    """Load the required model exactly once for reuse across every review."""

    from transformers import pipeline

    return pipeline(
        task="text-classification",
        model=MODEL_NAME,
        tokenizer=MODEL_NAME,
        revision=MODEL_REVISION,
        device=-1,
    )


def analyze_reviews(
    frame: pd.DataFrame,
    *,
    classifier: Callable[..., Sequence[dict[str, Any]]] | None = None,
    batch_size: int = 16,
) -> pd.DataFrame:
    """Return a copy of ``frame`` enriched with model predictions and scores."""

    validate_reviews(frame)
    if batch_size < 1:
        raise ValueError("batch_size must be at least 1")

    model = classifier or load_classifier()
    predictions = model(
        frame["review_text"].astype(str).tolist(),
        batch_size=batch_size,
        truncation=True,
        max_length=256,
    )
    if len(predictions) != len(frame):
        raise RuntimeError(
            f"Model returned {len(predictions)} predictions for {len(frame)} reviews"
        )

    stars = [parse_star_label(prediction["label"]) for prediction in predictions]
    enriched = frame.copy()
    enriched["predicted_stars"] = stars
    enriched["predicted_sentiment"] = [stars_to_sentiment(value) for value in stars]
    enriched["prediction_confidence"] = [
        round(float(prediction["score"]), 6) for prediction in predictions
    ]
    return enriched
