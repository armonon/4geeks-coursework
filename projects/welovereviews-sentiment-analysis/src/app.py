"""Production entry point for the WeLoveReviews sentiment pipeline."""

from __future__ import annotations

import argparse
from pathlib import Path

import pandas as pd

from sentiment import analyze_reviews, validate_reviews


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = PROJECT_ROOT / "data" / "raw" / "reviews.csv"
DEFAULT_OUTPUT = PROJECT_ROOT / "data" / "processed" / "reviews_with_sentiment.csv"


def run_inference(
    input_path: Path = DEFAULT_INPUT,
    output_path: Path = DEFAULT_OUTPUT,
    *,
    batch_size: int = 16,
) -> pd.DataFrame:
    """Read, validate, enrich, and persist the complete review dataset."""

    reviews = pd.read_csv(input_path)
    validate_reviews(reviews, expected_rows=500)
    enriched = analyze_reviews(reviews, batch_size=batch_size)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    enriched.to_csv(output_path, index=False)
    return enriched


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Classify WeLoveReviews customer feedback with a pinned BERT model."
    )
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--batch-size", type=int, default=16)
    return parser


def main() -> None:
    args = build_parser().parse_args()
    enriched = run_inference(args.input, args.output, batch_size=args.batch_size)

    breakdown = (
        enriched["predicted_sentiment"]
        .value_counts(normalize=True)
        .reindex(["positive", "neutral", "negative"], fill_value=0)
        .mul(100)
        .round(1)
    )
    print(f"Processed {len(enriched)} reviews -> {args.output}")
    print("Sentiment breakdown (%):")
    print(breakdown.to_string())


if __name__ == "__main__":
    main()
