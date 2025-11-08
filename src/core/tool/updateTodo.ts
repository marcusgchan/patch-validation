import { tool } from "ai";
import z from "zod";

const schema = z.object({
  result: z
    .enum(["CORRECT", "INCORRECT"])
    .describe(
      "The validation result - CORRECT if the code matches the todo item requirements, INCORRECT if code is incorrect"
    ),
  reason: z
    .string()
    .min(1)
    .describe(
      "Brief reasoning (1-3 sentences) explaining how you validated this todo item"
    ),
});

export type UpdateTodoToolInput = z.infer<typeof schema>;

export interface UpdateTodoToolExecuteReturn {
  type: "SUCCESS";
  title: string;
  metadata: {
    result: UpdateTodoToolInput["result"];
    reason: UpdateTodoToolInput["reason"];
  };
  output: string;
}

export function createUpdateTodoTool() {
  return tool({
    name: "updateTodo",
    description: `Mark current todo item as correct or incorrect. Use this tool after you have validated the current todo item. Include a brief (1-2 sentences) reason explaining how you reached the conclusion.`,
    inputSchema: schema,
    execute: async (params): Promise<UpdateTodoToolExecuteReturn> => {
      const { result, reason } = params;

      return {
        type: "SUCCESS",
        title: "Todo Item Completed",
        metadata: {
          result,
          reason,
        },
        output: `Todo item was marked as ${result}\nReason: ${reason}`,
      };
    },
  });
}
