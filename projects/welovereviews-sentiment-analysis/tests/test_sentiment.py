from __future__ import annotations

import pandas as pd
import pytest

from src.sentiment import analyze_reviews, parse_star_label, stars_to_sentiment, validate_reviews


def sample_reviews() -> pd.DataFrame:
    return pd.DataFrame(
        {
            "review_id": [1, 2, 3],
            "rating": [5, 3, 1],
            "review_text": ["Loved it", "It was fine", "Never again"],
        }
    )


@pytest.mark.parametrize(
    ("stars", "expected"),
    [(1, "negative"), (2, "negative"), (3, "neutral"), (4, "positive"), (5, "positive")],
)
def test_stars_to_sentiment(stars: int, expected: str) -> None:
    assert stars_to_sentiment(stars) == expected


def test_parse_star_label_accepts_model_format() -> None:
    assert parse_star_label("1 star") == 1
    assert parse_star_label("5 stars") == 5


def test_validation_rejects_duplicate_ids() -> None:
    frame = sample_reviews()
    frame.loc[1, "review_id"] = 1
    with pytest.raises(ValueError, match="unique"):
        validate_reviews(frame)


def test_analyze_reviews_loads_no_extra_model_and_preserves_rows() -> None:
    calls: list[tuple[list[str], dict[str, object]]] = []

    def fake_classifier(texts: list[str], **kwargs: object) -> list[dict[str, object]]:
        calls.append((texts, kwargs))
        return [
            {"label": "5 stars", "score": 0.91},
            {"label": "3 stars", "score": 0.82},
            {"label": "1 star", "score": 0.73},
        ]

    result = analyze_reviews(sample_reviews(), classifier=fake_classifier, batch_size=2)

    assert len(calls) == 1
    assert calls[0][1]["batch_size"] == 2
    assert result["predicted_stars"].tolist() == [5, 3, 1]
    assert result["predicted_sentiment"].tolist() == ["positive", "neutral", "negative"]
    assert result["prediction_confidence"].tolist() == [0.91, 0.82, 0.73]
