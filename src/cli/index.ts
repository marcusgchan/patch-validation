import { promptLLM } from "../core";
import type {
  GlobToolExecuteReturn,
  GrepToolExecuteReturn,
  LsToolExecuteReturn,
  ReadToolExecuteReturn,
} from "../core/tool";

export async function initCli() {
  const args = process.argv.slice(2);
  let targetDir: string | undefined;
  let prompt: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--dir" || args[i] === "-d") {
      targetDir = args[i + 1];
      i++;
    } else if (!prompt) {
      prompt = args[i];
    }
  }

  if (prompt === undefined) {
    throw new Error(
      "No prompt provided. Usage: validate-cli [--dir <target-directory>] <prompt>",
    );
  }

  const finalTargetDir = targetDir || process.cwd();

  const result = promptLLM(prompt, finalTargetDir);
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
                  : "Reading portion of file",
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
        }
        break;
      }
      case "finish": {
        console.log("\n");
        break;
      }
    }
  }
}
