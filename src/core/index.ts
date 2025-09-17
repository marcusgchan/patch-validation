import { generateText, stepCountIs } from "ai";
import { grepTool } from "./tool/grep";
import SYSTEM_PROMPT from "./prompt/system-prompt.txt";
import { openai } from "@ai-sdk/openai";
import { globTool } from "./tool/glob";
import { readTool } from "./tool/read";

export async function validate() {
  const { text, steps } = await generateText({
    model: openai("gpt-5-nano"),
    tools: {
      grepTool,
      globTool,
      readTool,
    },
    stopWhen: stepCountIs(10),
    system: SYSTEM_PROMPT,
    prompt: "",
  });
}
