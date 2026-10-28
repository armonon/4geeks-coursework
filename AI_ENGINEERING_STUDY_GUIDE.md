# AI Engineering Assessment Study Guide

This is a living summary of the course concepts demonstrated by the completed
projects. It is written for review before an assessment: explain the idea, state
the engineering trade-off, and connect it to evidence in the repository.

## Current Models Training & RAG project queue

| Project | Main skill | Required home | Status |
| --- | --- | --- | --- |
| WeLoveReviews sentiment analysis | Integrate and validate a pretrained model | Standalone ML template | Complete |
| Image classifier | Supervised image classification | Standalone course template | Complete |
| K-means project | Unsupervised clustering | Standalone course template | Complete |
| Sales forecasting | Regression and time-aware data | Company monorepo | Complete |
| Regression evaluation | Cross-validation and learning curves | Company monorepo | Complete |
| StreamLoop churn tuning | Search spaces and stable hyperparameter tuning | Standalone Python template | Complete |
| Milestone 7 — RAG knowledge base | Retrieval, Qdrant, generation, API, UI | Company monorepo | Complete |

The RAG milestone appears in two syllabus modules but is one unique assignment.

## 1. Using pretrained models

### What the course is teaching

A pretrained model is a reusable learned function. Instead of collecting labels
and training from zero, an engineer selects a model whose task, language, license,
and training domain fit the problem, then validates it on the real application
data. “It runs” is not evidence that it is appropriate.

### Assessment-ready explanation

- **Model parameters** are learned during training. **Hyperparameters** are chosen
  by the engineer and control learning or model behavior.
- A model card describes intended use, training data, limitations, labels, and
  license. It is part of the engineering evidence, not marketing copy.
- Pin both the Python dependency and the model revision. A name that silently
  resolves to a newer checkpoint is not reproducible.
- Load an expensive model once and reuse it for batched inputs. Loading inside a
  per-row loop wastes time and memory.
- Never commit downloaded weights unless the project and license explicitly call
  for it. Let the model hub cache them locally.

### Evidence from WeLoveReviews

The project uses `nlptown/bert-base-multilingual-uncased-sentiment` at immutable
revision `8f6f4e3a8f70be4b65d3a4a8762b6d781cda240d`. It maps model stars 1–2 to
negative, 3 to neutral, and 4–5 to positive. One classifier instance processes
all 500 reviews in batches.

## 2. Data preparation

### What to check before modeling

1. Define the unit of observation and required columns.
2. Check row count, types, missing values, duplicates, unique IDs, and valid
   ranges.
3. Examine target balance and representative raw examples.
4. Measure feature distributions, including text length when token limits matter.
5. Change data only when there is a documented reason. “Cleaning” is not a goal
   by itself.

For supervised learning, split data before learning transformations. Fit
imputation, scaling, encoding, and feature selection only on the training data;
otherwise information from validation or test data leaks into training.

### WeLoveReviews decision

All 500 rows had unique IDs, complete text, valid 1–5 ratings, and no duplicate
rows. Reviews were short enough for the chosen token limit. The correct cleaning
decision was therefore to preserve every row.

## 3. Classification

Classification predicts a category or category probability. Choose metrics from
the cost of mistakes:

- **Accuracy:** useful when classes and mistake costs are reasonably balanced.
- **Precision:** among predicted positives, how many were correct? Prioritize it
  when false positives are expensive.
- **Recall:** among real positives, how many were found? Prioritize it when false
  negatives are expensive.
- **F1:** harmonic mean of precision and recall; useful when both matter.
- **Confusion matrix:** the count of each error type; always inspect it before
  trusting one summary number.

Logistic regression is a strong interpretable baseline. Decision trees capture
nonlinear rules but overfit easily. Random forests reduce tree variance through
bagging; gradient boosting builds trees sequentially to correct earlier errors.

### Image-classification evidence

The cats-vs-dogs project uses a deterministic, class-balanced 70/15/15 split of
25,000 labeled images. Keras decodes the source photographs to 200×200 RGB, then
an explicit resize layer supplies the rubric's required 224×224×3 input to an
EfficientNet-B0 backbone. Training-only flips, rotations, and zooms improve
robustness without altering validation or test data.

