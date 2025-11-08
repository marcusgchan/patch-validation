import type { ValidationAgentResult } from "../agents/validation-agent";
import type { GlobToolExecuteReturn } from "../tool/glob";
import type { GrepToolSuccessExecuteReturn } from "../tool/grep";
import type { ReadToolExecuteReturn } from "../tool/read";
import type { UpdateTodoToolExecuteReturn } from "../tool/updateTodo";
import type { TodoItem } from "../types/todo-item";

type GeneratedResult = Awaited<ReturnType<ValidationAgentResult["generate"]>>;

export interface ValidationResult {
  result: boolean;
  reason: string;
  output: string;
  todoList: TodoItem[];
}

export function validationTransformer(
  generatedResponse: GeneratedResult
): ValidationResult {
  let result: boolean | null = null;
  let reason: string | null = null;
  let output: string = "";
  let todoList: TodoItem[] = [];

  for (const step of generatedResponse.steps) {
    for (const content of step.content) {
      switch (content.type) {
        case "tool-result": {
          output += `Calling tool: ${content.toolName}\n`;

          switch (content.toolName) {
            case "updateTodo": {
              const updateTodoResult =
                content.output as UpdateTodoToolExecuteReturn;
              result = updateTodoResult.metadata.result === "CORRECT";
              reason = updateTodoResult.metadata.reason;

              output += updateTodoResult.title + "\n";
              output += updateTodoResult.output;
              break;
            }
            case "grepTool": {
              const grepToolResult =
                content.output as GrepToolSuccessExecuteReturn;
              output += grepToolResult.title + "\n";
              output += grepToolResult.output;
              break;
            }
            case "readTool": {
              const readToolResult = content.output as ReadToolExecuteReturn;
              output += readToolResult.title + "\n";
              output += readToolResult.output;
              break;
            }
            case "globTool": {
              const globToolResult = content.output as GlobToolExecuteReturn;
              output += globToolResult.title + "\n";
              output += globToolResult.output;
              break;
            }
          }
          output += "\n\n";
          break;
        }
        case "tool-error": {
          console.log("tool-error", content);
          break;
        }
      }
    }
  }

  if (result === null || !reason || !output) {
    console.log("stop reason", generatedResponse.finishReason);
    console.log("missing required validation result", {
      result,
      reason,
    });
    console.log("output");
    console.log(output);
    throw new Error("Missing required validation result");
  }

  return {
    result,
    reason,
    output,
    todoList,
  };
}
