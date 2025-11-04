import { tool } from "ai";
import z from "zod";
import type { TodoItem } from "./createTodo";

export interface UpdateTodoToolExecuteReturn {
  type: "SUCCESS" | "ERROR";
  title: string;
  metadata: {
    updatedId?: string;
    error?: string;
    reason?: string;
    todos: TodoItem[];
  };
  output: string;
}

export function createUpdateTodoTool(ctx: { todos: TodoItem[] }) {
  return tool({
    name: "updateTodo",
    description: `Mark a todo item as completed. Use this tool after you have validated a specific todo item from the list.
Call this tool for each todo item you complete during validation. Use the todo item's ID to identify which item to mark as completed. Include a brief (1-2 sentences) reason explaining how you reached the conclusion.`,
    inputSchema: z.object({
      id: z
        .string()
        .min(1)
        .describe(
          "The ID of the todo item to mark as completed (e.g., 'todo-1', 'todo-2', etc.)"
        ),
      reason: z
        .string()
        .min(1)
        .describe(
          "Brief reasoning (1-3 sentences) explaining how you validated this todo item"
        ),
    }),
    execute: async (params): Promise<UpdateTodoToolExecuteReturn> => {
      const { id, reason } = params;
      const todoItem = ctx.todos.find((todo) => todo.id === id);

      if (!todoItem) {
        const availableIds = ctx.todos.map((t) => t.id).join(", ");
        return {
          type: "ERROR",
          title: "Todo Update Failed",
          metadata: {
            error: `Todo item with ID '${id}' not found`,
            todos: ctx.todos.map((todo) => ({ ...todo })),
          },
          output: `Error: Todo item with ID '${id}' not found. Available IDs: ${availableIds}`,
        };
      }

      if (todoItem.isCompleted) {
        return {
          type: "SUCCESS",
          title: "Todo Already Completed",
          metadata: {
            updatedId: id,
            reason,
            todos: ctx.todos.map((todo) => ({ ...todo })),
          },
          output: `Todo item '${id}' was already marked as completed: "${todoItem.description}"\nReason: ${reason}`,
        };
      }

      // Update the context directly
      todoItem.isCompleted = true;

      const todoListDisplay = ctx.todos
        .map(
          (todo) =>
            `- ${todo.isCompleted ? "[x]" : "[ ]"} ${todo.description} (ID: ${
              todo.id
            })`
        )
        .join("\n");

      return {
        type: "SUCCESS",
        title: "Todo Item Completed",
        metadata: {
          updatedId: id,
          reason,
          todos: ctx.todos.map((todo) => ({ ...todo })),
        },
        output: `Marked todo item '${id}' as completed\nReason: ${reason}\n\nUpdated Todo List:\n${todoListDisplay}`,
      };
    },
  });
}
