import { stepCountIs, streamText, hasToolCall } from "ai";
import SYSTEM_PROMPT from "./prompt/system-prompt.txt";
import { openai } from "@ai-sdk/openai";
import { getProjectFolderName, getProjectPath } from "./util/path";
import { createToolSet } from "./tool";

// TODO: Verify dependencies

export function promptLLM(
  prompt: string,
  targetDir: string,
  bugDescription: string,
  diff: string
) {
  if (process.env.OPENAI_API_KEY === undefined) {
    throw new Error("OOPENAI_API_KEY not set");
  }

  // Replace placeholders in system prompt with actual project metadata
  const systemPrompt = SYSTEM_PROMPT.replace(
    "{{FOLDER_NAME}}",
    getProjectFolderName(targetDir)
  ).replace("{{FOLDER_PATH}}", getProjectPath(targetDir));

  const result = streamText({
    model: openai("gpt-4.1"),
    tools: createToolSet(targetDir),
    maxRetries: 0,
    onStepFinish: async () => {
      await Bun.sleep(25000);
    },
    stopWhen: [stepCountIs(1000), hasToolCall("finalAnswer")],
    system: systemPrompt,
    prompt: `Bug Description:\n${bugDescription}\n\nCode Diff:\n${diff}\n\nTest Case:\n${prompt}`,
    temperature: 0,
  });

  return result;
}
