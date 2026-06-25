import { describe, it, expect } from 'vitest';
import { unpackMixtures } from './pharmacokinetics';
import type { Substance } from '../data/types';

describe('unpackMixtures', () => {
  const mockDb: Substance[] = [
    {
      id: 'marijuana',
      name: 'Marijuana',
      brandNames: [],
      category: 'plant-herb',
      drugClass: 'Cannabinoid',
      halfLifeHours: 10,
      routes: ['inhaled'],
      mechanism: 'Cannabinoid',
      bodySystems: ['CNS'],
      bioavailability: 0.3,
      vdLKg: 10,
      tags: ['cns-depressant', 'serotonergic'],
      activeIngredients: [{ id: 'thc', ratio: 0.20 }, { id: 'cbd', ratio: 0.05 }]
    },
    {
      id: 'thc',
      name: 'THC',
      brandNames: [],
      category: 'pharmaceutical',
      drugClass: 'Cannabinoid',
      halfLifeHours: 10,
      routes: ['inhaled'],
      mechanism: 'Cannabinoid',
      bodySystems: ['CNS'],
      bioavailability: 0.3,
      vdLKg: 10,
      tags: ['cns-depressant']
    },
    {
      id: 'cbd',
      name: 'CBD',
      brandNames: [],
      category: 'pharmaceutical',
      drugClass: 'Cannabinoid',
      halfLifeHours: 10,
      routes: ['oral'],
      mechanism: 'Cannabinoid',
      bodySystems: ['CNS'],
      bioavailability: 0.3,
      vdLKg: 10,
    }
  ];

  it('unpacks mixtures with default ratios and provides holistic plant', () => {
    const regimen = { mode: 'acute' as const, doseMg: 100, dailyDoseMg: 100, daysOnRegimen: 1, frequency: 'QD' as const, toleranceOverride: null };
    const result = unpackMixtures(mockDb[0], regimen, mockDb);
    
    expect(result).toHaveLength(3);
    
    // Holistic parent (should have heavy tags stripped)
    expect(result[0].isEntourageHolistic).toBe(true);
    expect(result[0].substance.id).toBe('marijuana');
    expect(result[0].substance.tags).not.toContain('cns-depressant');
    expect(result[0].substance.tags).not.toContain('serotonergic');
    expect(result[0].regimen.doseMg).toBe(100);

    // THC component
    const thc = result.find(r => r.substance.id === 'thc');
    expect(thc?.isConstituent).toBe(true);
    expect(thc?.regimen.doseMg).toBe(20); // 100 * 0.20
    
    // CBD component
    const cbd = result.find(r => r.substance.id === 'cbd');
    expect(cbd?.regimen.doseMg).toBe(5); // 100 * 0.05
  });

  it('applies custom ratios and omits zero-ratio components', () => {
    // 90% THC extract, 0% CBD
    const regimen = { 
      mode: 'acute' as const, doseMg: 100, dailyDoseMg: 100, daysOnRegimen: 1, frequency: 'QD' as const, toleranceOverride: null,
      customConstituentRatios: { thc: 0.90, cbd: 0 }
    };
    const result = unpackMixtures(mockDb[0], regimen, mockDb);
    
    expect(result).toHaveLength(2); // Holistic parent + THC
    
    const thc = result.find(r => r.substance.id === 'thc');
    expect(thc?.regimen.doseMg).toBe(90);
    
    const cbd = result.find(r => r.substance.id === 'cbd');
    expect(cbd).toBeUndefined();
  });
});
