import { stepCountIs, streamText } from "ai";
import SYSTEM_PROMPT from "./prompt/system-prompt.txt";
import { openai } from "@ai-sdk/openai";
import { getProjectFolderName, getProjectPath } from "./util/path";
import { createToolSet } from "./tool";

// TODO: Verify dependencies

export function promptLLM(prompt: string, targetDir: string) {
  if (process.env.OPENAI_API_KEY === undefined) {
    throw new Error("OOPENAI_API_KEY not set");
  }

  // Replace placeholders in system prompt with actual project metadata
  const systemPrompt = SYSTEM_PROMPT.replace(
    "{{FOLDER_NAME}}",
    getProjectFolderName(targetDir)
  ).replace("{{FOLDER_PATH}}", getProjectPath(targetDir));
  console.log({ prompt });
  const result = streamText({
    model: openai("gpt-4.1"),
    tools: createToolSet(targetDir),
    // prepareStep: async (p) => {
    //   p.steps[0]?.
    //   return {toolChoice: {toolName}}
    // },
    maxRetries: 0,
    stopWhen: [
      stepCountIs(20),
      //  hasToolCall("finalAnswer")
    ],
    system: systemPrompt,
    prompt: prompt,
    temperature: 0,
  });

  return result;
}