The literal baseline starts EfficientNet from random weights. The final model
uses transfer learning: ImageNet features are frozen and a new global-pooling,
128-unit ReLU, and two-class softmax head is trained. This preserves the required
architecture while making training practical and data-efficient. A checkpoint
keeps the best validation model; early stopping prevents unproductive overfitting.

On 3,750 untouched test images, the model reached **99.20% accuracy** with only
30 errors. Cat F1 and dog F1 are both approximately **0.992**, demonstrating
balanced performance rather than an accuracy result caused by class imbalance.
The confusion matrix is `[[1866, 9], [21, 1854]]`.

Key assessment distinction: **data preprocessing** standardizes input shape;
**augmentation** adds plausible training variation; **transfer learning** reuses
learned visual features; and **fine-tuning** would later unfreeze selected
pretrained layers at a small learning rate.

### Unsupervised learning and K-means evidence

Unsupervised learning discovers structure without human-provided target labels.
K-means assigns each row to the nearest centroid, recalculates centroids, and
repeats until assignments stabilize. Its objective (inertia) is the sum of
squared distances to the assigned centroids. Lower inertia alone cannot choose
the number of groups because it always decreases as more clusters are added.

The California Housing project uses latitude, longitude, and median income.
These features have different units, so a `StandardScaler` is fit on training
data inside the clustering pipeline. The required six-cluster K-means is also
fit only on training rows; test rows receive labels from `predict`, preventing
the test set from influencing the centroids.

The sampled silhouette score is **0.4012**. Silhouette compares within-cluster
cohesion with separation from the nearest other cluster: values near 1 are well
separated, near 0 overlap, and below 0 may be assigned poorly. Here, moderate
overlap is plausible because geography and income form continuous populations,
not perfect spherical blobs.

K-means-generated labels then become pseudo-labels for supervised learning.
Five-fold training-only validation selects a random forest over logistic
regression. On 4,128 held-out rows it reproduces the clusters with **99.49%
accuracy** and **0.9933 macro F1**. This high score measures agreement with the
clustering rule—not objective correctness or social meaning. Cluster numbers are
arbitrary category IDs, and responsible use requires stability and impact review.

## 4. Regression and time series

Regression predicts a continuous value. MAE is easy to explain in original
units and is less sensitive to extreme errors. RMSE penalizes large misses more
heavily. The right metric follows the business cost, not habit.

Time series data cannot be randomly shuffled when future observations would
enter training for a past prediction. Use chronological splits or expanding-window
cross-validation. Inspect trend, seasonality, outliers, variance changes, and
autocorrelation. A naïve baseline such as “tomorrow equals today” is essential;
a complex model that cannot beat it is not useful.

### TrackFlow sales-forecasting evidence

The TrackFlow model uses the official 120 consolidated monthly revenue records
from 2016–2025. The first eight source years belong to training and 2024–2025
remain held out. A lag-12 feature consumes the first year, leaving 84 usable
training rows and all 24 test rows. Lag and rolling features are shifted so a
row never uses its own target or any later revenue value. Calendar sine/cosine,
quarter, a briefing-defined alternating growth cycle, and a time index express
known seasonal and growth structure without leaking the test target.

The estimator is a Random Forest seasonal-residual model: it predicts the
correction to the same month one year earlier and then adds that correction to
lag-12 revenue. This design retains an explainable tree model while avoiding a
plain Random Forest's inability to extrapolate beyond historical target values.
The saved pipeline fits its scaler and forest on training rows only.

On the untouched 2024–2025 period, the model achieved **€56,047 RMSE**, or
**4.31% of average test revenue**, compared with **€93,184** for the seasonal
naïve baseline. MAE was **€44,677**, R² was **0.8927**, and normalized Gini was
**0.9227**. Residual normality was not rejected (K² = **0.2660**, p = **0.8754**).
PSI was **9.2454**, correctly warning that persistent company growth shifted the
test revenue distribution far beyond ordinary stability thresholds. That drift
warning must not be hidden merely because predictive error is good.

The ±1 tree-standard-deviation band covered 50% of test observations. It is a
model-variability visualization—not a calibrated 95% prediction interval. This
distinction matters whenever uncertainty is communicated to decision-makers.

Assessment-ready lesson: preserve chronology, compute features causally, fit
preprocessing on training data only, compare against a meaningful baseline, and
interpret multiple metrics in business terms. A good error score does not erase
distribution shift or make an uncalibrated uncertainty band probabilistic.

## 5. Evaluating a trained model

