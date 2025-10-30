export * from "./read";
export * from "./ls";
export * from "./grep";
export * from "./glob";
export * from "./finalAnswer";
export * from "./createTodo";
export * from "./updateTodo";

import { createReadTool } from "./read";
import { createLsTool } from "./ls";
import { createGrepTool } from "./grep";
import { createGlobTool } from "./glob";
import { createFinalAnswerTool } from "./finalAnswer";
import { createTodoTool } from "./createTodo";
import { createUpdateTodoTool } from "./updateTodo";
import type { TypedToolCall, TypedToolResult } from "ai";
import type { TodoItem } from "./createTodo";

export function createValidationToolSet(
  targetDir: string,
  ctx: { todos: TodoItem[] }
) {
  const toolSet = {
    readTool: createReadTool(targetDir),
    grepTool: createGrepTool(targetDir),
    globTool: createGlobTool(targetDir),
    finalAnswer: createFinalAnswerTool(),
    updateTodo: createUpdateTodoTool(ctx),
  };

  return toolSet;
}

export function createAnalysisToolSet(targetDir: string) {
  const toolSet = {
    readTool: createReadTool(targetDir),
    grepTool: createGrepTool(targetDir),
    globTool: createGlobTool(targetDir),
    finalAnswer: createFinalAnswerTool(),
    createTodo: createTodoTool(),
  };

  return toolSet;
}
