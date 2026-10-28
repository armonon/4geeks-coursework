"""Deterministic, disk-efficient preparation of the cats-vs-dogs dataset."""

from __future__ import annotations

import os
import random
import zipfile
from pathlib import Path


CLASSES = ("cat", "dog")
SPLIT_RATIOS = {"train": 0.70, "validation": 0.15, "test": 0.15}


def extract_archive(archive: Path, raw_dir: Path) -> Path:
    """Extract the provided archive once and return its labeled image directory."""

    image_dir = raw_dir / "dogs-vs-cats" / "train"
    if not image_dir.exists():
        with zipfile.ZipFile(archive) as zipped:
            zipped.extractall(raw_dir)
    return image_dir


def split_filenames(files: list[Path], seed: int = 42) -> dict[str, list[Path]]:
    """Return deterministic, mutually exclusive 70/15/15 file splits."""

    shuffled = sorted(files)
    random.Random(seed).shuffle(shuffled)
    train_end = int(len(shuffled) * SPLIT_RATIOS["train"])
    validation_end = train_end + int(len(shuffled) * SPLIT_RATIOS["validation"])
    return {
        "train": shuffled[:train_end],
        "validation": shuffled[train_end:validation_end],
        "test": shuffled[validation_end:],
    }


def prepare_directories(image_dir: Path, destination: Path, seed: int = 42) -> dict[str, int]:
    """Create class directories using hard links so images are not duplicated."""

    counts: dict[str, int] = {}
    for class_name in CLASSES:
        source_files = list(image_dir.glob(f"{class_name}.*.jpg"))
        if not source_files:
            raise FileNotFoundError(f"No {class_name} images found in {image_dir}")

        for split_name, files in split_filenames(source_files, seed).items():
            target_dir = destination / split_name / class_name
            target_dir.mkdir(parents=True, exist_ok=True)
            for source in files:
                target = target_dir / source.name
                if not target.exists():
                    os.link(source, target)
            counts[f"{split_name}_{class_name}"] = len(files)
    return counts
