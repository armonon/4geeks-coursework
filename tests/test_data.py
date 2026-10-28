from pathlib import Path

from src.data import split_filenames


def test_split_is_deterministic_complete_and_disjoint() -> None:
    files = [Path(f"cat.{index}.jpg") for index in range(100)]
    first = split_filenames(files, seed=42)
    second = split_filenames(files, seed=42)

    assert first == second
    assert {name: len(values) for name, values in first.items()} == {
        "train": 70,
        "validation": 15,
        "test": 15,
    }
    all_paths = first["train"] + first["validation"] + first["test"]
    assert len(all_paths) == len(set(all_paths)) == 100
