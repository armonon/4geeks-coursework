"""Train, evaluate, and save the California housing clustering workflow."""

from __future__ import annotations

import json
from pathlib import Path

import joblib
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    silhouette_score,
)
from sklearn.model_selection import cross_validate, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler


ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "raw" / "housing.csv"
PROCESSED = ROOT / "data" / "processed"
MODELS = ROOT / "models"
FEATURES = ["Latitude", "Longitude", "MedInc"]
SEED = 42
N_CLUSTERS = 6


def load_housing(path: Path = DATA_PATH) -> pd.DataFrame:
    """Load and validate only the three assignment features."""

    frame = pd.read_csv(path)
    missing_columns = sorted(set(FEATURES) - set(frame.columns))
    if missing_columns:
        raise ValueError(f"Missing required columns: {missing_columns}")
    selected = frame[FEATURES].copy()
    if selected.isna().any().any():
        raise ValueError("The clustering features contain missing values")
    # Repeated values across these three selected features are valid: the
    # original rows represent distinct census block groups.
    return selected.reset_index(drop=True)


def split_data(frame: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Create a reproducible 80/20 holdout before fitting either model."""

    train, test = train_test_split(frame, test_size=0.20, random_state=SEED)
    return train.reset_index(drop=True), test.reset_index(drop=True)


def build_clusterer() -> Pipeline:
    """Scale unlike units, then fit the required six-cluster K-means model."""

    return Pipeline(
        [
            ("scaler", StandardScaler()),
            (
                "kmeans",
                KMeans(n_clusters=N_CLUSTERS, n_init=20, random_state=SEED),
            ),
        ]
    )


def compare_classifiers(
    train_features: pd.DataFrame, train_labels: pd.Series
) -> tuple[str, dict[str, object], dict[str, dict[str, float]]]:
    """Compare two defensible classifiers using training-only cross-validation."""

    candidates = {
        "logistic_regression": Pipeline(
            [
                ("scaler", StandardScaler()),
                (
                    "classifier",
                    LogisticRegression(max_iter=2_000, random_state=SEED),
                ),
            ]
        ),
        "random_forest": RandomForestClassifier(
            n_estimators=300,
            min_samples_leaf=2,
            random_state=SEED,
            n_jobs=-1,
        ),
    }
    summaries: dict[str, dict[str, float]] = {}
    for name, model in candidates.items():
        scores = cross_validate(
            model,
            train_features,
            train_labels,
            cv=5,
            scoring={"accuracy": "accuracy", "macro_f1": "f1_macro"},
            n_jobs=-1,
        )
        summaries[name] = {
            "cv_accuracy_mean": float(scores["test_accuracy"].mean()),
            "cv_accuracy_std": float(scores["test_accuracy"].std()),
            "cv_macro_f1_mean": float(scores["test_macro_f1"].mean()),
            "cv_macro_f1_std": float(scores["test_macro_f1"].std()),
        }
    winner = max(summaries, key=lambda name: summaries[name]["cv_macro_f1_mean"])
    return winner, candidates, summaries


def train_and_save() -> dict[str, object]:
    """Run the complete leakage-safe workflow and persist review evidence."""

    frame = load_housing()
    train, test = split_data(frame)

    clusterer = build_clusterer()
    train_clusters = clusterer.fit_predict(train[FEATURES])
    test_clusters = clusterer.predict(test[FEATURES])
    train["cluster"] = train_clusters.astype(int)
    test["cluster"] = test_clusters.astype(int)

    scaled_train = clusterer.named_steps["scaler"].transform(train[FEATURES])
    silhouette = silhouette_score(
        scaled_train, train_clusters, sample_size=5_000, random_state=SEED
    )
    inertia = float(clusterer.named_steps["kmeans"].inertia_)

    winner, candidates, comparisons = compare_classifiers(
        train[FEATURES], train["cluster"]
    )
    classifier = candidates[winner]
    classifier.fit(train[FEATURES], train["cluster"])
    predictions = classifier.predict(test[FEATURES])

    metrics: dict[str, object] = {
        "rows": int(len(frame)),
        "train_rows": int(len(train)),
        "test_rows": int(len(test)),
        "features": FEATURES,
        "n_clusters": N_CLUSTERS,
        "kmeans_inertia": inertia,
        "train_silhouette": float(silhouette),
        "cluster_counts_train": {
            str(key): int(value)
            for key, value in train["cluster"].value_counts().sort_index().items()
        },
        "cluster_counts_test": {
            str(key): int(value)
            for key, value in test["cluster"].value_counts().sort_index().items()
        },
        "classifier_comparison": comparisons,
        "selected_classifier": winner,
        "test_accuracy": float(accuracy_score(test["cluster"], predictions)),
        "test_macro_f1": float(
            f1_score(test["cluster"], predictions, average="macro")
        ),
        "test_confusion_matrix": confusion_matrix(
            test["cluster"], predictions, labels=range(N_CLUSTERS)
        ).tolist(),
        "test_classification_report": classification_report(
            test["cluster"],
            predictions,
            labels=range(N_CLUSTERS),
            output_dict=True,
            zero_division=0,
        ),
    }

    centroids_scaled = clusterer.named_steps["kmeans"].cluster_centers_
    centroids_original = clusterer.named_steps["scaler"].inverse_transform(
        centroids_scaled
    )
    profiles = pd.DataFrame(centroids_original, columns=FEATURES)
    profiles.insert(0, "cluster", range(N_CLUSTERS))

    PROCESSED.mkdir(parents=True, exist_ok=True)
    MODELS.mkdir(parents=True, exist_ok=True)
    train.to_csv(PROCESSED / "housing_train_clustered.csv", index=False)
    test.to_csv(PROCESSED / "housing_test_clustered.csv", index=False)
    profiles.to_csv(PROCESSED / "cluster_profiles.csv", index=False)
    (PROCESSED / "metrics.json").write_text(json.dumps(metrics, indent=2))
    joblib.dump(clusterer, MODELS / "kmeans_pipeline.joblib")
    joblib.dump(classifier, MODELS / "cluster_classifier.joblib")
    return metrics


if __name__ == "__main__":
    print(json.dumps(train_and_save(), indent=2))
