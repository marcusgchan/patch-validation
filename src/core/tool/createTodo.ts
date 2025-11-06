import { tool } from "ai";
import z from "zod";
import type { TodoItem } from "../types/todo-item";

export interface CreateTodoToolExecuteReturn {
  type: "SUCCESS";
  title: string;
  metadata: {
    todos: TodoItem[];
  };
  output: string;
}

export function createTodoTool() {
  return tool({
    name: "createTodo",
    description: `Create a comprehensive todo list of validation items to check during code validation.
Each todo item should be specific and actionable. The todos will be used by the validation agent to systematically validate the code changes.`,
    inputSchema: z.object({
      todos: z
        .array(
          z.object({
            description: z
              .string()
              .min(1)
              .describe(
                "A specific, actionable validation item to check during validation"
              ),
          })
        )
        .min(1)
        .describe("Array of todo items for validation"),
    }),
    execute: async (params): Promise<CreateTodoToolExecuteReturn> => {
      const todos = params.todos.map((todo, index) => ({
        id: `todo-${index + 1}`,
        description: todo.description,
        isCompleted: false,
      }));

      const todoList = todos
        .map((todo) => `- [ ] ${todo.description} (ID: ${todo.id})`)
        .join("\n");

      const markdownTodoList = `Todo List (${todos.length} items):\n\n${todoList}`;

      return {
        type: "SUCCESS",
        title: "Todo List Created",
        metadata: {
          todos,
        },
        output: markdownTodoList,
      };
    },
  });
}
