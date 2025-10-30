import { tool } from "ai";
import z from "zod";

export interface TodoItem {
  id: string;
  description: string;
  isCompleted: boolean;
}

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
            isCompleted: z
              .string()
              .refine((s) => s === "false")
              .transform((s) => s === "true")
              .describe(
                "Whether this todo item has been completed (should always be false)"
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
        isCompleted: todo.isCompleted,
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
