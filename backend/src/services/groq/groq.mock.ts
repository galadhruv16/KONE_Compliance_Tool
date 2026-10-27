import {
  IGroqProvider,
  LabelInterpretationRequest,
  LabelInterpretationResponse,
  ElevatorAliasRequest,
  ElevatorAliasResponse,
} from './groq.interface.js';

export class MockGroqProvider implements IGroqProvider {
  private customInterpretations: Map<string, string> = new Map();
  private customAliasMappings: Map<string, string> = new Map();

  constructor() {
    // Seed standard mappings for hermetic unit testing
    this.customInterpretations.set('rated load', 'RATED_LOAD_KG');
    this.customInterpretations.set('capacity (kg)', 'RATED_LOAD_KG');
    this.customInterpretations.set('passenger capacity', 'PASSENGER_CAPACITY');
    this.customInterpretations.set('rated speed', 'SPEED_MPS');
    this.customInterpretations.set('car internal width', 'CAR_WIDTH_MM');
    this.customInterpretations.set('car internal depth', 'CAR_DEPTH_MM');
    this.customInterpretations.set('car internal height', 'CAR_HEIGHT_MM');
    this.customInterpretations.set('clear height up to false ceiling', 'CAR_CLEAR_HEIGHT_MM');
    this.customInterpretations.set('shaft width', 'SHAFT_WIDTH_MM');
    this.customInterpretations.set('shaft depth', 'SHAFT_DEPTH_MM');
    this.customInterpretations.set('pit depth', 'PIT_DEPTH_MM');
    this.customInterpretations.set('headroom', 'HEADROOM_MM');

    // Elevator alias defaults
    this.customAliasMappings.set('1.1_PL-FL-01', 'C-PL01');
    this.customAliasMappings.set('1.1_PL-02', 'C-PL02');
    this.customAliasMappings.set('1.1_PL-03', 'C-PL03');
    this.customAliasMappings.set('1.1_PL-04', 'C-PL04');
    this.customAliasMappings.set('1.1_FL-01', 'C-FL01');
    this.customAliasMappings.set('1.1_SHL-01', 'C-SHL01');
    this.customAliasMappings.set('1.1_SHL-02', 'C-SHL02');
  }

  async interpretLabels(request: LabelInterpretationRequest): Promise<LabelInterpretationResponse> {
    const interpretations = request.items.map((item) => {
      const normalizedRaw = item.rawLabel.trim().toLowerCase();
      const mappedKey = this.customInterpretations.get(normalizedRaw);

      if (mappedKey && request.knownCanonicalKeys.includes(mappedKey)) {
        return {
          id: item.id,
          sourceRawLabel: item.rawLabel,
          proposedCanonicalKey: mappedKey,
          rationale: `Matched based on mock dictionary rules for '${item.rawLabel}'`,
          confidence: 0.95,
          requiresHumanReview: false,
        };
      }

      // If ambiguous or unknown
      return {
        id: item.id,
        sourceRawLabel: item.rawLabel,
        proposedCanonicalKey: null,
        rationale: `Unrecognized or ambiguous parameter label '${item.rawLabel}'`,
        confidence: 0.2,
        requiresHumanReview: true,
        reviewReason: `No verified canonical mapping found for label '${item.rawLabel}'. Requires human validation.`,
      };
    });

    return { interpretations };
  }

  async resolveElevatorAliases(request: ElevatorAliasRequest): Promise<ElevatorAliasResponse> {
    const mappings = request.tdsElevatorIds.map((tdsId) => {
      const match = this.customAliasMappings.get(tdsId);
      if (match && request.ktocElevatorIds.includes(match)) {
        return {
          tdsElevatorId: tdsId,
          ktocElevatorId: match,
          confidence: 0.92,
          rationale: `Mapped sheet name ${tdsId} to KTOC column ${match}`,
          isConfident: true,
        };
      }

      // Fallback matching
      const fallbackKtoc = request.ktocElevatorIds[0] || 'UNKNOWN';
      return {
        tdsElevatorId: tdsId,
        ktocElevatorId: fallbackKtoc,
        confidence: 0.4,
        rationale: `Low confidence provisional association for ${tdsId}`,
        isConfident: false,
      };
    });

    return { mappings };
  }
}
