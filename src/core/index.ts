import { createAnalysisAgent } from "./agents/analysis-agent";
import { createValidationAgent } from "./agents/validation-agent";

// TODO: Verify dependencies

export function createAnalysisStream(
  targetDir: string,
  prompt: string,
  bugDescription: string,
  diff: string
) {
  if (process.env.OPENAI_API_KEY === undefined) {
    throw new Error("OOPENAI_API_KEY not set");
  }

  const analysisAgent = createAnalysisAgent(targetDir);
  return analysisAgent.stream({
    prompt: `Bug Description:\n${bugDescription}\n\nCode Diff:\n${diff}\n\nTest Case:\n${prompt}`,
  });
}

export function createValidationStream(
  targetDir: string,
  prompt: string,
  bugDescription: string,
  diff: string,
  analysisText: string
) {
  if (process.env.OPENAI_API_KEY === undefined) {
    throw new Error("OOPENAI_API_KEY not set");
  }

  const validationAgent = createValidationAgent(targetDir);
  return validationAgent.stream({
    prompt: `Based on the analysis results, validate the code changes:\n\n${analysisText}\n\nBug Description:\n${bugDescription}\n\nCode Diff:\n${diff}\n\nTest Case:\n${prompt}`,
  });
}
