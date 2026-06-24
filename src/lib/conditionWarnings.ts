import type { Substance, SubstanceTag } from '@/data/types';
import type { OrganHealth } from './pharmacokinetics';

export interface ConditionWarning {
  id: string;
  conditionId: string;
  conditionName: string;
  substanceId?: string; // for single-drug warnings
  substanceName?: string;
  substanceIds?: string[]; // for combination warnings
  substanceNames?: string[];
  severity: 'minor' | 'moderate' | 'major' | 'contraindicated';
  title: string;
  mechanism: string;
  recommendation: string;
  isLifeThreatening: boolean;
}

function has(s: Substance, tag: SubstanceTag): boolean {
  return !!s.tags?.includes(tag);
}

export function computeConditionWarnings(
  substances: Substance[],
  conditionIds: string[],
  liverHealth: OrganHealth,
  kidneyHealth: OrganHealth,
): ConditionWarning[] {
  const warnings: ConditionWarning[] = [];
  
  // Merge explicit conditions with implicit conditions from organ health inputs
  const activeConditions = new Set(conditionIds);
  if (liverHealth === 'impaired') activeConditions.add('liver-cirrhosis');
  if (kidneyHealth === 'impaired') activeConditions.add('ckd');


  // Helper for adding single-substance warnings
  const addSingle = (
    condId: string,
    condName: string,
    sub: Substance,
    severity: ConditionWarning['severity'],
    title: string,
    mechanism: string,
    rec: string,
    lifeThreatening = false
  ) => {
    warnings.push({
      id: `cond:${condId}:${sub.id}`,
      conditionId: condId,
      conditionName: condName,
      substanceId: sub.id,
      substanceName: sub.name,
      severity,
      title,
      mechanism,
      recommendation: rec,
      isLifeThreatening: lifeThreatening || severity === 'contraindicated',
    });
  };

  // Helper for adding combination warnings
  const addCombo = (
    condId: string,
    condName: string,
    subs: Substance[],
    severity: ConditionWarning['severity'],
    title: string,
    mechanism: string,
    rec: string,
    lifeThreatening = true
  ) => {
    warnings.push({
      id: `cond-combo:${condId}:${subs.map(s => s.id).join('+')}`,
      conditionId: condId,
      conditionName: condName,
      substanceIds: subs.map(s => s.id),
      substanceNames: subs.map(s => s.name),
      severity,
      title,
      mechanism,
      recommendation: rec,
      isLifeThreatening: lifeThreatening,
    });
  };

  // Loop over each substance for single-substance rules
  for (const s of substances) {
    const isBetaBlocker = /beta.*blocker/i.test(s.drugClass) || s.brandNames.some(b => /metoprolol|carvedilol|propranolol|bisoprolol/i.test(b));

    // 1. Asthma
    if (activeConditions.has('asthma')) {
      if (isBetaBlocker) {
        addSingle(
          'asthma',
          'Asthma',
          s,
          'contraindicated',
          'Beta-blocker in Asthma',
          'Beta-blockers can cause acute, severe bronchospasm in asthmatic patients by blocking beta-2 receptors in bronchial smooth muscle, opposing bronchodilation.',
          'Contraindicated. Avoid beta-blockers; use alternative classes like calcium channel blockers or ACE inhibitors.',
          true
        );
      } else if (has(s, 'nsaid')) {
        addSingle(
          'asthma',
          'Asthma',
          s,
          'major',
          'NSAID Bronchospasm Hazard',
          'COX inhibition shifts arachidonic acid metabolism to the lipoxygenase pathway, increasing leukotriene production, which can trigger severe bronchospasm (Aspirin-Exacerbated Respiratory Disease / AERD).',
          'Avoid NSAIDs if sensitive to aspirin/NSAID-induced asthma. Acetaminophen or selective COX-2 inhibitors are generally safer alternatives.'
        );
      }
    }

    // 2. Epilepsy
    if (activeConditions.has('epilepsy')) {
      const lowersSeizure = has(s, 'stimulant') || 
                            ['bupropion', 'tramadol', 'clozapine', 'amitriptyline', 'doxepin', 'clomipramine', 'nortriptyline'].includes(s.id) ||
                            s.warnings?.some(w => /seizure|convulsion/i.test(w));
      if (lowersSeizure) {
        addSingle(
          'epilepsy',
          'Epilepsy / Seizures',
          s,
          'major',
          'Seizure Threshold Lowered',
          `${s.name} lowers the neuronal seizure threshold and can precipitate seizures or status epilepticus in patients with preexisting epilepsy.`,
          'Avoid or use with extreme caution. Ensure anticonvulsant therapy is optimized.'
        );
      }
    }

    // 3. Diabetes
    if (activeConditions.has('diabetes')) {
      const isSteroid = /corticosteroid/i.test(s.drugClass) || ['prednisone', 'dexamethasone', 'methylprednisolone', 'hydrocortisone'].includes(s.id);
      if (isSteroid) {
        addSingle(
          'diabetes',
          'Diabetes Mellitus',
          s,
          'major',
          'Steroid-induced Hyperglycaemia',
          'Corticosteroids increase hepatic gluconeogenesis, reduce peripheral glucose uptake in muscle, and increase insulin resistance, causing severe elevations in blood glucose.',
          'Monitor blood glucose closely. Doses of insulin or oral hypoglycaemic agents will likely require significant upward adjustment.'
        );
      }
    }

    // 4. Hypertension
    if (activeConditions.has('hypertension')) {
      if (has(s, 'stimulant') || has(s, 'sympathomimetic')) {
        addSingle(
          'hypertension',
          'Hypertension',
          s,
          'major',
          'Vasopressor Spike Hazard',
          'Stimulants and sympathomimetics cause direct vasoconstriction, tachycardia, and raise blood pressure, risking severe hypertensive crisis.',
          'Avoid or use with caution; monitor blood pressure closely.'
        );
      } else if (has(s, 'nsaid')) {
        addSingle(
          'hypertension',
          'Hypertension',
          s,
          'moderate',
          'Antihypertensive Efficacy Reduced',
          'NSAIDs inhibit renal prostaglandins, causing sodium/water retention and increasing systemic vascular resistance. This raises blood pressure and antagonizes the effects of antihypertensives.',
          'Monitor blood pressure. Minimize NSAID dose and duration, or prefer acetaminophen.'
        );
      }
    }

    // 5. Coronary Artery Disease (CAD)
    if (activeConditions.has('cad')) {
      const isTriptan = /triptan/i.test(s.drugClass) || ['sumatriptan', 'rizatriptan', 'zolmitriptan', 'eletriptan'].includes(s.id);
      if (isTriptan) {
        addSingle(
          'cad',
          'Coronary Artery Disease',
          s,
          'contraindicated',
          'Coronary Vasoconstriction Hazard',
          'Triptans act as 5-HT1B/1D receptor agonists, which can induce direct coronary vasospasm and precipitate myocardial ischemia, angina, or myocardial infarction in CAD patients.',
          'Contraindicated. Avoid triptans. Use acetaminophen, non-vasoconstrictive analgesics, or CGRP antagonists.',
          true
        );
      } else if (has(s, 'stimulant') || has(s, 'sympathomimetic')) {
        addSingle(
          'cad',
          'Coronary Artery Disease',
          s,
          'major',
          'Myocardial Oxygen Demand Spike',
          'Stimulants raise heart rate, contractility, and blood pressure. In CAD, the coronary arteries cannot supply enough blood to meet this increased oxygen demand, risking angina or myocardial infarction.',
          'Avoid stimulants. If essential, use at the lowest effective dose under strict cardiologist supervision.'
        );
      } else if (has(s, 'nsaid')) {
        addSingle(
          'cad',
          'Coronary Artery Disease',
          s,
          'major',
          'Cardiovascular Thrombotic Risk',
          'NSAIDs (except low-dose aspirin) shift the arachidonic acid pathway, favoring vasoconstriction and platelet aggregation, which raises the risk of acute myocardial infarction and stroke.',
          'Avoid NSAIDs in patients with established ischemic heart disease. Prefer acetaminophen.'
        );
      }
    }

    // 6. Heart Failure
    if (activeConditions.has('heart-failure')) {
      if (has(s, 'nsaid')) {
        addSingle(
          'heart-failure',
          'Heart Failure',
          s,
          'major',
          'Fluid Retention & Decompensation',
          'NSAIDs inhibit renal prostaglandins, leading to sodium/water retention, peripheral edema, and increased preload and afterload, which can precipitate acute decompensated heart failure.',
          'Avoid NSAIDs. Acetaminophen is the preferred analgesic.'
        );
      } else if (['verapamil', 'diltiazem'].includes(s.id)) {
        addSingle(
          'heart-failure',
          'Heart Failure',
          s,
          'contraindicated',
          'Negative Inotropic Hazard',
          'Verapamil and diltiazem exert powerful negative inotropic effects, reducing cardiac output and dangerously exacerbating heart failure with reduced ejection fraction.',
          'Contraindicated. Discontinue. If a calcium channel blocker is needed for hypertension or angina, dihydropyridines (e.g. amlodipine) are safer.',
          true
        );
      }
    }

    // 7. Chronic Kidney Disease (CKD)
    if (activeConditions.has('ckd')) {
      if (has(s, 'nephrotoxic')) {
        addSingle(
          'ckd',
          'Chronic Kidney Disease',
          s,
          'contraindicated',
          'Nephrotoxic Injury in CKD',
          'Nephrotoxic drugs impair renal hemodynamics or cause direct tubular damage, which can accelerate the progression of CKD or trigger acute kidney injury (AKI).',
          'Contraindicated. Avoid NSAIDs and other nephrotoxins. Ensure hydration and monitor serum creatinine.',
          true
        );
      } else if (s.renalDosingWarning) {
        addSingle(
          'ckd',
          'Chronic Kidney Disease',
          s,
          'major',
          'Renal Dosing Adjustment Required',
          `${s.name} is cleared renally. In CKD, clearance is reduced, leading to drug accumulation and high risk of systemic toxicity.`,
          s.renalDosingWarning
        );
      }
    }

    // 8. Liver Cirrhosis
    if (activeConditions.has('liver-cirrhosis')) {
      if (has(s, 'hepatotoxic') || s.id === 'alcohol') {
        addSingle(
          'liver-cirrhosis',
          'Liver Cirrhosis / Impairment',
          s,
          'contraindicated',
          'Hepatotoxicity in Cirrhosis',
          `Hepatotoxic drugs or alcohol stress the liver. Impaired hepatocytes cannot clear toxins, risking drug-induced liver injury, variceal bleeding, or hepatic encephalopathy.`,
          s.id === 'alcohol'
            ? 'Contraindicated. Completely avoid alcohol.'
            : 'Contraindicated. Avoid hepatotoxic drugs. If acetaminophen is necessary, restrict dose to <2g/day.',
          true
        );
      } else if (s.hepaticDosingWarning) {
        addSingle(
          'liver-cirrhosis',
          'Liver Cirrhosis / Impairment',
          s,
          'major',
          'Hepatic Dosing Adjustment Required',
          `${s.name} relies on hepatic metabolism. Scarring and reduced enzyme activity in cirrhosis prolong its half-life and lead to accumulation.`,
          s.hepaticDosingWarning
        );
      }
    }

    // 9. Pregnancy
    if (activeConditions.has('pregnancy')) {
      if (s.pregnancyCategory === 'X') {
        addSingle(
          'pregnancy',
          'Pregnancy',
          s,
          'contraindicated',
          'Teratogenic Hazard (Category X)',
          'FDA Category X. Studies in animals or humans have demonstrated positive evidence of fetal abnormalities and/or fetal risk. The risks of use in pregnancy clearly outweigh any possible clinical benefit.',
          'Contraindicated. Discontinue immediately and switch to a pregnancy-safe alternative under medical supervision.',
          true
        );
      } else if (s.pregnancyCategory === 'D') {
        addSingle(
          'pregnancy',
          'Pregnancy',
          s,
          'major',
          'Fetal Risk Demonstrated (Category D)',
          'FDA Category D. There is positive evidence of human fetal risk based on investigational or post-marketing data, but potential benefits may warrant use in pregnant women despite the risk.',
          'Avoid unless life-saving. Discuss potential risks and benefits with your obstetrician.'
        );
      } else if (s.pregnancyCategory === 'C') {
        addSingle(
          'pregnancy',
          'Pregnancy',
          s,
          'moderate',
          'Potential Fetal Risk (Category C)',
          'FDA Category C. Animal reproduction studies have shown an adverse effect on the fetus and there are no adequate and well-controlled studies in humans, but potential benefits may warrant use.',
          'Use with caution and only if the potential benefit justifies the potential risk to the fetus.'
        );
      }

      if (has(s, 'nsaid')) {
        addSingle(
          'pregnancy',
          'Pregnancy',
          s,
          'major',
          'Premature Ductus Closure Hazard',
          'NSAIDs inhibit prostaglandin synthesis. Use in the late second or third trimester can cause premature closure of the fetal ductus arteriosus, pulmonary hypertension, and fetal renal dysfunction leading to oligohydramnios.',
          'Avoid NSAIDs in pregnancy (especially after week 20). Acetaminophen is the preferred analgesic for pregnant patients.'
        );
      }
    }

    // 10. Breastfeeding
    if (activeConditions.has('breastfeeding') && s.lactationWarning) {
      addSingle(
        'breastfeeding',
        'Breastfeeding / Lactation',
        s,
        'major',
        'Excretion in Breast Milk Warning',
        `${s.name} is excreted in breast milk and can accumulate in the nursing infant, potentially causing sedation, respiratory depression, or developmental effects.`,
        s.lactationWarning
      );
    }

    // 11. G6PD Deficiency
    if (activeConditions.has('g6pd-deficiency')) {
      const isOxidative = ['primaquine', 'rasburicase', 'dapsone', 'nitrofurantoin', 'sulfamethoxazole', 'trimethoprim-sulfamethoxazole'].includes(s.id) ||
                          (s.id === 'aspirin' && s.typicalDoseMg && s.typicalDoseMg >= 325);
      if (isOxidative) {
        addSingle(
          'g6pd-deficiency',
          'G6PD Deficiency',
          s,
          'contraindicated',
          'Acute Haemolytic Crisis Risk',
          `Oxidative substances like ${s.name} cause oxidative stress in G6PD-deficient erythrocytes. Glutathione depletion leads to hemoglobin denaturation (Heinz bodies) and acute intravascular hemolysis.`,
          'Contraindicated. Avoid all oxidative medications. Monitor CBC and bilirubin if exposure occurred.',
          true
        );
      }
    }

    // 12. Glaucoma
    if (activeConditions.has('glaucoma') && has(s, 'anticholinergic')) {
      addSingle(
        'glaucoma',
        'Angle-Closure Glaucoma',
        s,
        'contraindicated',
        'Acute Angle-Closure Glaucoma Crisis',
        'Anticholinergic drugs block muscarinic receptors in the iris sphincter, causing pupillary dilation (mydriasis). In angle-closure glaucoma, this dilates the iris folds into the narrow drainage angle, blocking aqueous outflow and causing a rapid, painful rise in ocular pressure.',
        'Contraindicated. Avoid medications with anticholinergic properties. Seek emergency ophthalmic care if ocular pain occurs.',
        true
      );
    }

    // 13. Bleeding Disorders
    if (activeConditions.has('bleeding-disorders') && (has(s, 'anticoagulant') || has(s, 'antiplatelet') || has(s, 'nsaid'))) {
      addSingle(
        'bleeding-disorders',
        'Bleeding Disorders / Active Bleed',
        s,
        'contraindicated',
        'Severe Hemorrhage Hazard',
        'This substance impairs hemostasis (via coagulation cascade inhibition, platelet inhibition, or mucosal irritation). In active bleeding or bleeding disorders, this can cause uncontrolled, life-threatening blood loss.',
        'Contraindicated. Avoid anticoagulants, antiplatelets, and NSAIDs. Use local hemostatic measures and seek immediate medical care for bleeding.',
        true
      );
    }

    // 14. Peptic Ulcer Disease
    if (activeConditions.has('peptic-ulcer')) {
      if (has(s, 'nsaid')) {
        addSingle(
          'peptic-ulcer',
          'Peptic Ulcer Disease',
          s,
          'contraindicated',
          'GI Hemorrhage & Perforation Risk',
          'NSAIDs inhibit COX-1-mediated cytoprotective prostaglandins in the GI tract, impairing mucosal barrier repair. In patients with active ulcers, this can trigger severe bleeding or gastric/duodenal wall perforation.',
          'Contraindicated. Avoid NSAIDs. Use acetaminophen for analgesia.',
          true
        );
      }
    }

    // 15. Parkinson's Disease
    if (activeConditions.has('parkinson')) {
      const isDopamineAntagonist = /dopamine.*antagonist/i.test(s.drugClass) || 
                                   ['haloperidol', 'metoclopramide', 'risperidone', 'chlorpromazine', 'olanzapine'].includes(s.id);
      if (isDopamineAntagonist) {
        addSingle(
          'parkinson',
          "Parkinson's Disease",
          s,
          'contraindicated',
          'Severe Parkinsonian Motor Worsening',
          'Dopamine D2 receptor antagonists block striatal receptors, directly counteracting dopamine replacement therapy and precipitating severe rigidity, bradykinesia, and tremors.',
          'Contraindicated. Avoid D2 antagonists. Use ondansetron for nausea; use quetiapine or clozapine at low doses if antipsychotic therapy is required.',
          true
        );
      }
    }

    // 16. Sleep Apnea / COPD
    if (activeConditions.has('sleep-apnea-copd')) {
      const isDepressant = has(s, 'cns-depressant') || has(s, 'respiratory-depressant') || has(s, 'opioid') || has(s, 'benzodiazepine') || s.id === 'alcohol';
      if (isDepressant) {
        addSingle(
          'sleep-apnea-copd',
          'COPD / Sleep Apnea',
          s,
          'major',
          'Respiratory Drive Suppression',
          'Sedative agents suppress respiratory drive centers in the brainstem and relax pharyngeal muscles, worsening airway obstruction, severe nocturnal hypoxemia, and hypercapnic respiratory failure.',
          'Use with extreme caution. Avoid combining with other sedatives/depressants.'
        );
      }
    }

    // 17. Long QT Syndrome
    if (activeConditions.has('long-qt') && has(s, 'qt-prolonging')) {
      addSingle(
        'long-qt',
        'Long QT Syndrome',
        s,
        'contraindicated',
        'Torsades de Pointes Hazard',
        ' hERG potassium channel blockade by QT-prolonging drugs delay ventricular repolarisation. In patients with congenital or acquired Long QT Syndrome, this triggers early afterdepolarisations, causing Torsades de Pointes and sudden cardiac arrest.',
        'Contraindicated. Avoid all QT-prolonging drugs. Baseline ECG and electrolyte monitoring are required if exposure is unavoidable.',
        true
      );
    }

    // 18. Gout
    if (activeConditions.has('gout')) {
      const causesHyperuricemia = ['furosemide', 'hydrochlorothiazide'].includes(s.id) || (s.id === 'aspirin' && s.typicalDoseMg && s.typicalDoseMg <= 325);
      if (causesHyperuricemia) {
        addSingle(
          'gout',
          'Gout',
          s,
          'major',
          'Hyperuricaemia & Gout Flare Trigger',
          'Diuretics and low-dose aspirin increase renal uric acid reabsorption, raising serum urate concentrations and precipitating acute gout arthritis flares.',
          'Avoid loop/thiazide diuretics if possible; monitor uric acid levels. Ensure colchicine or allopurinol therapy is optimized if diuretics are necessary.'
        );
      }
    }

    // 19. Thyroid Dysfunction
    if (activeConditions.has('thyroid-dysfunction')) {
      if (s.id === 'amiodarone' || s.id === 'lithium') {
        addSingle(
          'thyroid-dysfunction',
          'Thyroid Dysfunction',
          s,
          'major',
          'Thyroid Function Alteration',
          'Amiodarone contains high iodine content and can cause thyroiditis or block thyroid hormone release. Lithium directly inhibits thyroid hormone synthesis and release, causing goiter or hypothyroidism.',
          'Monitor thyroid function tests (TSH, free T4) at baseline and periodically during therapy.'
        );
      }
    }
  }

  // --- COMPOUND DRUG-DRUG-CONDITION RULES (LIFE THREATENING COMBINATIONS) ---

  // 1. COPD / Sleep Apnea + Multiple Depressants
  if (activeConditions.has('sleep-apnea-copd')) {
    const depressants = substances.filter(
      s => has(s, 'cns-depressant') || has(s, 'respiratory-depressant') || has(s, 'opioid') || has(s, 'benzodiazepine') || s.id === 'alcohol'
    );
    if (depressants.length >= 2) {
      addCombo(
        'sleep-apnea-copd',
        'COPD / Sleep Apnea',
        depressants,
        'contraindicated',
        'Life-Threatening Combination: Severe Respiratory Depression',
        `The patient has Sleep Apnea/COPD and is taking a combination of multiple CNS/respiratory depressants (${depressants.map(d => d.name).join(', ')}). This causes synergetic suppression of brainstem respiratory drive, raising the risk of fatal hypercapnia, coma, and respiratory arrest.`,
        'Contraindicated combination. Discontinue or avoid this combination. If essential, reduce doses, monitor oxygen saturation continuously, and ensure immediate access to reversal agents like naloxone or flumazenil.',
        true
      );
    }
  }

  // 2. Long QT Syndrome + Multiple QT Prolongers
  if (activeConditions.has('long-qt')) {
    const qtProlongers = substances.filter(s => has(s, 'qt-prolonging'));
    if (qtProlongers.length >= 2) {
      addCombo(
        'long-qt',
        'Long QT Syndrome',
        qtProlongers,
        'contraindicated',
        'Life-Threatening Combination: Ventricular Arrhythmia',
        `The patient has Long QT Syndrome and is taking multiple QT-prolonging drugs (${qtProlongers.map(q => q.name).join(', ')}). This leads to additive delays in cardiac repolarisation, creating an extreme risk of ventricular tachycardia, Torsades de Pointes, and sudden cardiac death.`,
        'Contraindicated. Immediately stop at least one QT-prolonging agent. Obtain an urgent 12-lead ECG, monitor QTc interval, and correct serum potassium/magnesium levels.',
        true
      );
    }
  }

  // 3. Bleeding Disorders / Peptic Ulcer + Multiple Hemostatic Inhibitors
  if (activeConditions.has('bleeding-disorders') || activeConditions.has('peptic-ulcer')) {
    const activeBleedCondition = activeConditions.has('bleeding-disorders') ? 'bleeding-disorders' : 'peptic-ulcer';
    const activeBleedName = activeConditions.has('bleeding-disorders') ? 'Bleeding Disorders' : 'Peptic Ulcer Disease';
    const bloodThinners = substances.filter(
      s => has(s, 'anticoagulant') || has(s, 'antiplatelet') || has(s, 'nsaid')
    );
    if (bloodThinners.length >= 2) {
      addCombo(
        activeBleedCondition,
        activeBleedName,
        bloodThinners,
        'contraindicated',
        'Life-Threatening Combination: Massive Hemorrhage',
        `The patient has ${activeBleedName} and is taking multiple agents that impair hemostasis (${bloodThinners.map(b => b.name).join(', ')}). This synergetic inhibition of clotting factors, platelet function, and gastric mucosal protection carries an extreme risk of massive gastrointestinal bleeding or intracranial hemorrhage.`,
        'Contraindicated combination. Avoid concurrent use of multiple anticoagulants, antiplatelets, or NSAIDs. Implement gastric acid protection (e.g. PPIs) if exposure is unavoidable and monitor hemoglobin levels.',
        true
      );
    }
  }

  // 4. Chronic Kidney Disease + Multiple Nephrotoxic Drugs
  if (activeConditions.has('ckd')) {
    const nephrotoxins = substances.filter(s => has(s, 'nephrotoxic'));
    if (nephrotoxins.length >= 2) {
      addCombo(
        'ckd',
        'Chronic Kidney Disease',
        nephrotoxins,
        'contraindicated',
        'Life-Threatening Combination: Acute Kidney Injury',
        `The patient has CKD and is taking multiple nephrotoxic drugs (${nephrotoxins.map(n => n.name).join(', ')}). A classic example is the "triple whammy" (NSAID + diuretic + ACE inhibitor/ARB), which severely reduces renal perfusion pressure and precipitates acute renal failure.`,
        'Contraindicated combination. Discontinue non-essential nephrotoxins (especially NSAIDs). Monitor serum creatinine, potassium, and blood urea nitrogen (BUN) daily.',
        true
      );
    }
  }

  // 5. Liver Cirrhosis + Multiple Hepatotoxic Agents
  if (activeConditions.has('liver-cirrhosis')) {
    const hepatotoxins = substances.filter(s => has(s, 'hepatotoxic') || s.id === 'alcohol');
    if (hepatotoxins.length >= 2) {
      addCombo(
        'liver-cirrhosis',
        'Liver Cirrhosis / Impairment',
        hepatotoxins,
        'contraindicated',
        'Life-Threatening Combination: Acute Liver Failure',
        `The patient has Liver Cirrhosis and is taking multiple hepatotoxic substances or alcohol (${hepatotoxins.map(h => h.name).join(', ')}). This can completely exhaust glutathione stores and lead to fulminant hepatic necrosis, worsening encephalopathy, and death.`,
        'Contraindicated combination. Discontinue all hepatotoxins. Monitor LFTs, INR, ammonia, and neurological status closely.',
        true
      );
    }
  }

  return warnings.sort((a, b) => {
    // Sort contraindicated first, then major, moderate, minor
    const rank = (s: ConditionWarning['severity']) => 
      s === 'contraindicated' ? 3 : s === 'major' ? 2 : s === 'moderate' ? 1 : 0;
    return rank(b.severity) - rank(a.severity);
  });
}
