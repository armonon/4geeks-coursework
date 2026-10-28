# StreamLoop churn-model tuning report

## Decision

The final model is the `GridSearchCV` refitted estimator with parameters
`{'classifier__C': 3.1262673090251236, 'classifier__class_weight': 'balanced', 'classifier__fit_intercept': False, 'classifier__solver': 'liblinear'}`. The search metric is **F2 for churners** because a
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
| Recall | 0.5588 | 0.7834 | +0.2246 |
| Precision | 0.6572 | 0.5060 | -0.1512 |
| F1 | 0.6040 | 0.6149 | +0.0109 |
| F2 | 0.5761 | 0.7060 | +0.1299 |
| Accuracy | 0.8055 | 0.7395 | -0.0660 |
| ROC AUC | 0.8419 | 0.8411 | -0.0008 |

## Search process and stability

The broad randomized search evaluated 20 combinations across five stratified
folds with `n_jobs=-1`. Its best region was narrowed into a grid around `C`,
while retaining both class-weight choices. `refit=True` retrained the best grid
candidate automatically; the estimator was not fitted manually afterward.

| Rank | Mean CV F2 | Fold std | Parameters |
|---:|---:|---:|---|
| 1 | 0.7228 | 0.0299 | `{'classifier__C': 3.1262673090251236, 'classifier__class_weight': 'balanced', 'classifier__fit_intercept': False, 'classifier__solver': 'liblinear'}` |
| 2 | 0.7221 | 0.0290 | `{'classifier__C': 1.5631336545125618, 'classifier__class_weight': 'balanced', 'classifier__fit_intercept': False, 'classifier__solver': 'liblinear'}` |
| 3 | 0.7219 | 0.0301 | `{'classifier__C': 4.689400963537685, 'classifier__class_weight': 'balanced', 'classifier__fit_intercept': False, 'classifier__solver': 'liblinear'}` |
| 4 | 0.7217 | 0.0287 | `{'classifier__C': 0.5210445515041873, 'classifier__class_weight': 'balanced', 'classifier__fit_intercept': False, 'classifier__solver': 'liblinear'}` |
| 5 | 0.7213 | 0.0304 | `{'classifier__C': 7.034101445306527, 'classifier__class_weight': 'balanced', 'classifier__fit_intercept': False, 'classifier__solver': 'liblinear'}` |

The selected candidate has mean CV F2 **0.7228 ±
0.0299**. Its fold variation is reported rather than
hiding uncertainty behind one mean. The highest-mean candidate is retained
because its standard deviation is comparable to the neighboring candidates;
there is no evidence that a slightly lower mean buys a meaningful stability
improvement.

## Final hyperparameters

`{'classifier__C': 3.1262673090251236, 'classifier__class_weight': 'balanced', 'classifier__fit_intercept': False, 'classifier__solver': 'liblinear'}`
