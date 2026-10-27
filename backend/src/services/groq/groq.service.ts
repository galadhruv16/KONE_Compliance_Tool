import { Groq } from 'groq-sdk';
import {
  IGroqProvider,
  LabelInterpretationRequest,
  LabelInterpretationResponse,
  LabelInterpretationResponseSchema,
  ElevatorAliasRequest,
  ElevatorAliasResponse,
  ElevatorAliasResponseSchema,
} from './groq.interface.js';
import { logger } from '../../logging/logger.js';

export interface GroqProviderConfig {
  apiKey?: string;
  model?: string;
  maxRetries?: number;
  timeoutMs?: number;
  isMockOnly?: boolean;
}

export class GroqProvider implements IGroqProvider {
  private client: Groq | null = null;
  private model: string;
  private maxRetries: number;
  private timeoutMs: number;

  constructor(config: GroqProviderConfig = {}) {
    const apiKey = config.apiKey || process.env.GROQ_API_KEY;
    this.model = config.model || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
    this.maxRetries = config.maxRetries ?? 2;
    this.timeoutMs = config.timeoutMs ?? 7000;

    if (apiKey && apiKey !== 'mock_key' && !config.isMockOnly) {
      this.client = new Groq({ apiKey, timeout: this.timeoutMs, maxRetries: this.maxRetries });
    }
  }

  async interpretLabels(request: LabelInterpretationRequest): Promise<LabelInterpretationResponse> {
    if (!this.client) {
      logger.warn('Groq client unconfigured or GROQ_API_KEY absent. Routing all labels to review.');
      return {
        interpretations: request.items.map((item) => ({
          id: item.id,
          sourceRawLabel: item.rawLabel,
          proposedCanonicalKey: null,
          rationale: 'Groq provider unavailable/disabled. Manual review required.',
          confidence: 0,
          requiresHumanReview: true,
          reviewReason: 'LLM provider not configured or data security gate active.',
        })),
      };
    }

    const prompt = `You are a specialized KONE Elevator Technical Data assistant.
Analyze these extracted technical parameter labels from elevator documentation.
For each label, suggest the best-matching canonical parameter key strictly chosen from the provided KNOWN_CANONICAL_KEYS list.
Do not invent keys. If a label is ambiguous or not definitely equivalent, set proposedCanonicalKey to null, requiresHumanReview to true, and explain why.

KNOWN_CANONICAL_KEYS:
${JSON.stringify(request.knownCanonicalKeys, null, 2)}

ITEMS TO INTERPRET:
${JSON.stringify(request.items, null, 2)}

Respond with a valid JSON object matching this schema:
{
  "interpretations": [
    {
      "id": "string (matching item id)",
      "sourceRawLabel": "string",
      "proposedCanonicalKey": "string or null",
      "rationale": "string",
      "confidence": number between 0 and 1,
      "requiresHumanReview": boolean,
      "reviewReason": "string optional"
    }
  ]
}`;

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response received from Groq');
      }

      const parsed = JSON.parse(content);
      const validated = LabelInterpretationResponseSchema.parse(parsed);

      // Verify that proposed keys are strictly inside knownCanonicalKeys
      const sanitized = validated.interpretations.map((interp) => {
        if (interp.proposedCanonicalKey && !request.knownCanonicalKeys.includes(interp.proposedCanonicalKey)) {
          logger.warn(`Groq proposed unapproved key '${interp.proposedCanonicalKey}'. Reverting to REVIEW_REQUIRED.`);
          return {
            ...interp,
            proposedCanonicalKey: null,
            requiresHumanReview: true,
            reviewReason: `Model proposed unapproved key '${interp.proposedCanonicalKey}'. Human validation required.`,
          };
        }
        return interp;
      });

      return { interpretations: sanitized };
    } catch (err) {
      logger.error('Groq label interpretation error', { error: err instanceof Error ? err.message : String(err) });
      return {
        interpretations: request.items.map((item) => ({
          id: item.id,
          sourceRawLabel: item.rawLabel,
          proposedCanonicalKey: null,
          rationale: 'Error during LLM interpretation. Defaulting to safe review state.',
          confidence: 0,
          requiresHumanReview: true,
          reviewReason: 'Groq provider call failed or returned invalid response.',
        })),
      };
    }
  }

  async resolveElevatorAliases(request: ElevatorAliasRequest): Promise<ElevatorAliasResponse> {
    if (!this.client) {
      return {
        mappings: request.tdsElevatorIds.map((tdsId) => ({
          tdsElevatorId: tdsId,
          ktocElevatorId: request.ktocElevatorIds[0] || 'UNKNOWN',
          confidence: 0.3,
          rationale: 'Groq client unconfigured. Default fallback assignment.',
          isConfident: false,
        })),
      };
    }

    const prompt = `Associate elevator worksheet names from Customer TDS with Elevator Column identifiers from KONE KTOC.
TDS IDs: ${JSON.stringify(request.tdsElevatorIds)}
KTOC IDs: ${JSON.stringify(request.ktocElevatorIds)}

Respond with JSON matching:
{
  "mappings": [
    {
      "tdsElevatorId": "string",
      "ktocElevatorId": "string",
      "confidence": number,
      "rationale": "string",
      "isConfident": boolean
    }
  ]
}`;

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response received from Groq');
      }

      const parsed = JSON.parse(content);
      return ElevatorAliasResponseSchema.parse(parsed);
    } catch (err) {
      logger.error('Groq alias resolution error', { error: err instanceof Error ? err.message : String(err) });
      return {
        mappings: request.tdsElevatorIds.map((tdsId) => ({
          tdsElevatorId: tdsId,
          ktocElevatorId: request.ktocElevatorIds[0] || 'UNKNOWN',
          confidence: 0,
          rationale: 'Provider error resolving elevator aliases.',
          isConfident: false,
        })),
      };
    }
  }
}
