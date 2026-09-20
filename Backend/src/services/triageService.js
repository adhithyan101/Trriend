const { run } = require('@openai/agents');
const { triageAgent, TriageOutputSchema } = require('../agents/triageAgent');

/**
 * Construct structured prompt input for Triage Agent
 */
function buildCrisisInput(crisis) {
  const lines = [
    `Title: ${crisis.title || 'Untitled'}`,
    `Description: ${crisis.description || 'No description provided'}`,
    `Reported Type: ${crisis.type || 'Unknown'}`,
    `Location: ${crisis.location || 'Unknown'}`,
    `Reported People Affected: ${crisis.people_affected ?? crisis.peopleAffected ?? 'Unknown'}`,
    `Current Preliminary Priority: ${crisis.priority || 'MEDIUM'}`,
  ];
  return `Triage analysis request for reported crisis:\n\n${lines.join('\n')}`;
}

/**
 * Analyze a crisis using the OpenAI Agents SDK Triage Agent
 * Validates output using Zod and does NOT write directly to SQLite.
 *
 * @param {object} crisis - The crisis record to analyze
 * @returns {Promise<object>} Validated structured triage analysis
 */
async function analyzeCrisis(crisis) {
  // Verify OpenAI credentials before making requests
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    const error = new Error('OPENAI_API_KEY is not configured in the environment');
    error.statusCode = 503;
    error.code = 'CONFIG_UNAVAILABLE';
    throw error;
  }

  const inputPrompt = buildCrisisInput(crisis);

  let runResult;
  try {
    runResult = await run(triageAgent, inputPrompt);
  } catch (err) {
    // Sanitize error message to prevent any API key pattern from leaking
    let safeMessage = err.message || 'AI provider failed to process triage analysis';
    safeMessage = safeMessage.replace(/sk-[a-zA-Z0-9*_-]+/g, '[REDACTED]');

    const error = new Error(safeMessage);
    error.statusCode = 502;
    error.code = 'AI_PROVIDER_ERROR';
    throw error;
  }

  // Extract structured output
  const rawOutput = runResult.finalOutput;
  if (!rawOutput) {
    const error = new Error('Triage agent returned empty response');
    error.statusCode = 502;
    error.code = 'EMPTY_AI_OUTPUT';
    throw error;
  }

  // Validate output strictly against Zod schema
  try {
    const validated = TriageOutputSchema.parse(rawOutput);
    return {
      crisisType: validated.crisisType,
      priority: validated.priority,
      peopleAffected: validated.peopleAffected,
      requirements: validated.requirements,
      summary: validated.summary,
    };
  } catch (validationErr) {
    const error = new Error(`AI triage output validation failed: ${validationErr.message}`);
    error.statusCode = 502;
    error.code = 'INVALID_AI_SCHEMA';
    error.details = validationErr.errors;
    throw error;
  }
}

module.exports = {
  analyzeCrisis,
  buildCrisisInput,
};
