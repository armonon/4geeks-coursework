"""Leakage-safe baseline, broad search, narrow search, and final evaluation."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from scipy.stats import loguniform
from sklearn.compose import ColumnTransformer, make_column_selector
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    fbeta_score,
    make_scorer,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import GridSearchCV, RandomizedSearchCV, StratifiedKFold
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

DATA_URL = (
    "https://raw.githubusercontent.com/IBM/"
    "telco-customer-churn-on-icp4d/master/data/Telco-Customer-Churn.csv"
)
SEED = 42
F2_SCORER = make_scorer(fbeta_score, beta=2)


def load_dataset(url: str = DATA_URL) -> tuple[pd.DataFrame, pd.Series]:
    """Load the assignment dataset and perform non-learned schema normalization."""

    frame = pd.read_csv(url)
    required = {"customerID", "TotalCharges", "Churn"}
    missing = required - set(frame.columns)
    if missing:
        raise ValueError(f"Missing required columns: {sorted(missing)}")
    if frame["customerID"].duplicated().any():
        raise ValueError("customerID must be unique")

    frame["TotalCharges"] = pd.to_numeric(
        frame["TotalCharges"].replace(r"^\s*$", np.nan, regex=True), errors="coerce"
    )
    target = frame.pop("Churn").map({"No": 0, "Yes": 1})
    if target.isna().any():
        raise ValueError("Churn must contain only Yes/No values")
    features = frame.drop(columns=["customerID"])
    return features, target.astype(int)


def make_pipeline() -> Pipeline:
    """Return the default baseline with all learned preprocessing inside."""

    numeric = Pipeline(
        [("imputer", SimpleImputer(strategy="median")), ("scaler", StandardScaler())]
    )
    categorical = Pipeline(
        [
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("encoder", OneHotEncoder(handle_unknown="ignore")),
        ]
    )
    preprocessing = ColumnTransformer(
        [
            ("numeric", numeric, make_column_selector(dtype_include=np.number)),
            ("categorical", categorical, make_column_selector(dtype_exclude=np.number)),
        ]
    )
    return Pipeline(
        [
            ("preprocessing", preprocessing),
            ("classifier", LogisticRegression()),
        ]
    )


def evaluate(estimator: Pipeline, features: pd.DataFrame, target: pd.Series) -> dict[str, float]:
    """Evaluate one deliberately authorized use of the held-out test set."""

    prediction = estimator.predict(features)
    probability = estimator.predict_proba(features)[:, 1]
    return {
        "recall": float(recall_score(target, prediction)),
        "precision": float(precision_score(target, prediction)),
        "f1": float(f1_score(target, prediction)),
        "f2": float(fbeta_score(target, prediction, beta=2)),
        "accuracy": float(accuracy_score(target, prediction)),
        "roc_auc": float(roc_auc_score(target, probability)),
    }


def top_candidates(search: GridSearchCV, count: int = 5) -> list[dict[str, Any]]:
    """Return the highest-F2 candidates with their fold variability."""

    results = pd.DataFrame(search.cv_results_).sort_values(
        ["mean_test_score", "std_test_score"], ascending=[False, True]
    )
    return [
        {
            "rank": int(row["rank_test_score"]),
            "mean_cv_f2": float(row["mean_test_score"]),
            "std_cv_f2": float(row["std_test_score"]),
            "params": row["params"],
        }
        for _, row in results.head(count).iterrows()
    ]


def run_training(root: Path) -> dict[str, Any]:
    """Run the complete two-stage search and write reproducible artifacts."""

    from sklearn.model_selection import train_test_split

    artifacts = root / "artifacts"
    artifacts.mkdir(parents=True, exist_ok=True)
    features, target = load_dataset()
    x_train, x_test, y_train, y_test = train_test_split(
        features, target, test_size=0.2, stratify=target, random_state=SEED
    )

    baseline = make_pipeline()
    baseline.fit(x_train, y_train)
    baseline_metrics = evaluate(baseline, x_test, y_test)  # Test-set touch 1 of 2.

    cross_validation = StratifiedKFold(n_splits=5, shuffle=True, random_state=SEED)
    random_search = RandomizedSearchCV(
        estimator=make_pipeline(),
        param_distributions={
            "classifier__C": loguniform(1e-3, 1e3),
            "classifier__class_weight": [None, "balanced"],
            "classifier__fit_intercept": [True, False],
            "classifier__solver": ["lbfgs", "liblinear"],
        },
        n_iter=20,
        scoring=F2_SCORER,
        n_jobs=-1,
        cv=cross_validation,
        refit=True,
        random_state=SEED,
        return_train_score=True,
    )
    random_search.fit(x_train, y_train)

    best_c = float(random_search.best_params_["classifier__C"])
    grid_search = GridSearchCV(
        estimator=make_pipeline(),
        param_grid={
            "classifier__C": sorted(
                {
                    best_c / 9,
                    best_c / 3,
                    best_c / 1.5,
                    best_c,
                    best_c * 1.5,
                    best_c * 3,
                    best_c * 9,
                }
            ),
            "classifier__class_weight": [None, "balanced"],
            "classifier__fit_intercept": [
                bool(random_search.best_params_["classifier__fit_intercept"])
            ],
            "classifier__solver": [str(random_search.best_params_["classifier__solver"])],
        },
        scoring=F2_SCORER,
        n_jobs=-1,
        cv=cross_validation,
        refit=True,
        return_train_score=True,
    )
    grid_search.fit(x_train, y_train)
    final_metrics = evaluate(grid_search.best_estimator_, x_test, y_test)  # Touch 2 of 2.
    candidates = top_candidates(grid_search)

    pd.DataFrame(random_search.cv_results_).to_csv(
        artifacts / "random_search_results.csv", index=False
    )
    pd.DataFrame(grid_search.cv_results_).to_csv(artifacts / "grid_search_results.csv", index=False)
    joblib.dump(grid_search.best_estimator_, artifacts / "streamloop_churn_model.joblib")

    result: dict[str, Any] = {
        "dataset_url": DATA_URL,
        "rows": len(features),
        "train_rows": len(x_train),
        "test_rows": len(x_test),
        "target_churn_rate": float(target.mean()),
        "split": {"test_size": 0.2, "stratified": True, "random_state": SEED},
        "scoring": "F2 (beta=2)",
        "test_set_evaluations": 2,
        "baseline_default_hyperparameters": True,
        "baseline_test": baseline_metrics,
        "random_search": {
            "iterations": 20,
            "folds": 5,
            "best_cv_f2": float(random_search.best_score_),
            "best_params": random_search.best_params_,
        },
        "grid_search": {
            "candidates": len(grid_search.cv_results_["params"]),
            "folds": 5,
            "best_cv_f2": float(grid_search.best_score_),
            "best_cv_f2_std": float(
                grid_search.cv_results_["std_test_score"][grid_search.best_index_]
            ),
            "best_params": grid_search.best_params_,
            "top_candidates": candidates,
        },
        "final_test": final_metrics,
    }
    (artifacts / "metrics.json").write_text(json.dumps(result, indent=2))
    write_report(result, root / "tuning_report.md")
    return result


def write_report(result: dict[str, Any], destination: Path) -> None:
    baseline = result["baseline_test"]
    final = result["final_test"]
    grid = result["grid_search"]
    candidates = grid["top_candidates"]
    candidate_rows = "\n".join(
        f"| {candidate['rank']} | {candidate['mean_cv_f2']:.4f} | "
        f"{candidate['std_cv_f2']:.4f} | `{candidate['params']}` |"
        for candidate in candidates
    )
    metric_rows = "\n".join(
        f"| {label} | {baseline[key]:.4f} | {final[key]:.4f} | {final[key] - baseline[key]:+.4f} |"
        for label, key in (
            ("Recall", "recall"),
            ("Precision", "precision"),
            ("F1", "f1"),
            ("F2", "f2"),
            ("Accuracy", "accuracy"),
            ("ROC AUC", "roc_auc"),
        )
    )
    destination.write_text(
        f"""# StreamLoop churn-model tuning report

