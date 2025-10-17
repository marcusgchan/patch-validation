import { parseArgs } from "util";
import { promptLLM } from "../core";
import type {
  GlobToolExecuteReturn,
  GrepToolExecuteReturn,
  LsToolExecuteReturn,
  ReadToolExecuteReturn,
  FinalAnswerToolExecuteReturn,
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
    },
    strict: true,
    allowPositionals: true,
  });

  console.log("foo");
  const targetDir = values.dir;
  let bugDescription = values.bugDescription;
  const prompt = positionals[2];

  if (prompt === undefined) {
    throw new Error(
      "No prompt provided. Usage: validate-cli [--dir <target-directory>] --bugDescription <description> <prompt>"
    );
  }

  if (bugDescription === undefined) {
    throw new Error(
      "No bug description provided. Usage: validate-cli [--dir <target-directory>] --bugDescription <description> <prompt>"
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

  const finalTargetDir = targetDir || process.cwd();
  const result = promptLLM(prompt, finalTargetDir, bugDescription);
  let exitCode = 0;

  for await (const chunk of result.fullStream) {
    switch (chunk.type) {
      case "text-delta": {
        process.stdout.write(chunk.text);
        break;
      }
      case "tool-call": {
        console.log(`\n🔧 Calling tool: ${chunk.toolName}`);
        // console.log(`Tool call input:`, chunk.input);
        break;
      }
      // TODO: Handle tool errors properly
      // Currently it will keep recalling tool even if the error isn't fixable (e.g. invalid cli args)
      case "tool-error": {
        console.log(`Tool error: ${chunk.error}`);
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

          case "finalAnswer": {
            const data = chunk.output as FinalAnswerToolExecuteReturn;

            exitCode = data.metadata.result ? 0 : 1;

            if (!data.metadata.result) {
              const resultOutput = "REASON:\n" + data.metadata.reason;
              console.error(resultOutput);
            } else {
              console.log("SUCCESS");
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

  process.exit(exitCode);
}
