import { tool } from "ai";
import z from "zod";

export const globTool = tool({
  name: "Project Search",
  description: "Searches for a file.",
  inputSchema: z.object({}),
  execute: async () => {},
});