- Keep a final test set untouched until model selection is finished.
- Use cross-validation on training data to estimate variation, reporting mean
  **and** standard deviation across folds.
- A large training/validation gap suggests overfitting. Poor scores on both
  suggest underfitting.
- A learning curve plots performance against training-set size. Converged poor
  curves suggest the model or features need more capacity; a persistent gap
  suggests regularization, simplification, or more data may help.
- Evaluate slices that matter to the real system, not only the global average.

### TrackFlow evaluation evidence

The final 2024–2025 holdout is not reused for diagnosis or corrective-model
selection. Instead, the 2017–2023 usable training matrix is evaluated with five
expanding windows; every fold trains on earlier months and validates on the
next 12. Each validation feature is recomputed from a raw prefix ending at its
month, proving that lags and rolling statistics never read the current target
or a future row. This is a rolling-origin one-month-ahead evaluation.

Across the five folds, training RMSE was **€17,585 ± €3,145** and validation
RMSE was **€54,296 ± €14,435**. Training MAE was **€13,678 ± €2,113** and
validation MAE was **€44,701 ± €12,900**. The persistent learning-curve gap
supports an explicit diagnosis of **moderate overfitting**, not underfitting or
a well-fitted model.

RMSE is primary because large misses during TrackFlow's November–December peaks
can create disproportionately expensive warehouse and carrier shortages. MAE
is still reported because it communicates a typical miss in EUR. Mean without
standard deviation would hide how much performance changes with the training
era; a single split is not enough evidence of stability.

The corrective action follows the diagnosis: increase `min_samples_leaf` above
2 and lower `max_depth` below 8, choosing the smallest variance-reducing change
through those same temporal folds. Do not add model complexity—that would make
the diagnosed variance problem worse—and do not choose settings on the final
test period.

## 6. Hyperparameter tuning

Create a defensible search space from model behavior. Use a broad randomized
search to find promising regions, then a narrow grid search for refinement.
Search only on training folds and preserve a held-out test set for the final
estimate. Inspect `cv_results_`: one winning mean with unstable folds may be a
worse choice than a slightly lower but consistent model.

Put preprocessing and the estimator in one scikit-learn `Pipeline` so every fold
learns transformations only from its own training partition.

### StreamLoop tuning evidence

StreamLoop uses an 80/20 stratified split of 7,043 customers. The test set is
evaluated exactly twice: once for the untouched default Logistic Regression
baseline and once for the final `GridSearchCV` estimator. Median imputation,
standardization, most-frequent imputation, and one-hot encoding all live inside
the pipeline, so each cross-validation fold learns them from only its training
rows.

The broad `RandomizedSearchCV` explores 20 combinations of regularization
strength, class weighting, intercept, and solver across five stratified folds.
The best region then seeds a 14-candidate `GridSearchCV`; `refit=True` retrains
the winner automatically. The top candidates are compared by fold mean and
standard deviation, not mean alone.

Pure recall initially appeared attractive because false negatives are more
expensive, but optimizing it without a precision constraint rewarded movement
toward an all-positive classifier. The corrected search uses **F2**: recall has
four times precision's weight in the harmonic mean, so it reflects the business
priority while still penalizing indiscriminate retention offers.

On the held-out test set, recall increased from **0.5588 to 0.7834** and F2 from
**0.5761 to 0.7060**. F1 rose from **0.6040 to 0.6149**; ROC AUC stayed nearly
flat (**0.8419 to 0.8411**). Precision fell from **0.6572 to 0.5060** and
accuracy from **0.8055 to 0.7395**. This is an intentional operating-point
trade-off, not something to hide: more real churners are found at the cost of
more unnecessary offers.

The selected candidate's cross-validated F2 is **0.7228 ± 0.0299**. Its fold
variation is comparable with nearby candidates, so the highest mean is a
defensible choice. If a slightly lower-mean candidate had been substantially
more stable, choosing it would also have been defensible—but that was not the
evidence here.

## 7. Model integration and monitoring

A model in production needs a stable input/output contract, validation, useful
errors, version metadata, and tests around preprocessing and label mapping.
Monitor:

- completion and failure rate;
- latency and resource use;
- volume and input distribution;
- prediction distribution and confidence;
- delayed quality labels and drift when ground truth becomes available.

