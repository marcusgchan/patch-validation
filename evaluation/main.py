import argparse
from pathlib import Path

from confusion_matrix import gen_confusion_matrix
from runner import evaluate


def main():
    parser = argparse.ArgumentParser(description="Validation evaluation and results")
    parser.add_argument(
        "--evaluate",
        action="store_true",
        help="Run evaluation",
    )
    parser.add_argument(
        "--results",
        type=str,
        help="Path to results.json file",
    )
    parser.add_argument(
        "--output",
        "-o",
        default="output",
        help="Output directory for confusion matrix (default: output)",
    )

    args = parser.parse_args()

    if args.results:
        output_dir = Path(args.output)
        results_file = Path(args.results)
        gen_confusion_matrix(str(output_dir), str(results_file))
    elif args.evaluate:
        evaluate(args.output)
    else:
        # Default behavior: run evaluation
        evaluate(args.output)


if __name__ == "__main__":
    main()
