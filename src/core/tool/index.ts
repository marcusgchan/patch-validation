export * from "./read";
export * from "./ls";
export * from "./grep";
export * from "./glob";
export * from "./finalAnswer";
export * from "./createTodo";
export * from "./updateTodo";
export * from "./getDiff";

import { createReadTool } from "./read";
import { createGrepTool } from "./grep";
import { createGlobTool } from "./glob";
import { createFinalAnswerTool } from "./finalAnswer";
import { createTodoTool } from "./createTodo";
import { createUpdateTodoTool } from "./updateTodo";
import { createGetDiffTool } from "./getDiff";
import type { TodoItem } from "../types/todo-item";

export function createValidationToolSet(
  targetDir: string,
  ctx: { todos: TodoItem[]; diff: string }
) {
  const toolSet = {
    readTool: createReadTool(targetDir),
    grepTool: createGrepTool(targetDir),
    globTool: createGlobTool(targetDir),
    finalAnswer: createFinalAnswerTool(),
    updateTodo: createUpdateTodoTool(ctx),
    getDiff: createGetDiffTool(ctx),
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
