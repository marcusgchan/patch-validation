import { tool } from "ai";
import z from "zod";
import DESCRIPTION from "../prompt/finalAnswer.txt";

export interface FinalAnswerToolExecuteReturn {
  type: "SUCCESS";
  title: string;
  metadata: {
    result: boolean;
    reason: string;
  };
  output: string;
}

export function createFinalAnswerTool() {
  return tool({
    name: "finalAnswer",
    description: DESCRIPTION,
    inputSchema: z.object({
      result: z
        .boolean()
        .describe(
          "The validation result - true if the code is correct, false if incorrect or incomplete"
        ),
      reason: z
        .string()
        .min(1)
        .describe("A short explanation of why you reached this conclusion"),
    }),
    execute: async (params): Promise<FinalAnswerToolExecuteReturn> => {
      const output = `Validation Result: ${params.result}\n\nReason: ${params.reason}`;

      return {
        type: "SUCCESS",
        title: "Final Answer",
        metadata: {
          result: params.result,
          reason: params.reason,
        },
        output,
      };
    },
  });
}
