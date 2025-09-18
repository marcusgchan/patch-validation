import { generateText, stepCountIs } from "ai";
import { grepTool } from "./tool/grep";
import SYSTEM_PROMPT from "./prompt/system-prompt.txt";
import { openai } from "@ai-sdk/openai";
import { globTool } from "./tool/glob";
import { readTool } from "./tool/read";
import { lsTool } from "./tool/ls";

// TODO: Verify dependencies

export async function validate() {
  const { text, steps } = await generateText({
    model: openai("gpt-5-nano"),
    tools: {
      grepTool,
      globTool,
      lsTool,
      readTool,
    },
    stopWhen: stepCountIs(10),
    system: SYSTEM_PROMPT,
    temperature: 0.1,
    prompt: "", // remember to add project root
  });
}
