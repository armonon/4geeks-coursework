from pathlib import Path

import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split

from streamloop.training import load_dataset, make_pipeline


def test_loader_normalizes_schema_without_learning_statistics(tmp_path: Path) -> None:
    source = tmp_path / "customers.csv"
    pd.DataFrame(
        {
            "customerID": ["a", "b"],
            "TotalCharges": [" ", "42.50"],
            "Contract": ["Monthly", "Annual"],
            "Churn": ["No", "Yes"],
        }
    ).to_csv(source, index=False)
    features, target = load_dataset(str(source))
    assert features["TotalCharges"].isna().sum() == 1
    assert features.loc[1, "TotalCharges"] == 42.5
    assert target.tolist() == [0, 1]
    assert "customerID" not in features


def test_preprocessing_and_default_classifier_are_inside_pipeline() -> None:
    pipeline = make_pipeline()
    classifier = pipeline.named_steps["classifier"]
    assert list(pipeline.named_steps) == ["preprocessing", "classifier"]
    assert isinstance(classifier, LogisticRegression)
    assert classifier.get_params()["C"] == 1.0
    assert classifier.get_params()["class_weight"] is None
    assert classifier.get_params()["solver"] == "lbfgs"


def test_split_is_reproducible_and_stratified() -> None:
    features, target = load_dataset()
    first = train_test_split(features, target, test_size=0.2, stratify=target, random_state=42)
    second = train_test_split(features, target, test_size=0.2, stratify=target, random_state=42)
    assert first[0].index.tolist() == second[0].index.tolist()
    assert abs(first[3].mean() - target.mean()) < 0.01
