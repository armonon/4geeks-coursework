# StreamLoop — tuning the churn model

This project completes the 4Geeks hyperparameter-tuning assignment using the
official IBM telecom-style customer churn dataset. It preserves a held-out test
set, keeps all learned preprocessing inside a scikit-learn `Pipeline`, records a
default Logistic Regression baseline, searches broadly with
`RandomizedSearchCV`, refines with `GridSearchCV`, and inspects fold stability.

## Run

```bash
uv sync
uv run python scripts/train.py
uv run pytest -q
```

The reproducible notebook is [`notebooks/streamloop_churn_tuning.ipynb`](notebooks/streamloop_churn_tuning.ipynb).
The decision record is [`tuning_report.md`](tuning_report.md), and machine-readable
evidence is under [`artifacts/`](artifacts/).

## Leakage and test-set contract

- Schema normalization converts blank `TotalCharges` values to missing before
  the split; it does not learn from data.
- Imputation, scaling, and one-hot encoding live inside the model pipeline and
  are fitted independently inside every cross-validation fold.
- Random and grid searches receive training data only.
- The held-out test set is evaluated exactly twice: once for the default
  baseline and once for the final refitted tuned estimator.
- F2 is the search metric because missing a real churner costs StreamLoop more
  than sending an unnecessary retention offer. Unlike pure recall, F2 still
  penalizes a degenerate model that predicts every customer will churn.
