"""Run the complete StreamLoop tuning workflow."""

from pathlib import Path

from streamloop import run_training

ROOT = Path(__file__).resolve().parents[1]

if __name__ == "__main__":
    result = run_training(ROOT)
    print(f"baseline recall: {result['baseline_test']['recall']:.4f}")
    print(f"tuned recall: {result['final_test']['recall']:.4f}")
