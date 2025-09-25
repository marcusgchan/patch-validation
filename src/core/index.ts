import { generateText, hasToolCall, stepCountIs, streamText } from "ai";
import { grepTool } from "./tool/grep";
import SYSTEM_PROMPT from "./prompt/system-prompt.txt";
import { openai } from "@ai-sdk/openai";
import { globTool } from "./tool/glob";
import { readTool } from "./tool/read";
import { lsTool } from "./tool/ls";
import { getProjectFolderName, getProjectPath } from "./util/path";
import z from "zod";

// TODO: Verify dependencies

export function promptLLM(prompt: string) {
  if (process.env.OPENAI_API_KEY === undefined) {
    throw new Error("OOPENAI_API_KEY not set");
  }

  // Replace placeholders in system prompt with actual project metadata
  const systemPrompt = SYSTEM_PROMPT.replace(
    "{{FOLDER_NAME}}",
    getProjectFolderName()
  ).replace("{{FOLDER_PATH}}", getProjectPath());

  const result = streamText({
    model: openai("gpt-4.1"),
    tools: {
      grepTool,
      globTool,
      lsTool,
      readTool,
      // finalAnswer: {
      //   description: "Provide the final answer to the user",
      //   inputSchema: z.object({
      //     answer: z.string(),
      //   }),
      //   execute: async ({ answer }) => answer,
      // },
    },
    maxRetries: 0,
    stopWhen: [
      stepCountIs(5),
      //  hasToolCall("finalAnswer")
    ],
    system: systemPrompt,
    prompt: prompt,
  });

  return result;
}
