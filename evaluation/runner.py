import json
import os
import subprocess
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

prompt_template = "Bug Description:\n{bug_description}\nTest Case:\n{testcase}"


# for each patch
#   go to good patch
#   run tool
#   store results
#
#   go to bad patch
#   run tool
#   store results
def evaluate():
    BUGS_IN_PY_PATH = Path("/Users/marcus/repos/BugsInPy")
    BUG_DESCRIPTIONS_PATH = Path(
        "/Users/marcus/repos/pyllmvalidate-benchmark/descriptions"
    )
    OUTPUT_PATH = Path("output")
    RESULTS_FILE = OUTPUT_PATH / "results.json"

    # Create output directory if it doesn't exist
    OUTPUT_PATH.mkdir(exist_ok=True)

    # Load existing results or initialize empty arrays
    y_true, y_pred = load_existing_results(RESULTS_FILE)
    # Ensure API key is available
    get_api_key()

    # Determine starting index based on existing results
    start_index = len(y_true)
    print(f"Starting from index {start_index} (resuming from previous run)")

    for i in range(start_index, 23):
        bug_description = (BUG_DESCRIPTIONS_PATH / Path(f"{i + 1}.txt")).read_text()
        good_path = BUGS_IN_PY_PATH / Path(
            f"framework/bin/temp/black-{i + 1}/good/black"
        )
        bad_path = BUGS_IN_PY_PATH / Path(f"framework/bin/temp/black-{i + 1}/bad/black")

        testcase = get_testcase(good_path)

        # Test good patch
        print("running")
        good_result = run_tool(bug_description, testcase, good_path)
        print("finished running")
        y_pred.append(1 if good_result.returncode == 0 else 0)
        y_true.append(1)

        (OUTPUT_PATH / Path(f"{i + 1}-good-output.txt")).write_text(good_result.stdout)
        if good_result.stderr:
            (OUTPUT_PATH / Path(f"{i + 1}-good-error.txt")).write_text(
                good_result.stderr
            )

        # Test bad patch
        bad_result = run_tool(bug_description, testcase, bad_path)
        y_pred.append(1 if bad_result.returncode == 0 else 0)
        y_true.append(0)

        (OUTPUT_PATH / Path(f"{i + 1}-bad-output.txt")).write_text(bad_result.stdout)
        if bad_result.stderr:
            (OUTPUT_PATH / Path(f"{i + 1}-bad-error.txt")).write_text(bad_result.stderr)

        save_results(y_true, y_pred, RESULTS_FILE)
        print(f"  Completed case {i + 1}, saved results")

        break

    print(f"Evaluation complete! Final results saved to {RESULTS_FILE}")
    print(f"Total tests: {len(y_true)}")


def run_tool(
    bug_description: str, testcase: str, path_to_project: Path
) -> subprocess.CompletedProcess:
    result = subprocess.run(
        [
            "./cli",
            "-d",
            str(path_to_project),
            "-b",
            bug_description,
            testcase,
        ],
        text=True,
        capture_output=True,
    )
    return result


def get_testcase(project_path: Path) -> str:
    test_execution_file = project_path / Path("bugsinpy_run_test.sh")

    # first line if more than one
    line = "".join(test_execution_file.read_text().strip().split("\n")[:1])

    last_segment = line.strip().split(" ")[-1]
    last_dot = last_segment.rfind(".")
    return last_segment[last_dot + 1 :]


def load_existing_results(results_file: Path) -> tuple[list[int], list[int]]:
    """Load existing results from JSON file or return empty lists."""
    if results_file.exists():
        try:
            with open(results_file, "r") as f:
                data = json.load(f)
                return data.get("y_true", []), data.get("y_pred", [])
        except (json.JSONDecodeError, KeyError) as e:
            print(f"Warning: Could not load existing results: {e}")
            return [], []
    return [], []


def save_results(y_true: list[int], y_pred: list[int], results_file: Path) -> None:
    """Save results to JSON file in the specified format."""
    data = {"y_true": y_true, "y_pred": y_pred}
    with open(results_file, "w") as f:
        json.dump(data, f, indent=2)


def get_api_key():
    key = os.environ.get("OPENAI_API_KEY")
    if key is None:
        raise Exception("Missing API_KEY in .env in /evaluation")

    return key
