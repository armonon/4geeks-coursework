# Cats vs. Dogs Image Classifier

An end-to-end binary image-classification project built from the official
25,000-image cats-vs-dogs dataset. It follows the required 4Geeks
EfficientNet-B0 architecture, documents the literal from-scratch baseline, and
uses transfer learning for the final resource-efficient checkpoint.

## Verified result

| Evidence | Result |
|---|---:|
| Training images | 17,500 |
| Validation images | 3,750 |
| Untouched test images | 3,750 |
| Test accuracy | **99.20%** |
| Test loss | 0.0291 |
| Test mistakes | 30 |
| Cat F1 | 0.9920 |
| Dog F1 | 0.9920 |

The confusion matrix is `[[1866, 9], [21, 1854]]`. Detailed metrics live in
[`data/processed/test_metrics.json`](data/processed/test_metrics.json), and the
complete executed analysis is in [`src/explore.ipynb`](src/explore.ipynb).

## Assignment coverage

- Official 25,000-image dataset with visible nine-cat and nine-dog samples
- Deterministic, stratified 70/15/15 train/validation/test split
- RGB decoding and 200×200 resizing
- Required `EfficientNetB0(include_top=False, weights=None, input_shape=(224, 224, 3))` baseline
- Explicit 200×200-to-224×224 resize bridge between preprocessing and backbone
- Global average pooling, 128-unit ReLU layer, and two-class softmax output
- Explicit transfer-learning optimization using the same architecture
- Training-only augmentation
- `ModelCheckpoint` and `EarlyStopping`
- Final best model saved to `models/best_model.keras`
- Full held-out evaluation, confusion matrix, class metrics, and predictions

## Reproduce

Use Python 3.11 on macOS (Apple Silicon supports `tensorflow-metal`):

```bash
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Place the official archive at `data/raw/dogs-vs-cats.zip`, then run the final
transfer-learning workflow:

```bash
python src/app.py --epochs 8 --batch-size 64
```

To run the literal assignment baseline from random weights:

```bash
python src/app.py --baseline --epochs 8 --batch-size 32
```

To re-evaluate the committed best checkpoint without retraining:

```bash
python src/app.py --evaluate-only --batch-size 64
```

Regenerate and execute the notebook:

```bash
python scripts/build_notebook.py
jupyter nbconvert --to notebook --execute src/explore.ipynb \
  --output explore.ipynb --output-dir src --ExecutePreprocessor.timeout=900
```

Run the lightweight data-split checks:

```bash
pytest
```

Raw and prepared image directories are intentionally ignored because the
official dataset is large and reproducible. The model, executed notebook,
training history, and test evidence are versioned for review.
