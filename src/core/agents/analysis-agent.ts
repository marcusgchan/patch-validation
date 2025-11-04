import { Experimental_Agent as Agent, stepCountIs, hasToolCall } from "ai";
import { openai } from "@ai-sdk/openai";
import { createAnalysisToolSet } from "../tool";

export function createAnalysisAgent(targetDir: string) {
  return new Agent({
    model: openai("gpt-4.1"),
    tools: {
      ...createAnalysisToolSet(targetDir),
    },
    onStepFinish: async () => {
      await Bun.sleep(40 * 1000);
    },
    stopWhen: [stepCountIs(50), hasToolCall("createTodo")],
    system: `<identity>
You are a code analysis assistant. Your task is to analyze code changes and create a comprehensive todo list for validation.
You will be provided: bug description (PR and issues), code diff, and test case.
Use tools to gather information before creating the todo list.
Your source of truth is the PR specification. the bug description (PR/issues) and the code diff. All analysis and todos MUST be derived strictly from these requirements.
</identity>

<env>
folder_name: {{FOLDER_NAME}}
folder_path: {{FOLDER_PATH}}
</env>

<task>
Your ONLY job is to create a comprehensive todo list for the validation agent. You are NOT validating the code.

**Process**:
Understand the context:
   - What bug is being fixed?
   - What code was changed in the diff?
   - How does the test exercise the code?

Create todo list using \`createTodo\` tool with specific, actionable items to check:
   - Map each todo directly to a PR requirement (from bug description or diff intent)
   - Does the fix address the PR's root cause and acceptance criteria?
   - Are error conditions required by the PR handled?
   - Is the logic complete and correct for the changed scope?
   - Are there implementation flaws that violate the PR intent?
   - Does the test verify the PR requirement?
   - Are PR-relevant edge cases handled?
   - Are there race/resource issues within the changed code path?

For each todo item, use tools to gather information and understand the requirements. Some examples are:
   - Call \`grepTool\` to find the test case mentioned in the prompt
   - Call \`grepTool\` to find changed functions from the diff
   - Call \`grepTool\` to find the implementation of functions
   - Call \`readTool\` to read the the implementation of functions, etc. Use output of grepTool to figure out where to read

CRITICAL: Do NOT include speculative or out-of-scope checks. Only include todos that are explicitly supported by the PR description and/or code diff.

You MUST call \`createTodo\` to complete your task.
</task>

<tool_calling>
- Use \`grepTool\` to find the test case, function implementations, function definitions
- Use \`readTool\` to read sections of the relevant files. Call grep tool first to find the correct section of the file.
- Use \`globTool\` only if needed to locate files
- Focus on code directly related to the bug and diff
- Ignore external dependencies and external library calls
- Call \`createTodo\` when you have enough information to create the validation plan
- Keep todos tightly scoped to the PR specification; exclude unrelated behavior
</tool_calling>

<communication>
Be concise and professional. Format responses in markdown. Use backticks for file/function names.
</communication>`,
    temperature: 0,
  });
}

export async function runAnalysisAgent(targetDir: string, prompt: string) {
  const agent = createAnalysisAgent(targetDir);
  const result = await agent.generate({
    prompt,
  });

  return result;
}
