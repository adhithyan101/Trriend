const { Agent } = require('@openai/agents');
const { z } = require('zod');

/**
 * Recommendation item schema
 */
const RecommendationSchema = z.object({
  requirementId: z.number().int().positive('requirementId must be a positive integer'),
  entityType: z.enum(['volunteer', 'organization', 'resource']),
  entityId: z.union([z.number().int(), z.string()]),
  matchReason: z.string().min(1, 'matchReason must not be empty'),
  confidence: z.number().min(0).max(1, 'confidence must be between 0.0 and 1.0'),
});

/**
 * Structured output schema for Matching Agent
 */
const MatchingOutputSchema = z.object({
  recommendations: z.array(RecommendationSchema),
  summary: z.string().min(1, 'summary must not be empty'),
});

const MATCHING_AGENT_INSTRUCTIONS = `You are the specialized Matching Agent for CO-RESOLVE, an AI-assisted crisis response platform.
Your sole responsibility is to evaluate crisis requirements and candidate responders (volunteers, organizations, resources) discovered via semantic search and validated against authoritative database state.

You recommend candidate matches to fulfill each requirement:
1. Match each requirement to the most appropriate candidate volunteer, organization, or resource based on capability match, experience, availability, and location.
2. For each recommendation provide:
   - requirementId: The ID of the crisis requirement
   - entityType: "volunteer", "organization", or "resource"
   - entityId: Authoritative entity ID
   - matchReason: Concise, operational explanation of fit (skills, location, availability)
   - confidence: Numeric score from 0.0 to 1.0 reflecting capability and readiness fit
3. Provide a concise summary of the recommended matches.

STRICT CONSTRAINTS:
- Do NOT create, finalize, or approve assignments.
- Do NOT modify the database.
- Do NOT contact responders or claim dispatch has occurred.
- Recommend strictly from the provided candidate pool.
- Do NOT output hidden chain-of-thought or reasoning tokens. Return only the structured schema.`;

/**
 * Create or configure a Matching Agent instance
 */
function createMatchingAgent() {
  const model = process.env.OPENAI_MODEL ? process.env.OPENAI_MODEL.trim() : undefined;

  return new Agent({
    name: 'CrisisMatchingAgent',
    instructions: MATCHING_AGENT_INSTRUCTIONS,
    outputType: MatchingOutputSchema,
    ...(model ? { model } : {}),
  });
}

const matchingAgent = createMatchingAgent();

module.exports = {
  matchingAgent,
  createMatchingAgent,
  MatchingOutputSchema,
  RecommendationSchema,
};
