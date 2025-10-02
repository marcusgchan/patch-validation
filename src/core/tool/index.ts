export * from "./read";
export * from "./ls";
export * from "./grep";
export * from "./glob";

import { createReadTool } from "./read";
import { createLsTool } from "./ls";
import { createGrepTool } from "./grep";
import { createGlobTool } from "./glob";
import type { TypedToolCall, TypedToolResult } from "ai";

export function createToolSet(targetDir: string) {
  const toolSet = {
    readTool: createReadTool(targetDir),
    lsTool: createLsTool(targetDir),
    grepTool: createGrepTool(targetDir),
    globTool: createGlobTool(targetDir),
  };

  return toolSet;
}

export type ToolCall = TypedToolCall<ReturnType<typeof createToolSet>>;
export type ToolResult = TypedToolResult<ReturnType<typeof createToolSet>>;
