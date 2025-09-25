import { promptLLM } from "../core";
import { getProjectFolderName, getProjectPath } from "../core/util/path";

export async function initCli() {
  const prompt = process.argv[2];
  if (prompt === undefined) {
    throw new Error("No prompt provided");
  }
  console.log(await promptLLM(prompt));
}