WeLoveReviews demonstrates why monitoring by aggregate output alone is unsafe:
the model reached 95% band agreement yet produced 16 false negatives among
high-rated reviews.

## 8. RAG and knowledge bases

RAG augments a language model with retrieved evidence at query time:

1. ingest documents;
2. split them into meaningful chunks;
3. embed each chunk as a vector;
4. store vectors plus source metadata;
5. embed the user query;
6. retrieve the most similar chunks above a threshold;
7. generate an answer constrained by that context;
8. return sources so the answer can be audited.

Chunk size and overlap trade context completeness against retrieval precision and
cost. Similarity search must have a threshold or explicit “insufficient evidence”
path. RAG reduces unsupported answers but does not eliminate them; evaluate both
retrieval quality and answer faithfulness. Protect ingestion from untrusted or
poisoned content.

### TrackFlow RAG evidence

The TrackFlow knowledge base ingests four approved policy documents into the
exact `trackflow_knowledge` Qdrant collection. Paragraph-level semantic
chunking produces 18 points, at least three per document. Every point stores
company, source document, section, language, chunk index, and text. UUIDv5 point
IDs plus clear-and-reload setup make ingestion repeatable without duplicates.

Production configuration uses two distinct models through the 4Geeks
OpenAI-compatible gateway: `pplx-embed-v1-0.6b` for embeddings and
`llama-3.1-8b-instant` for generation. The loader detects vector dimensions and
rejects inconsistent results; code rejects using one model ID for both jobs.
Qdrant uses cosine similarity, top-five retrieval, and a configurable minimum
score. The `/knowledge/query` endpoint requires the existing bearer-token
session and returns only the answer, not raw chunks, prompts, or provider errors.

The system prompt permits only retrieved evidence and restates the highest-risk
company rules: no promised SLA during Black Friday, Christmas, or January Sales;
international returns are manual; storage discounts require Miguel Torres's
approval. No relevant context means an explicit insufficient-information answer,
not a guess. The protected backoffice page provides loading, answer, and readable
failure states in both light and dark themes.

The retrieval golden set has twelve questions spanning all four documents and
the high-demand-period exception. It achieved **12/12 Recall@3 (100%)** through
the production Qdrant code path with a deterministic offline CI encoder. A live
local end-to-end run used `nomic-embed-text` and `qwen2.5:7b` as distinct models;
it retrieved the high-demand policy first and correctly refused to promise a
Black Friday SLA, explaining the possible 40% extension.

Assessment-ready lesson: RAG quality is two separate questions—did retrieval
find the right evidence, and did generation remain faithful to it? Measure both,
preserve source metadata, keep setup idempotent, separate embedding from
generation, and choose safe failure over an ungrounded answer.

## 9. One-minute assessment recap

- **Pretrained models:** select from a model card, pin versions, batch work, and
  validate domain fit on real application data.
- **Classification:** choose metrics from the cost of false positives and false
  negatives; inspect the confusion matrix rather than trusting accuracy alone.
- **Unsupervised learning:** scaling changes distances; silhouette measures
  separation; cluster labels are arbitrary and are not ground truth.
- **Regression and time series:** preserve chronology, shift lag features, beat
  a naïve baseline, and keep the final test period untouched during selection.
- **Evaluation:** report cross-validation mean and spread; diagnose training vs
  validation gaps; make corrective action match overfitting or underfitting.
- **Tuning:** keep preprocessing inside the pipeline, search training folds only,
  and choose an objective such as F2 that represents the real business trade-off.
- **Production ML:** define contracts, versions, monitoring, drift signals, and
  useful failures; a saved model without those boundaries is not a system.
- **RAG:** evaluate retrieval and faithfulness separately, preserve citations and
  metadata, use thresholds, and refuse to answer when approved evidence is absent.

## WeLoveReviews results to remember

- Human rating average: **4.5 / 5**
- Predicted sentiment: **82.4% positive, 8.2% neutral, 9.4% negative**
- Human/model band agreement: **95%**
- Star-level mean absolute error: **0.23**
- High-rating false negatives: **16**, or **3.7%** of 4–5-star reviews
- Repeated failure pattern: positive café phrases such as “bursting with flavor,”
  plus mixed service comments, were poorly handled by a product-review model.

The practical lesson is not “BERT is bad.” It is that domain mismatch must be
measured on application data, confidence should inform human review, and client
conclusions need error analysis rather than a single aggregate percentage.
