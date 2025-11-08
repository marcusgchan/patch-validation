export * from "./read";
export * from "./ls";
export * from "./grep";
export * from "./glob";
export * from "./createTodo";
export * from "./updateTodo";

import { createReadTool } from "./read";
import { createGrepTool } from "./grep";
import { createGlobTool } from "./glob";
import { createTodoTool } from "./createTodo";
import { createUpdateTodoTool } from "./updateTodo";

export function createValidationToolSet(targetDir: string) {
  const toolSet = {
    readTool: createReadTool(targetDir),
    grepTool: createGrepTool(targetDir),
    globTool: createGlobTool(targetDir),
    updateTodo: createUpdateTodoTool(),
  };

  return toolSet;
}

export function createAnalysisToolSet(targetDir: string) {
  const toolSet = {
    readTool: createReadTool(targetDir),
    grepTool: createGrepTool(targetDir),
    globTool: createGlobTool(targetDir),
    createTodo: createTodoTool(),
  };

  return toolSet;
}
