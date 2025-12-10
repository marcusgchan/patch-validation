# validate-cli

Dependencies:

- bun
- uv

To install dependencies:

```bash
bun install
```

To run evaluations:

Running the evaluation requires having the BugsInPy black project with the correct and incorrect patches setup from [here](https://github.com/sfu-capstone-llm/pyllmvalidate-benchmark). You don't need a running version but you need to generate the good version and the bad version with the mutated code. Once this is setup the BugsInPy repos should look like this:

<img width="117" height="249" alt="image" src="https://github.com/user-attachments/assets/7b945c42-044f-4451-875a-59fe81e10f25" />

Navigate back to patch-validation repo and build the executable:

```bash
bun run build
```

Run evaluations:

```bash
cd evaluations && uv run main.py --output <output-folder>
```

Generate confusion matrix. Make sure you are in the `/evaluations` directory. Then run with `--results` flag:

```bash
uv run main.py --results ./<output-folder>/results.json --output <folder-for-confusion-matrix>
```
