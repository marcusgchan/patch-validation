import { parseArgs } from "util";
import { createAnalysisStream, createValidationStream } from "../core";
import type {
  GlobToolExecuteReturn,
  GrepToolExecuteReturn,
  LsToolExecuteReturn,
  ReadToolExecuteReturn,
  FinalAnswerToolExecuteReturn,
  CreateTodoToolExecuteReturn,
  UpdateTodoToolExecuteReturn,
  TodoItem,
} from "../core/tool";

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
  let exitCode = 0;
  let analysisText = "";
  let todoList: TodoItem[] | null = null;

  // Phase 1: Stream Analysis Agent
  console.log("=== PHASE 1: ANALYSIS ===\n");
  const analysisStream = createAnalysisStream(
    finalTargetDir,
    prompt,
    bugDescription,
    diff
  );
  for await (const chunk of analysisStream.fullStream) {
    switch (chunk.type) {
      case "text-delta": {
        analysisText += chunk.text;
        process.stdout.write(chunk.text);
        break;
      }
      case "tool-call": {
        console.log(`\n🔧 Calling tool: ${chunk.toolName}`);
        break;
      }
      case "tool-error": {
        console.log(`Tool error: ${chunk.error}`);
        break;
      }
      case "error": {
        console.log(`Error: ${chunk.error}`);
        exitCode = 3;
        break;
      }
      case "tool-result": {
        switch (chunk.toolName) {
          case "lsTool": {
            const data = chunk.output as LsToolExecuteReturn;
            console.log(data.title);
            if (data.metadata.truncated) {
              console.log("Showing truncated results:");
            } else {
              console.log(`Showing ${data.metadata.count} result(s):`);
            }
            console.log(data.output);
            break;
          }
          case "readTool": {
            const data = chunk.output as ReadToolExecuteReturn;
            console.log(data.title);
            if (data.type === "SUCCESS") {
              console.log(
                data.metadata.readEntireFile
                  ? "Reading entire file"
                  : "Reading portion of file"
              );
            }
            console.log(data.output);
            break;
          }
          case "globTool": {
            const data = chunk.output as GlobToolExecuteReturn;
            console.log(data.title);
            console.log(data.output);
            break;
          }
          case "grepTool": {
            const data = chunk.output as GrepToolExecuteReturn;
            console.log(data.title);
            console.log(data.output);
            break;
          }
          case "createTodo": {
            const data = chunk.output as CreateTodoToolExecuteReturn;
            todoList = data.metadata.todos;
            console.log(data.title);
            console.log(data.output);
            break;
          }
        }
        break;
      }
      case "finish": {
        console.log("\n");
        break;
      }
    }
  }

  console.log("\n=== PHASE 1 COMPLETE ===\n");

  console.log("=== PHASE 2-3: VALIDATION ===\n");
  if (!todoList) {
    throw new Error(
      "Analysis phase did not produce a todo list. The analysis agent must call createTodo."
    );
  }
  const validationStream = createValidationStream(
    finalTargetDir,
    prompt,
    bugDescription,
    diff,
    analysisText,
    todoList
  );

  for await (const chunk of validationStream.fullStream) {
    switch (chunk.type) {
      case "text-delta": {
        process.stdout.write(chunk.text);
        break;
      }
      case "tool-call": {
        console.log(`\n🔧 Calling tool: ${chunk.toolName}`);
        break;
      }
      case "tool-error": {
        console.log(`Tool error: ${chunk.error}`);
        break;
      }
      case "error": {
        console.log(`Error: ${chunk.error}`);
        exitCode = 3;
        break;
      }
      case "tool-result": {
        switch (chunk.toolName) {
          case "lsTool": {
            const data = chunk.output as LsToolExecuteReturn;
            console.log(data.title);
            if (data.metadata.truncated) {
              console.log("Showing truncated results:");
            } else {
              console.log(`Showing ${data.metadata.count} result(s):`);
            }
            console.log(data.output);
            break;
          }
          case "readTool": {
            const data = chunk.output as ReadToolExecuteReturn;
            console.log(data.title);
            if (data.type === "SUCCESS") {
              console.log(
                data.metadata.readEntireFile
                  ? "Reading entire file"
                  : "Reading portion of file"
              );
            }
            console.log(data.output);
            break;
          }
          case "globTool": {
            const data = chunk.output as GlobToolExecuteReturn;
            console.log(data.title);
            console.log(data.output);
            break;
          }
          case "grepTool": {
            const data = chunk.output as GrepToolExecuteReturn;
            console.log(data.title);
            console.log(data.output);
            break;
          }
          case "updateTodo": {
            const data = chunk.output as UpdateTodoToolExecuteReturn;
            console.log(data.title);
            console.log(data.output);
            break;
          }
          case "finalAnswer": {
            const data = chunk.output as FinalAnswerToolExecuteReturn;
            exitCode = data.metadata.result ? 0 : 1;
            const reason = "REASON:\n" + data.metadata.reason;
            if (!data.metadata.result) {
              console.log(`INCORRECT\n${reason}`);
            } else {
              console.log(`CORRECT\n${reason}`);
            }
          }
        }
        break;
      }
      case "finish": {
        console.log("\n");
        break;
      }
    }
  }

  console.log("\n=== PHASE 2-3 COMPLETE ===\n");
  process.exit(exitCode);
}
