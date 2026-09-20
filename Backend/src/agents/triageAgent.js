const { Agent } = require('@openai/agents');
const { z } = require('zod');

/**
 * Priority levels supported across the platform
 */
const PriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

/**
 * Capability requirement schema
 */
const RequirementSchema = z.object({
  capability: z.string().min(1, 'capability must not be empty'),
  quantity: z.number().int().positive('quantity must be a positive integer'),
  priority: PriorityEnum,
});

/**
 * Structured output schema for Triage Agent
 */
const TriageOutputSchema = z.object({
  crisisType: z.string().min(1, 'crisisType must not be empty'),
  priority: PriorityEnum,
  peopleAffected: z.number().int().min(0, 'peopleAffected must be zero or greater'),
  requirements: z.array(RequirementSchema),
  summary: z.string().min(1, 'summary must not be empty'),
});

const TRIAGE_AGENT_INSTRUCTIONS = `You are the specialized Crisis Triage Agent for CO-RESOLVE, an AI-assisted crisis response platform.
Your responsibility is to analyze crisis report data and extract a structured triage assessment:

1. Crisis Type: Categorize the crisis into one of: flood, fire, medical, accident, missing_person, food_shortage, water_shortage, shelter, evacuation, or other.
2. Operational Priority: Estimate the priority level:
   - CRITICAL: Immediate life-threatening peril, trapped victims, active catastrophic flooding/fire, urgent rescue required.
   - HIGH: Serious emergencies needing prompt relief, severe damage, vulnerable populations at risk.
   - MEDIUM: Developing or moderate situations needing coordinated assistance.
   - LOW: Minor or stabilized incidents.
3. People Affected: Extract or reasonably estimate the number of individuals directly impacted (must be >= 0).
4. Required Capabilities: Identify concrete, operational capabilities needed (e.g., water_rescue, medical, first_aid, evacuation, drinking_water, food_supply, emergency_shelter). For each requirement:
   - capability: Name of operational skill or supply
   - quantity: Realistic positive integer for required personnel/units/rations
   - priority: Operational urgency for this capability (LOW, MEDIUM, HIGH, CRITICAL)
   Avoid inventing unnecessary requirements; infer only what the specific situation demands.
5. Summary: A concise, one-sentence operational triage summary explaining key needs and justification.

STRICT CONSTRAINTS:
- Do NOT choose, assign, or reference specific volunteers or organizations.
- Do NOT contact responders or claim resources have been dispatched.
- Do NOT perform database operations.
- Do NOT return hidden reasoning or chain-of-thought. Return only the structured schema output.`;

/**
 * Create or configure a Triage Agent instance
 */
function createTriageAgent() {
  const model = process.env.OPENAI_MODEL ? process.env.OPENAI_MODEL.trim() : undefined;

  return new Agent({
    name: 'CrisisTriageAgent',
    instructions: TRIAGE_AGENT_INSTRUCTIONS,
    outputType: TriageOutputSchema,
    ...(model ? { model } : {}),
  });
}

const triageAgent = createTriageAgent();

module.exports = {
  triageAgent,
  createTriageAgent,
  TriageOutputSchema,
  RequirementSchema,
  PriorityEnum,
};
