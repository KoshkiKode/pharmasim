import type { Substance } from '../data/types';
import type { PKResult, PatientProfile } from './pharmacokinetics';

export interface ReceptorState {
  receptor: string;
  totalOccupancy: number; // 0 to 1
  netActivity: number;    // 0 to 1 (accounts for partial agonists and antagonists)
  dominantLigand?: string; // The drug occupying the most receptors
}

/**
 * Calculates competitive receptor occupancy at a specific time point t.
 * Uses the multi-ligand Hill equation for competitive binding.
 */
export function computeReceptorState(
  receptor: string,
  pkResults: PKResult[],
  substances: Substance[],
  hour: number
): ReceptorState {
  // Extract all ligands targeting this receptor
  const ligands = pkResults.map(pk => {
    const substance = substances.find(s => s.id === pk.substanceId);
    if (!substance || !substance.bindingAffinities || !substance.bindingAffinities[receptor]) {
      return null;
    }
    
    // Find concentration at this hour
    let concentration = 0;
    // We assume series is sorted by hour
    for (let i = 0; i < pk.series.length - 1; i++) {
      if (pk.series[i].hour <= hour && pk.series[i + 1].hour >= hour) {
        // Linear interpolation
        const dt = pk.series[i + 1].hour - pk.series[i].hour;
        const dc = pk.series[i + 1].concentration - pk.series[i].concentration;
        const fraction = (hour - pk.series[i].hour) / dt;
        concentration = pk.series[i].concentration + dc * fraction;
        break;
      }
    }
    
    // Fallback if exactly at the end
    if (concentration === 0 && pk.series.length > 0 && pk.series[pk.series.length - 1].hour === hour) {
        concentration = pk.series[pk.series.length - 1].concentration;
    }

    if (concentration <= 0) return null;

    // Convert mg/L to nM (approximate average small molecule molar mass = 350 g/mol)
    const molarMass = (substance as any).molarMass || 350;
    const nM = (concentration / molarMass) * 1000000;

    const affinity = substance.bindingAffinities[receptor];

    return {
      name: substance.name,
      concentrationNM: nM,
      kiNm: affinity.kiNm,
      intrinsicActivity: affinity.intrinsicActivity
    };
  }).filter((l): l is NonNullable<typeof l> => l !== null);

  if (ligands.length === 0) {
    return { receptor, totalOccupancy: 0, netActivity: 0 };
  }

  // Multi-ligand competitive binding equation
  // Denominator = 1 + sum( [L]/Ki )
  let sumLoverKi = 0;
  for (const lig of ligands) {
    sumLoverKi += lig.concentrationNM / lig.kiNm;
  }

  const denominator = 1 + sumLoverKi;

  let netActivity = 0;
  let totalOccupancy = 0;
  let maxOccupancy = 0;
  let dominantLigand = undefined;

  for (const lig of ligands) {
    // Fractional occupancy for this specific ligand
    const occupancy = (lig.concentrationNM / lig.kiNm) / denominator;
    totalOccupancy += occupancy;
    netActivity += occupancy * lig.intrinsicActivity;

    if (occupancy > maxOccupancy) {
      maxOccupancy = occupancy;
      dominantLigand = lig.name;
    }
  }

  return {
    receptor,
    totalOccupancy,
    netActivity,
    dominantLigand
  };
}
