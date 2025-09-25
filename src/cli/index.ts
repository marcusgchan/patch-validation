import { promptLLM } from "../core";
import { getProjectFolderName, getProjectPath } from "../core/util/path";

export async function initCli() {
  const prompt = process.argv[2];
  if (prompt === undefined) {
    throw new Error("No prompt provided");
  }

  const result = promptLLM(prompt);
  for await (const chunk of result.fullStream) {
    switch (chunk.type) {
      case "text-delta": {
        process.stdout.write(chunk.text);
        break;
      }
      case "tool-call": {
        console.log(`\n🔧 Calling tool: ${chunk.toolName}`);
        console.log(`Tool call input:`, chunk.input);
        break;
      }
      // TODO: Handle tool errors properly
      // Currently it will keep recalling tool even if the error isn't fixable (e.g. invalid cli args)
      case "tool-error": {
        console.log(`Tool error: ${chunk.error}`);
        break;
      }
      case "tool-result": {
        console.log(`Tool output:`, chunk.output);
        break;
      }
      case "finish": {
        console.log("\n");
        break;
      }
    }
  }
}
