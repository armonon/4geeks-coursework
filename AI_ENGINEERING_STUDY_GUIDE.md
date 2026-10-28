# AI Engineering Assessment Study Guide

This is a living summary of the course concepts demonstrated by the completed
projects. It is written for review before an assessment: explain the idea, state
the engineering trade-off, and connect it to evidence in the repository.

## Current Models Training & RAG project queue

| Project | Main skill | Required home | Status |
| --- | --- | --- | --- |
| WeLoveReviews sentiment analysis | Integrate and validate a pretrained model | Standalone ML template | Complete |
| Image classifier | Supervised image classification | Standalone course template | Complete |
| K-means project | Unsupervised clustering | Standalone course template | Next |
| Sales forecasting | Regression and time-aware data | Standalone course template | Queued |
| Regression evaluation | Cross-validation and learning curves | Company coursework | Queued |
| StreamLoop churn tuning | Search spaces and stable hyperparameter tuning | Standalone Python template | Queued |
| Milestone 7 — RAG knowledge base | Retrieval, Qdrant, generation, API, UI | Company monorepo | Queued |

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

## 4. Regression and time series

Regression predicts a continuous value. MAE is easy to explain in original
units and is less sensitive to extreme errors. RMSE penalizes large misses more
heavily. The right metric follows the business cost, not habit.

Time series data cannot be randomly shuffled when future observations would
enter training for a past prediction. Use chronological splits or expanding-window
cross-validation. Inspect trend, seasonality, outliers, variance changes, and
autocorrelation. A naïve baseline such as “tomorrow equals today” is essential;
a complex model that cannot beat it is not useful.

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

## 6. Hyperparameter tuning

Create a defensible search space from model behavior. Use a broad randomized
search to find promising regions, then a narrow grid search for refinement.
Search only on training folds and preserve a held-out test set for the final
estimate. Inspect `cv_results_`: one winning mean with unstable folds may be a
worse choice than a slightly lower but consistent model.

Put preprocessing and the estimator in one scikit-learn `Pipeline` so every fold
learns transformations only from its own training partition.

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
