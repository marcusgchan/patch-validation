import { tool } from "ai";
import z from "zod";

export interface GetDiffToolExecuteReturn {
  type: "SUCCESS";
  title: string;
  metadata: {
    length: number;
  };
  output: string;
}

export function createGetDiffTool(ctx: { diff: string }) {
  return tool({
    name: "getDiff",
    description:
      "Return the current code diff being validated. Use this to refresh context before validating a todo item.",
    inputSchema: z.object({}),
    execute: async (): Promise<GetDiffToolExecuteReturn> => {
      const output = ctx.diff;
      return {
        type: "SUCCESS",
        title: "Current Diff",
        metadata: {
          length: output.length,
        },
        output,
      };
    },
  });
}
