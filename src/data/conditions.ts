import type { PreexistingCondition } from './types';

export const conditions: PreexistingCondition[] = [
  {
    id: 'asthma',
    name: 'Asthma',
    category: 'Respiratory',
    description: 'Chronic inflammatory disease of the airways causing airway hyperresponsiveness and bronchospasm.',
  },
  {
    id: 'sleep-apnea-copd',
    name: 'COPD / Sleep Apnea',
    category: 'Respiratory',
    description: 'Chronic obstructive pulmonary disease or sleep apnea causing compromised respiratory drive and hypercapnia risk.',
  },
  {
    id: 'epilepsy',
    name: 'Epilepsy / Seizure Disorder',
    category: 'Neurological',
    description: 'Neurological disorder characterised by recurrent, unprovoked seizures due to abnormal electrical activity.',
  },
  {
    id: 'parkinson',
    name: "Parkinson's Disease",
    category: 'Neurological',
    description: 'Progressive nervous system disorder affecting movement, characterised by loss of dopaminergic neurons.',
  },
  {
    id: 'hypertension',
    name: 'Hypertension',
    category: 'Cardiovascular',
    description: 'Chronic elevation of systemic arterial blood pressure.',
  },
  {
    id: 'heart-failure',
    name: 'Heart Failure',
    category: 'Cardiovascular',
    description: 'Inability of the heart to pump blood efficiently, leading to fluid retention and dyspnoea.',
  },
  {
    id: 'cad',
    name: 'Coronary Artery Disease',
    category: 'Cardiovascular',
    description: 'Narrowing or blockage of the coronary arteries, reducing blood flow to the myocardium.',
  },
  {
    id: 'long-qt',
    name: 'Long QT Syndrome',
    category: 'Cardiovascular',
    description: 'Cardiac repolarisation disorder causing prolonged QT intervals, predisposing to Torsades de Pointes.',
  },
  {
    id: 'ckd',
    name: 'Chronic Kidney Disease',
    category: 'Renal',
    description: 'Gradual loss of renal function (reduced GFR), leading to accumulation of renally excreted drugs.',
  },
  {
    id: 'liver-cirrhosis',
    name: 'Liver Cirrhosis / Impairment',
    category: 'Hepatic',
    description: 'Advanced hepatic scarring and tissue loss, severely reducing metabolic clearance (CYP450 activity).',
  },
  {
    id: 'diabetes',
    name: 'Diabetes Mellitus',
    category: 'Endocrine',
    description: 'Chronic metabolic disorder characterised by hyperglycaemia due to insulin resistance or deficiency.',
  },
  {
    id: 'thyroid-dysfunction',
    name: 'Thyroid Dysfunction',
    category: 'Endocrine',
    description: 'Hypothyroidism or hyperthyroidism, affecting systemic metabolic rate and cardiovascular sensitivity.',
  },
  {
    id: 'gout',
    name: 'Gout',
    category: 'Metabolic',
    description: 'Inflammatory arthritis caused by deposition of monosodium urate crystals in joints due to hyperuricaemia.',
  },
  {
    id: 'bleeding-disorders',
    name: 'Bleeding Disorders / Active Bleed',
    category: 'Hematologic',
    description: 'Coagulation defects (e.g. haemophilia, thrombocytopenia) or active hemorrhage, increasing bleeding risks.',
  },
  {
    id: 'peptic-ulcer',
    name: 'Peptic Ulcer Disease',
    category: 'GI',
    description: 'Ulcerations in the lining of the stomach or duodenum, highly susceptible to bleeding or perforation.',
  },
  {
    id: 'g6pd-deficiency',
    name: 'G6PD Deficiency',
    category: 'Metabolic',
    description: 'Genetic enzymatic deficiency predisposing red blood cells to haemolytic crisis under oxidative stress.',
  },
  {
    id: 'glaucoma',
    name: 'Angle-Closure Glaucoma',
    category: 'Ophthalmic',
    description: 'Ophthalmic condition where the drainage angle of the eye narrows, risking acute intraocular pressure spikes.',
  },
  {
    id: 'pregnancy',
    name: 'Pregnancy',
    category: 'OB/GYN',
    description: 'Active pregnancy; requires careful monitoring of teratogenic risk categories (FDA A/B/C/D/X).',
  },
  {
    id: 'breastfeeding',
    name: 'Breastfeeding / Lactation',
    category: 'OB/GYN',
    description: 'Lactating patient; drugs may be excreted in breast milk and affect the nursing infant.',
  },
  {
    id: 'depression',
    name: 'Depression / Anxiety',
    category: 'Psychiatric',
    description: 'Mood disorders characterised by persistent sadness, anxiety, or alterations in monoamine neurotransmission.',
  },
];
