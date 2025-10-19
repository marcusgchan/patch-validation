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
    DIFFS_PATH = Path("/Users/marcus/repos/pyllmvalidate-benchmark/output")
    OUTPUT_PATH = Path("output")
    RESULTS_FILE = OUTPUT_PATH / "results.json"

    # Create output directory if it doesn't exist
    OUTPUT_PATH.mkdir(exist_ok=True)

    # Load existing results or initialize empty arrays
    y_true, y_pred = load_existing_results(RESULTS_FILE)
    # Ensure API key is available
    get_api_key()

    # Determine starting index and which patch to start with
    num_results = len(y_true)
    test_case_index = num_results // 2  # Which test case we're on
    patch_index = num_results % 2  # 0 = good patch, 1 = bad patch

    print(
        f"Resuming: test case {test_case_index + 1}, starting with {'bad' if patch_index == 1 else 'good'} patch"
    )

    for i in range(test_case_index, 23):
        bug_description = (BUG_DESCRIPTIONS_PATH / Path(f"{i + 1}.txt")).read_text()
        good_path = BUGS_IN_PY_PATH / Path(
            f"framework/bin/temp/black-{i + 1}/good/black"
        )

        testcase = get_testcase(good_path)

        # Determine which patches to test for this test case
        should_test_good = (i == test_case_index and patch_index == 0) or (
            i > test_case_index
        )
        should_test_bad = (i == test_case_index and patch_index == 1) or (
            i > test_case_index
        )

        # Test good patch (if needed)
        if should_test_good:
            diff = DIFFS_PATH / Path(f"{i + 1}/good_patch.txt")
            good_result = run_tool(bug_description, testcase, good_path, diff)
            if good_result.returncode == 3:
                print(f"Tool crash on correct patch #{i + 1}")
                break

            y_pred.append(1 if good_result.returncode == 0 else 0)
            y_true.append(1)

            (OUTPUT_PATH / Path(f"{i + 1}-good-output.txt")).write_text(
                good_result.stdout
            )
            if good_result.stderr:
                (OUTPUT_PATH / Path(f"{i + 1}-good-error.txt")).write_text(
                    good_result.stderr
                )

        # Test bad patch (if needed)
        if should_test_bad:
            diff = DIFFS_PATH / Path(f"{i + 1}/bad_patch.txt")
            bad_path = BUGS_IN_PY_PATH / Path(
                f"framework/bin/temp/black-{i + 1}/bad/black"
            )
            bad_result = run_tool(bug_description, testcase, bad_path, diff)
            if bad_result.returncode == 3:
                print(f"Tool crash on incorrect patch #{i + 1}")
                break
            y_pred.append(1 if bad_result.returncode == 0 else 0)
            y_true.append(0)

            (OUTPUT_PATH / Path(f"{i + 1}-bad-output.txt")).write_text(
                bad_result.stdout
            )
            if bad_result.stderr:
                (OUTPUT_PATH / Path(f"{i + 1}-bad-error.txt")).write_text(
                    bad_result.stderr
                )

        save_results(y_true, y_pred, RESULTS_FILE)
        print(f"Completed case {i + 1}, saved results")

    print(f"Results saved to {RESULTS_FILE}")


def run_tool(
    bug_description: str, testcase: str, path_to_project: Path, diff: Path
) -> subprocess.CompletedProcess:
    result = subprocess.run(
        [
            "./cli",
            "-d",
            str(path_to_project),
            "-b",
            bug_description,
            "--diff",
            diff,
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
