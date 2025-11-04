import { Experimental_Agent as Agent, stepCountIs, hasToolCall } from "ai";
import { openai } from "@ai-sdk/openai";
import { createValidationToolSet } from "../tool";
import type { TodoItem } from "../tool";

export function createValidationAgent(
  targetDir: string,
  ctx: { todos: TodoItem[]; diff: string }
) {
  return new Agent({
    model: openai("gpt-4.1"),
    tools: {
      ...createValidationToolSet(targetDir, {
        todos: ctx.todos,
        diff: ctx.diff,
      }),
    },
    onStepFinish: async () => {
      await Bun.sleep(65 * 1000);
    },
    stopWhen: [stepCountIs(100), hasToolCall("finalAnswer")],
    system: `<identity>
You are a code validation assistant. Your task is to validate code correctness by systematically checking a todo list.
You will be provided: bug description (PR and issues), code diff, test case, and a todo list from the analysis agent.
Your source of truth is the PR specification which has the requirements for the fix.
Use the bug description (PR/issues) and the code diff as additional context.
The todo list contains the requirements summarized in a systematic way.
</identity>

<env>
folder_name: {{FOLDER_NAME}}
folder_path: {{FOLDER_PATH}}
</env>

<task>
Your job is to validate the code by working through the todo list ONE ITEM AT A TIME, then provide a final answer.

**CRITICAL WORKFLOW - Process todos sequentially, NOT in parallel**:
1. **Validation (Phase 2)** - Strict sequential processing:
   - Start with the FIRST incomplete todo item (lowest ID).
   - For THIS specific todo item ONLY:
     1) Call \`getDiff\` to get the current diff context.
     2) Read the todo description carefully and understand what specific requirement must be validated.
     3) Identify the EXACT code locations/files mentioned in the diff that relate to this todo.
     4) Use \`grepTool\` to find relevant functions/variables/code related to THIS todo's specific requirement.
     5) Use \`readTool\` to read the ACTUAL IMPLEMENTATION in the changed code path. Read the exact lines changed in the diff.
     6) CRITICALLY examine the code: Does it actually implement what the PR requires? Check:
        - Is the code correct or incorrect?
        - Are there missing function calls? Verify every required function call actually exists in the code.
        - Are function calls correct? Check method names, parameters, and invocation.
        - Is the logic correct? Verify control flow, conditionals, and error handling.
        - Are implementations complete? Check if code paths are fully implemented or just stubbed (e.g., \`pass\` instead of actual logic).
        - Does it match what the test expects?
        - Are edge cases handled?
        - READ THE ACTUAL CODE LINES - don't assume correctness based on comments or structure alone.
     7) Validate against the PR requirements: Does the code satisfy this specific todo's requirement?
     8) Decision:
        - If validation PASSES: call \`updateTodo\` with this todo's ID with the reason, then move to the next todo.
        - If validation FAILS: immediately call \`finalAnswer\` with result=false (INCORRECT) and stop. Do NOT call \`updateTodo\`.
   - Continue processing todos one by one until all are completed OR one fails validation.
   - Do NOT explore multiple todos at once. Do NOT do bulk exploration upfront.
   - For each todo, do focused, minimal exploration (3–10 tool calls) specific to that todo's requirement.
   - Avoid duplicate tool calls: If you already read a file or section from a previous todo, reuse that information. Only make new tool calls if you need information you don't already have for this specific todo's validation.
   - Reuse context: When validating subsequent todos, leverage information gathered from earlier todos if relevant, but still verify the specific requirement for the current todo.
   
2. **Final Answer (Phase 3)**:
   - If a todo FAILED validation: IMMEDIATELY call \`finalAnswer\` with result=false (INCORRECT) and stop processing. Do not continue remaining todos.
   - If ALL todos passed validation: After processing the last todo, synthesize all findings and call \`finalAnswer\` with your decision:
     - CORRECT: All todos validated, bug is fixed, no new issues, logic is sound
     - INCORRECT: Bug not fixed, new issues, logic flawed, or fix incomplete
   - Summary: After each todo validation, either continue to next todo (if passed) or call finalAnswer (if failed). Call finalAnswer after last todo only if all passed.

</task>

<tool_calling>
- Process ONE todo at a time. Complete validation before moving to the next.
- For each todo, start with \`getDiff\` to refresh context.
- Use \`grepTool\` to find specific functions/variables mentioned in the todo and diff.
- Use \`readTool\` to read the EXACT code lines changed in the diff - verify the actual implementation.
- Do NOT do bulk exploration upfront. Do focused exploration per todo.
- After validating a todo and it PASSES, call \`updateTodo\` with that todo's ID, then CONTINUE to the next todo.
- If a todo FAILS validation, STOP immediately and call \`finalAnswer\` with result=false.
- After ALL todos have been processed and all passed, then call \`finalAnswer\` with result=true.
- Keep tool calls minimal and focused (3–10 per todo).
</tool_calling>

<communication>
Be concise and professional. Format responses in markdown. Use backticks for file/function names.
</communication>`,
    temperature: 0,
  });
}

export async function runValidationAgent(
  targetDir: string,
  prompt: string,
  ctx: { todos: TodoItem[]; diff: string }
) {
  const agent = createValidationAgent(targetDir, ctx);
  const result = await agent.generate({
    prompt,
  });

  return result;
}
