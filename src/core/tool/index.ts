export * from "./read";
export * from "./ls";
export * from "./grep";
export * from "./glob";

import { readTool } from "./read";
import { lsTool } from "./ls";
import { grepTool } from "./grep";
import { globTool } from "./glob";
import type { TypedToolCall, TypedToolResult } from "ai";

const toolSet = {
  readTool,
  lsTool,
  grepTool,
  globTool,
};

export type ToolCall = TypedToolCall<typeof toolSet>;
export type ToolResult = TypedToolResult<typeof toolSet>;

export { toolSet };
