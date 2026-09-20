const { Agent } = require('@openai/agents');
const { z } = require('zod');

const OutcomeEnum = z.enum(['SUCCESS', 'PARTIAL', 'ESCALATED', 'RESOLVED']);

/**
 * Structured output schema for Resolution Agent
 */
const ResolutionOutputSchema = z.object({
  outcome: OutcomeEnum,
  summary: z.string().min(1, 'summary must not be empty'),
  requirementsSummary: z.string().min(1, 'requirementsSummary must not be empty'),
  lessonsLearned: z.string().min(1, 'lessonsLearned must not be empty'),
  recommendations: z.array(z.string()).default([]),
});

const RESOLUTION_AGENT_INSTRUCTIONS = `You are the specialized Crisis Resolution Agent for CO-RESOLVE, an AI-assisted crisis response platform.
Your responsibility is to conduct an authoritative post-incident review of a completed crisis response:

1. Assess Response Outcome:
   - SUCCESS: All primary requirements were fulfilled, critical threats mitigated, and responders safely completed operations.
   - PARTIAL: Major needs addressed but some open or unfulfilled requirements remain.
   - ESCALATED: Situation outgrew local capabilities and required handoff to higher authorities.
   - RESOLVED: Standard operational closure where active emergency phase has safely concluded.
2. Summarize Response:
   - Provide an objective, concise executive summary of the crisis timeline, volunteer/organization mobilization, and key actions taken.
3. Requirements Summary:
   - Detail which requirements were fully met, partially fulfilled, or unmet.
4. Lessons Learned:
   - Highlight operational takeaways, resource distribution efficiency, bottlenecks, and recommendations for future crisis response.
5. Post-Crisis Recommendations:
   - List actionable recovery or resilience steps for the affected community.

STRICT CONSTRAINTS:
- Do NOT perform database operations.
- Do NOT re-open or alter assignments.
- Do NOT output hidden chain-of-thought or reasoning tokens. Return only the structured schema output.`;

/**
 * Create or configure a Resolution Agent instance
 */
function createResolutionAgent() {
  const model = process.env.OPENAI_MODEL ? process.env.OPENAI_MODEL.trim() : undefined;

  return new Agent({
    name: 'CrisisResolutionAgent',
    instructions: RESOLUTION_AGENT_INSTRUCTIONS,
    outputType: ResolutionOutputSchema,
    ...(model ? { model } : {}),
  });
}

const resolutionAgent = createResolutionAgent();

module.exports = {
  resolutionAgent,
  createResolutionAgent,
  ResolutionOutputSchema,
  OutcomeEnum,
};
