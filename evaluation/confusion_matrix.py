import json
from pathlib import Path

import matplotlib.pyplot as plt
from sklearn.metrics import confusion_matrix, ConfusionMatrixDisplay


def gen_confusion_matrix(output_dir_str: str, results_file_str: str):
    """
    Generates a confusion matrix from the data in results.json
    and saves it as a PNG image in the specified output directory.
    """
    results_file_path = Path(results_file_str)
    output_dir = Path(output_dir_str)
    output_dir.mkdir(exist_ok=True)

    if not results_file_path.exists():
        raise FileNotFoundError(f"Results file not found: {results_file_path}")

    with open(results_file_path, "r") as f:
        data = json.load(f)

    y_true = data["y_true"]
    y_pred = data["y_pred"]

    labels = sorted(list(set(y_true)))
    cm = confusion_matrix(y_true, y_pred, labels=labels)

    display_labels = ["Buggy", "Correct"]

    disp = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=display_labels)
    disp.plot(cmap=plt.cm.Blues)

    plt.title("Confusion Matrix")
    plt.savefig(output_dir / "confusion_matrix.png")
    plt.close()
    print(f"Confusion matrix saved to {output_dir / 'confusion_matrix.png'}")






