import { parseArgs } from "util";
import {
  createAnalysisStream,
  createValidationStream,
  createAnalysisGenerate,
  createValidationGenerate,
} from "../core";
import { displayAnalysisStream, displayValidationStream } from "./display";
import type { TodoItem } from "../core/types/todo-item";

export async function initCli() {
  const { values, positionals } = parseArgs({
    args: Bun.argv,
    options: {
      dir: {
        type: "string",
        short: "d",
      },
      bugDescription: {
        type: "string",
        short: "b",
      },
      diff: {
        type: "string",
        short: "f",
      },
    },
    strict: true,
    allowPositionals: true,
  });

  const targetDir = values.dir;
  let bugDescription = values.bugDescription;
  let diff = values.diff;
  const prompt = positionals[2];

  if (prompt === undefined) {
    throw new Error(
      "No prompt provided. Usage: validate-cli [--dir <target-directory>] --bugDescription <description> --diff <diff> <prompt>"
    );
  }

  if (bugDescription === undefined) {
    throw new Error(
      "No bug description provided. Usage: validate-cli [--dir <target-directory>] --bugDescription <description> --diff <diff> <prompt>"
    );
  }

  if (diff === undefined) {
    throw new Error(
      "No diff provided. Usage: validate-cli [--dir <target-directory>] --bugDescription <description> --diff <diff> <prompt>"
    );
  }

  // Check if bugDescription is a file path and read its contents
  try {
    const file = Bun.file(bugDescription);
    if (await file.exists()) {
      bugDescription = await file.text();
    }
  } catch (error) {
    // If it's not a valid file path, treat it as plain text
    // This allows both file paths and direct text descriptions
  }

  // Check if diff is a file path and read its contents
  try {
    const file = Bun.file(diff);
    if (await file.exists()) {
      diff = await file.text();
    }
  } catch (error) {
    // If it's not a valid file path, treat it as plain text
    // This allows both file paths and direct text descriptions
  }

  const finalTargetDir = targetDir || process.cwd();

  // Phase 1: Generate Analysis Agent (non-streaming)
  console.log("=== PHASE 1: ANALYSIS ===\n");
  const analysisResult = await createAnalysisGenerate(
    finalTargetDir,
    prompt,
    bugDescription,
    diff
  );
  console.log(analysisResult.output);

  console.log("\n=== PHASE 1 COMPLETE ===\n");

  console.log("=== PHASE 2-3: VALIDATION ===\n");
  const validationResult = await createValidationGenerate(
    finalTargetDir,
    prompt,
    bugDescription,
    diff,
    analysisResult.analysisText,
    analysisResult.todoList
  );
  console.log(validationResult.output);

  console.log("\n=== PHASE 2-3 COMPLETE ===\n");
  process.exit(validationResult.result ? 0 : 1);
}