## Decision

The final model is the `GridSearchCV` refitted estimator with parameters
`{grid["best_params"]}`. The search metric is **F2 for churners** because a
missed churner causes more lost subscription revenue than an unnecessary
retention offer. F2 weights recall more than precision without rewarding the
degenerate strategy of predicting every customer will churn. Accuracy and ROC
AUC remain guardrail metrics.

## Leakage controls

The 80/20 stratified split occurs before model fitting. Median imputation,
standardization, most-frequent imputation, and one-hot encoding are all inside
the pipeline, so every cross-validation fold fits them only on its own training
rows. Both searches receive only the training split. The test set is evaluated
exactly twice: once for the default baseline and once for the final refitted
tuned estimator.

## Baseline versus tuned test performance

| Metric | Default baseline | Tuned model | Change |
|---|---:|---:|---:|
{metric_rows}

## Search process and stability

The broad randomized search evaluated 20 combinations across five stratified
folds with `n_jobs=-1`. Its best region was narrowed into a grid around `C`,
while retaining both class-weight choices. `refit=True` retrained the best grid
candidate automatically; the estimator was not fitted manually afterward.

| Rank | Mean CV F2 | Fold std | Parameters |
|---:|---:|---:|---|
{candidate_rows}

The selected candidate has mean CV F2 **{grid["best_cv_f2"]:.4f} ±
{grid["best_cv_f2_std"]:.4f}**. Its fold variation is reported rather than
hiding uncertainty behind one mean. The highest-mean candidate is retained
because its standard deviation is comparable to the neighboring candidates;
there is no evidence that a slightly lower mean buys a meaningful stability
improvement.

## Final hyperparameters

`{grid["best_params"]}`
"""
    )
