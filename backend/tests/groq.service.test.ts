import { describe, it } from 'node:test';
import assert from 'node:assert';
import { MockGroqProvider } from '../src/services/groq/groq.mock.js';
import { LabelInterpretationRequest } from '../src/services/groq/groq.interface.js';

describe('Groq Semantic Interpretation Service (Mock Provider)', () => {
  const provider = new MockGroqProvider();

  it('correctly maps known customer terms to approved canonical keys', async () => {
    const request: LabelInterpretationRequest = {
      items: [
        { id: 'item-1', rawLabel: 'Rated Load', rawValue: '1000 kg', documentType: 'TDS_EXCEL' },
        { id: 'item-2', rawLabel: 'Headroom', rawValue: '4200 mm', documentType: 'TDS_EXCEL' },
      ],
      knownCanonicalKeys: ['RATED_LOAD_KG', 'HEADROOM_MM', 'CAR_WIDTH_MM'],
    };

    const response = await provider.interpretLabels(request);

    assert.strictEqual(response.interpretations.length, 2);
    assert.strictEqual(response.interpretations[0]?.proposedCanonicalKey, 'RATED_LOAD_KG');
    assert.strictEqual(response.interpretations[0]?.requiresHumanReview, false);
    assert.strictEqual(response.interpretations[1]?.proposedCanonicalKey, 'HEADROOM_MM');
    assert.strictEqual(response.interpretations[1]?.requiresHumanReview, false);
  });

  it('routes unfamiliar or ambiguous customer labels to human review', async () => {
    const request: LabelInterpretationRequest = {
      items: [
        { id: 'item-3', rawLabel: 'Clear Height up to False Ceiling', rawValue: '2400', documentType: 'TDS_EXCEL' },
        { id: 'item-4', rawLabel: 'Custom Mystery Parameter', rawValue: 'ABC', documentType: 'TDS_EXCEL' },
      ],
      knownCanonicalKeys: ['RATED_LOAD_KG', 'HEADROOM_MM'],
    };

    const response = await provider.interpretLabels(request);

    assert.strictEqual(response.interpretations.length, 2);
    // Neither is in knownCanonicalKeys
    assert.strictEqual(response.interpretations[0]?.proposedCanonicalKey, null);
    assert.strictEqual(response.interpretations[0]?.requiresHumanReview, true);
    assert.strictEqual(response.interpretations[1]?.proposedCanonicalKey, null);
    assert.strictEqual(response.interpretations[1]?.requiresHumanReview, true);
  });

  it('resolves provisional elevator aliases between TDS sheet names and KTOC identifiers', async () => {
    const response = await provider.resolveElevatorAliases({
      tdsElevatorIds: ['1.1_PL-FL-01', '1.1_PL-02'],
      ktocElevatorIds: ['C-PL01', 'C-PL02', 'C-SHL01'],
    });

    assert.strictEqual(response.mappings.length, 2);
    assert.strictEqual(response.mappings[0]?.tdsElevatorId, '1.1_PL-FL-01');
    assert.strictEqual(response.mappings[0]?.ktocElevatorId, 'C-PL01');
    assert.strictEqual(response.mappings[0]?.isConfident, true);
  });
});
