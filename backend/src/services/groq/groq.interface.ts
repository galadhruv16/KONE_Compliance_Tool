import { z } from 'zod';

export const LabelInterpretationRequestItemSchema = z.object({
  id: z.string(),
  rawLabel: z.string(),
  rawValue: z.string(),
  context: z.string().optional(),
  documentType: z.enum(['TDS_EXCEL', 'KTOC_PDF']),
});

export const LabelInterpretationRequestSchema = z.object({
  items: z.array(LabelInterpretationRequestItemSchema),
  knownCanonicalKeys: z.array(z.string()),
});

export type LabelInterpretationRequest = z.infer<typeof LabelInterpretationRequestSchema>;

export const CandidateInterpretationSchema = z.object({
  id: z.string(),
  sourceRawLabel: z.string(),
  proposedCanonicalKey: z.string().nullable(),
  rationale: z.string(),
  confidence: z.number().min(0).max(1),
  requiresHumanReview: z.boolean(),
  reviewReason: z.string().optional(),
});

export const LabelInterpretationResponseSchema = z.object({
  interpretations: z.array(CandidateInterpretationSchema),
});

export type LabelInterpretationResponse = z.infer<typeof LabelInterpretationResponseSchema>;

export const ElevatorAliasRequestSchema = z.object({
  tdsElevatorIds: z.array(z.string()),
  ktocElevatorIds: z.array(z.string()),
  context: z.string().optional(),
});

export type ElevatorAliasRequest = z.infer<typeof ElevatorAliasRequestSchema>;

export const ElevatorAliasMappingSchema = z.object({
  tdsElevatorId: z.string(),
  ktocElevatorId: z.string(),
  confidence: z.number().min(0).max(1),
  rationale: z.string(),
  isConfident: z.boolean(),
});

export const ElevatorAliasResponseSchema = z.object({
  mappings: z.array(ElevatorAliasMappingSchema),
});

export type ElevatorAliasResponse = z.infer<typeof ElevatorAliasResponseSchema>;

export interface IGroqProvider {
  interpretLabels(request: LabelInterpretationRequest): Promise<LabelInterpretationResponse>;
  resolveElevatorAliases(request: ElevatorAliasRequest): Promise<ElevatorAliasResponse>;
}
