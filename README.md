# California Housing K-means

A complete 4Geeks unsupervised-learning project that groups California census
block groups using latitude, longitude, and median income, then trains a
supervised classifier from the resulting pseudo-labels.

## Verified results

| Evidence | Result |
|---|---:|
| Official rows retained | 20,640 |
| Training rows | 16,512 |
| Held-out test rows | 4,128 |
| K-means clusters | 6 |
| Sampled train silhouette | 0.4012 |
| Selected supervised model | Random forest |
| Supervised test accuracy | **99.49%** |
| Supervised test macro F1 | **0.9933** |

The complete executed analysis, train/test cluster plots, centroid profiles,
model comparison, and confusion matrix are in
[`src/explore.ipynb`](src/explore.ipynb).

## Assignment coverage

- Loads the official `housing.csv` and selects only `Latitude`, `Longitude`, and
  `MedInc`
- Creates a reproducible 80/20 split before model fitting
- Scales the three unlike feature units inside a leakage-safe pipeline
- Fits the required six-cluster K-means model on training data only
- Adds integer `cluster` columns to training and test sets
- Predicts test clusters without refitting and overlays them on the cluster plot
- Profiles centroids back in original units and interprets the grouping
- Compares logistic regression and random forest using five-fold training CV
- Evaluates the selected classifier on the held-out test set
- Saves both fitted models under `models/`

## Reproduce

```bash
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python src/app.py
python scripts/build_notebook.py
jupyter nbconvert --to notebook --execute src/explore.ipynb \
  --output explore.ipynb --output-dir src --ExecutePreprocessor.timeout=900
pytest
```

## Saved evidence

- `models/kmeans_pipeline.joblib`: fitted scaler + six-cluster K-means
- `models/cluster_classifier.joblib`: selected random forest
- `data/processed/cluster_profiles.csv`: centroids in original units
- `data/processed/housing_train_clustered.csv`: training pseudo-labels
- `data/processed/housing_test_clustered.csv`: predicted test clusters
- `data/processed/metrics.json`: clustering and classification evidence

Cluster identifiers are arbitrary categories, not ranks or ground-truth social
labels. The supervised accuracy measures agreement with K-means pseudo-labels;
it does not establish that the six segments are objectively correct.
