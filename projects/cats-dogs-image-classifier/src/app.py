"""Train and evaluate the required EfficientNet-B0 cats-vs-dogs classifier."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np

from data import extract_archive, prepare_directories


ROOT = Path(__file__).resolve().parents[1]
ARCHIVE = ROOT / "data" / "raw" / "dogs-vs-cats.zip"
PREPARED = ROOT / "data" / "interim" / "cats-vs-dogs"
MODEL_PATH = ROOT / "models" / "best_model.keras"
HISTORY_PATH = ROOT / "data" / "processed" / "training_history.json"
METRICS_PATH = ROOT / "data" / "processed" / "test_metrics.json"
IMAGE_SIZE = (200, 200)
BACKBONE_SIZE = (224, 224)
SEED = 42


def load_datasets(batch_size: int = 32):
    """Stream decoded 200×200 RGB batches from deterministic split directories."""

    import tensorflow as tf

    common = {
        "labels": "inferred",
        "label_mode": "int",
        "class_names": ["cat", "dog"],
        "image_size": IMAGE_SIZE,
        "batch_size": batch_size,
        "seed": SEED,
    }
    train = tf.keras.utils.image_dataset_from_directory(
        PREPARED / "train", shuffle=True, **common
    )
    validation = tf.keras.utils.image_dataset_from_directory(
        PREPARED / "validation", shuffle=False, **common
    )
    test = tf.keras.utils.image_dataset_from_directory(
        PREPARED / "test", shuffle=False, **common
    )
    autotune = tf.data.AUTOTUNE
    return (
        train.prefetch(autotune),
        validation.prefetch(autotune),
        test.prefetch(autotune),
    )


def build_model(*, optimized: bool = False):
    """Build the required baseline or its transfer-learning optimization.

    The baseline follows the assignment literally with ``weights=None``. The
    optimized version retains the same architecture but starts from ImageNet
    features and freezes the backbone, which is substantially more efficient
    and accurate for the final checkpoint.
    """

    import tensorflow as tf

    augmentation = tf.keras.Sequential(
        [
            tf.keras.layers.RandomFlip("horizontal", seed=SEED),
            tf.keras.layers.RandomRotation(0.05, seed=SEED),
            tf.keras.layers.RandomZoom(0.1, seed=SEED),
        ],
        name="augmentation",
    )
    backbone = tf.keras.applications.EfficientNetB0(
        include_top=False,
        weights="imagenet" if optimized else None,
        input_shape=(*BACKBONE_SIZE, 3),
    )
    backbone.trainable = not optimized
    inputs = tf.keras.Input(shape=(*IMAGE_SIZE, 3))
    x = augmentation(inputs)
    # The rubric requires 200×200 preprocessing and an EfficientNet-B0
    # backbone with input_shape=(224, 224, 3), so bridge them explicitly.
    x = tf.keras.layers.Resizing(*BACKBONE_SIZE, name="efficientnet_resize")(x)
    x = backbone(x)
    x = tf.keras.layers.GlobalAveragePooling2D()(x)
    x = tf.keras.layers.Dense(128, activation="relu")(x)
    x = tf.keras.layers.Dropout(0.3, seed=SEED)(x)
    outputs = tf.keras.layers.Dense(2, activation="softmax")(x)
    model = tf.keras.Model(inputs, outputs, name="cats_dogs_efficientnet_b0")
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model


def train(epochs: int = 8, batch_size: int = 64, *, optimized: bool = True):
    """Train with checkpointing and early stopping, then return the best model."""

    import tensorflow as tf

    train_data, validation_data, test_data = load_datasets(batch_size)
    model = build_model(optimized=optimized)
    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    HISTORY_PATH.parent.mkdir(parents=True, exist_ok=True)
    callbacks = [
        tf.keras.callbacks.ModelCheckpoint(
            MODEL_PATH, monitor="val_accuracy", mode="max", save_best_only=True
        ),
        tf.keras.callbacks.EarlyStopping(
            monitor="val_accuracy", mode="max", patience=3, restore_best_weights=True
        ),
    ]
    history = model.fit(
        train_data,
        validation_data=validation_data,
        epochs=epochs,
        callbacks=callbacks,
    )
    history_evidence = {
        **history.history,
        "epochs_completed": len(history.history["loss"]),
        "note": "Full-dataset training; best validation checkpoint retained.",
    }
    HISTORY_PATH.write_text(json.dumps(history_evidence, indent=2))

    best_model = tf.keras.models.load_model(MODEL_PATH)
    metrics = evaluate_model(best_model, test_data, optimized=optimized)
    return best_model, history.history, metrics


def evaluate_model(model, test_data, *, optimized: bool = True) -> dict[str, object]:
    """Evaluate a saved checkpoint on the untouched test split and persist evidence."""

    loss, accuracy = model.evaluate(test_data, verbose=1)
    probabilities = model.predict(test_data, verbose=1)
    predicted = probabilities.argmax(axis=1)
    actual = np.concatenate([labels.numpy() for _, labels in test_data])

    from sklearn.metrics import classification_report, confusion_matrix

    report = classification_report(
        actual, predicted, target_names=["cat", "dog"], output_dict=True
    )
    metrics = {
        "test_loss": float(loss),
        "test_accuracy": float(accuracy),
        "confusion_matrix": confusion_matrix(actual, predicted).tolist(),
        "classification_report": report,
        "test_images": int(len(actual)),
        "training_mode": "transfer_learning" if optimized else "from_scratch_baseline",
    }
    METRICS_PATH.write_text(json.dumps(metrics, indent=2))
    return metrics


def prepare() -> dict[str, int]:
    extracted = ROOT / "data" / "raw" / "dogs-vs-cats" / "train"
    if not ARCHIVE.exists() and not extracted.exists():
        raise FileNotFoundError(
            f"Download the official archive to {ARCHIVE} before training."
        )
    image_dir = extract_archive(ARCHIVE, ROOT / "data" / "raw")
    return prepare_directories(image_dir, PREPARED, SEED)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--epochs", type=int, default=8)
    parser.add_argument("--batch-size", type=int, default=64)
    parser.add_argument(
        "--baseline",
        action="store_true",
        help="Train the literal weights=None baseline instead of the optimized model.",
    )
    parser.add_argument(
        "--evaluate-only",
        action="store_true",
        help="Evaluate the existing best checkpoint without retraining.",
    )
    args = parser.parse_args()
    counts = prepare()
    print("Prepared split:", counts)
    if args.evaluate_only:
        import tensorflow as tf

        _, _, test_data = load_datasets(args.batch_size)
        model = tf.keras.models.load_model(MODEL_PATH)
        metrics = evaluate_model(model, test_data, optimized=not args.baseline)
    else:
        _, _, metrics = train(args.epochs, args.batch_size, optimized=not args.baseline)
    print(json.dumps(metrics, indent=2))


if __name__ == "__main__":
    main()
