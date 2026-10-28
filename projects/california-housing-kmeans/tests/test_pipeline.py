from pathlib import Path

import numpy as np
import pandas as pd

from app import FEATURES, N_CLUSTERS, build_clusterer, split_data


def test_split_is_reproducible() -> None:
    frame = pd.DataFrame(
        {
            "Latitude": np.linspace(32, 42, 100),
            "Longitude": np.linspace(-124, -114, 100),
            "MedInc": np.linspace(1, 10, 100),
        }
    )
    first_train, first_test = split_data(frame)
    second_train, second_test = split_data(frame)
    pd.testing.assert_frame_equal(first_train, second_train)
    pd.testing.assert_frame_equal(first_test, second_test)
    assert len(first_train) == 80
    assert len(first_test) == 20


def test_clusterer_produces_six_clusters() -> None:
    rng = np.random.default_rng(42)
    centers = np.array(
        [
            [33, -118, 2],
            [34, -117, 4],
            [35, -120, 6],
            [37, -122, 3],
            [38, -121, 7],
            [40, -123, 5],
        ]
    )
    values = np.vstack(
        [center + rng.normal(0, 0.05, size=(30, 3)) for center in centers]
    )
    frame = pd.DataFrame(values, columns=FEATURES)
    labels = build_clusterer().fit_predict(frame)
    assert len(set(labels)) == N_CLUSTERS


def test_official_dataset_is_present() -> None:
    assert Path("data/raw/housing.csv").is_file()
