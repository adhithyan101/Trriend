const { run } = require('@openai/agents');
const { resolutionAgent, ResolutionOutputSchema } = require('../agents/resolutionAgent');
const { getCrisisSummaryContext } = require('../database/db');

/**
 * Format crisis operational context into an input prompt for the Resolution Agent
 */
function buildResolutionPrompt(context) {
  const { crisis, requirements, assignments, events, metrics } = context;

  const reqLines = requirements.map(
    (r) => `- [${r.status}] ${r.capability}: Requested ${r.quantity}, Fulfilled ${r.fulfilled_quantity}`
  );

  const assignLines = assignments.map(
    (a) =>
      `- Assignment #${a.id} [${a.status}]: ${a.role || 'Responder'} (${
        a.volunteer ? `Volunteer: ${a.volunteer.name}` : a.organization ? `Org: ${a.organization.name}` : 'Unassigned'
      })`
  );

  const timelineLines = events.slice(-8).map((e) => `- ${e.event_type}: ${e.message}`);

  return `Please conduct a crisis resolution evaluation for the following incident:

CRISIS OVERVIEW:
- ID: ${crisis.id}
- Title: ${crisis.title}
- Type: ${crisis.type}
- Location: ${crisis.location}
- Priority: ${crisis.priority}
- People Affected: ${crisis.peopleAffected}
- Current Status: ${crisis.status}

REQUIREMENTS EVALUATION (${metrics.fulfilledRequirements}/${metrics.totalRequirements} Fulfilled):
${reqLines.join('\n') || 'None recorded'}

ASSIGNMENTS SUMMARY (${metrics.completedAssignments}/${metrics.totalAssignments} Completed):
${assignLines.join('\n') || 'None recorded'}

RESOURCE MOVEMENTS:
- Dispatches: ${metrics.totalResourceDispatches}
- Releases: ${metrics.totalResourceReleases}

SIGNIFICANT TIMELINE EVENTS:
${timelineLines.join('\n') || 'None recorded'}`;
}

/**
 * Heuristic operational resolution when OpenAI credentials are not configured
 */
function buildDeterministicResolution(context) {
  const { crisis, metrics } = context;

  let outcome = 'RESOLVED';
  if (metrics.totalRequirements > 0 && metrics.fulfilledRequirements >= metrics.totalRequirements) {
    outcome = 'SUCCESS';
  } else if (metrics.fulfilledRequirements > 0) {
    outcome = 'PARTIAL';
  }

  const summary = `Emergency response operations concluded for "${crisis.title}" (${crisis.type}) in ${
    crisis.location
  }. ${metrics.completedAssignments} assignment(s) successfully completed to address operational requirements.`;

  const requirementsSummary = `Fulfilled ${metrics.fulfilledRequirements} of ${metrics.totalRequirements} requirement(s). ${
    metrics.openRequirements > 0
      ? `${metrics.openRequirements} requirement(s) remained open at closure.`
      : 'All primary capabilities addressed.'
  }`;

  const lessonsLearned = `Field operations demonstrated effective responder coordination with ${
    metrics.totalResourceDispatches
  } resource dispatch movement(s). Volunteer teams completed all designated field tasks safely.`;

  const recommendations = [
    'Conduct secondary community welfare and infrastructure assessment',
    'Replenish regional warehouse resources and relief inventory',
    'Archive incident report into operational crisis response memory',
  ];

  return {
    outcome,
    summary,
    requirementsSummary,
    lessonsLearned,
    recommendations,
    metrics,
  };
}

/**
 * Conduct comprehensive crisis resolution analysis
 *
 * @param {number} crisisId - Crisis ID to analyze and resolve
 * @returns {Promise<object>} Structured resolution details
 */
async function analyzeCrisisResolution(crisisId) {
  const context = getCrisisSummaryContext(crisisId);
  if (!context) {
    const err = new Error(`Crisis #${crisisId} not found`);
    err.statusCode = 404;
    throw err;
  }

  const apiKey = process.env.OPENAI_API_KEY;

  // Use deterministic engine if OpenAI API key is not configured
  if (!apiKey || !apiKey.trim()) {
    return buildDeterministicResolution(context);
  }

  const promptInput = buildResolutionPrompt(context);

  let runResult;
  try {
    runResult = await run(resolutionAgent, promptInput);
  } catch (err) {
    // Sanitize API key pattern if present in error
    let safeMessage = err.message || 'AI provider failed to process crisis resolution';
    safeMessage = safeMessage.replace(/sk-[a-zA-Z0-9*_-]+/g, '[REDACTED]');

    // Gracefully fallback to deterministic resolution if AI call fails
    console.warn('AI Resolution Agent call failed, falling back to deterministic evaluation:', safeMessage);
    return buildDeterministicResolution(context);
  }

  const rawOutput = runResult.finalOutput;
  if (!rawOutput) {
    return buildDeterministicResolution(context);
  }

  try {
    const validated = ResolutionOutputSchema.parse(rawOutput);
    return {
      outcome: validated.outcome,
      summary: validated.summary,
      requirementsSummary: validated.requirementsSummary,
      lessonsLearned: validated.lessonsLearned,
      recommendations: validated.recommendations || [],
      metrics: context.metrics,
    };
  } catch (validationErr) {
    console.warn('Schema validation fallback for resolution agent:', validationErr.message);
    return buildDeterministicResolution(context);
  }
}

module.exports = {
  analyzeCrisisResolution,
  buildResolutionPrompt,
  buildDeterministicResolution,
};
