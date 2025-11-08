import type { AnalysisAgentResult } from "../agents/analysis-agent";
import type { CreateTodoToolExecuteReturn } from "../tool/createTodo";
import type { GlobToolExecuteReturn } from "../tool/glob";
import type { GrepToolSuccessExecuteReturn } from "../tool/grep";
import type { ReadToolExecuteReturn } from "../tool/read";
import type { TodoItem } from "../types/todo-item";

type GeneratedResult = Awaited<ReturnType<AnalysisAgentResult["generate"]>>;

export interface AnalysisResult {
  todoList: TodoItem[];
  analysisText: string;
  output: string;
}

export function analysisTransformer(
  generatedResponse: GeneratedResult
): AnalysisResult {
  let todoList: TodoItem[] | null = null;
  let analysisText: string | null = null;
  let output: string = "";
  for (const step of generatedResponse.steps) {
    for (const content of step.content) {
      switch (content.type) {
        case "tool-result": {
          output += `Calling tool: ${content.toolName}\n`;

          switch (content.toolName) {
            case "createTodo": {
              const createTodoResult =
                content.output as CreateTodoToolExecuteReturn;

              todoList = createTodoResult.metadata.todos;
              analysisText = createTodoResult.output;
              output += createTodoResult.title + "\n";
              output += createTodoResult.output;
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
            case "readTool": {
              const readToolResult = content.output as ReadToolExecuteReturn;
              output += readToolResult.title + "\n";
              output += readToolResult.output;
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

  if (!todoList || !analysisText || !output) {
    console.log("missing required analysis result", {
      todoList,
      analysisText,
      output,
    });
    throw new Error("Missing required analysis result");
  }

  return {
    todoList,
    analysisText,
    output,
  };
}
