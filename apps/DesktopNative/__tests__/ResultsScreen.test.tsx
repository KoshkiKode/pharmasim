import {beforeEach, describe, expect, it, jest} from '@jest/globals';
import {computePK, substances} from '@pharmasim/engine';
import {ResultsScreen} from '../../../packages/ui/src/screens/ResultsScreen';

jest.mock('@pharmasim/engine', () => ({
  substances: [
    {id: 'selected', cypMetabolism: ['CYP3A4']},
    {id: 'inhibitor', cypInhibits: ['CYP3A4']},
    {id: 'unselected-inducer', cypInduces: ['CYP3A4']},
  ],
  // Returning no results keeps this regression focused on PK input selection.
  computePK: jest.fn(() => null),
}));

jest.mock('react-native-paper', () => ({
  useTheme: () => ({}),
}));

describe('native results PK interaction context', () => {
  beforeEach(() => jest.clearAllMocks());

  it.each([
    ['single selected substance', ['selected']],
    ['selected interaction pair', ['selected', 'inhibitor']],
    ['unknown event excluded', ['selected', 'unknown']],
  ])('uses only selected catalog entries: %s', (_label, ids) => {
    const patient = {weightKg: 70};
    const events = (ids as string[]).map(substanceId => ({substanceId, doseMg: 10}));
    const selected = substances.filter(substance => (ids as string[]).includes(substance.id));

    ResultsScreen({route: {params: {patient, events}}});

    expect(computePK).toHaveBeenCalledTimes(selected.length);
    selected.forEach((substance, index) => {
      expect(computePK).toHaveBeenNthCalledWith(
        index + 1,
        patient,
        substance,
        expect.objectContaining({
          customEvents: events.filter(event => event.substanceId === substance.id),
        }),
        selected,
      );
    });
  });
});
