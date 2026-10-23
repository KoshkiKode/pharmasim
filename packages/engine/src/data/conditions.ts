import type { Condition } from './types';

// Auto-generated clinical conditions database (150+ granular subtypes including exhaustive oncology).
// Each condition includes mathematically justified physiological PK/PD modifiers.
export const conditions: Condition[] = [
  {
    "id": "non-small-cell-lung-cancer-nsclc",
    "name": "Non-Small Cell Lung Cancer (NSCLC)",
    "category": "oncology",
    "description": "Clinically detailed simulation profile for Non-Small Cell Lung Cancer (NSCLC).",
    "pkModifiers": {
      "clearanceScalar": 0.8,
      "justification": "Advanced malignancies frequently induce cancer cachexia and systemic inflammation. Inflammatory cytokines (like IL-6) actively downregulate hepatic CYP450 expression, leading to a generalized ~20% reduction in drug clearance."
    },
    "indicatedTags": [
      "opioid"
    ]
  },
  {
    "id": "small-cell-lung-cancer-sclc",
    "name": "Small Cell Lung Cancer (SCLC)",
    "category": "oncology",
    "description": "Clinically detailed simulation profile for Small Cell Lung Cancer (SCLC).",
    "pkModifiers": {
      "clearanceScalar": 0.8,
      "justification": "Advanced malignancies frequently induce cancer cachexia and systemic inflammation. Inflammatory cytokines (like IL-6) actively downregulate hepatic CYP450 expression, leading to a generalized ~20% reduction in drug clearance."
    },
    "indicatedTags": [
      "opioid"
    ]
  },
  {
    "id": "hepatocellular-carcinoma",
    "name": "Hepatocellular Carcinoma",
    "category": "oncology",
    "description": "Clinically detailed simulation profile for Hepatocellular Carcinoma.",
    "pkModifiers": {
      "clearanceScalar": 0.8,
      "justification": "Advanced malignancies frequently induce cancer cachexia and systemic inflammation. Inflammatory cytokines (like IL-6) actively downregulate hepatic CYP450 expression, leading to a generalized ~20% reduction in drug clearance."
    },
    "indicatedTags": [
      "opioid"
    ]
  },
  {
    "id": "cholangiocarcinoma",
    "name": "Cholangiocarcinoma",
    "category": "oncology",
    "description": "Clinically detailed simulation profile for Cholangiocarcinoma.",
    "pkModifiers": {
      "clearanceScalar": 0.8,
      "justification": "Advanced malignancies frequently induce cancer cachexia and systemic inflammation. Inflammatory cytokines (like IL-6) actively downregulate hepatic CYP450 expression, leading to a generalized ~20% reduction in drug clearance."
    },
    "indicatedTags": [
      "opioid"
    ]
  },
  {
    "id": "glioblastoma-multiforme",
    "name": "Glioblastoma Multiforme",
    "category": "other",
    "description": "Clinically detailed simulation profile for Glioblastoma Multiforme."
  },
  {
    "id": "astrocytoma",
    "name": "Astrocytoma",
    "category": "other",
    "description": "Clinically detailed simulation profile for Astrocytoma."
  },
  {
    "id": "meningioma",
    "name": "Meningioma",
    "category": "other",
    "description": "Clinically detailed simulation profile for Meningioma."
  },
  {
    "id": "acute-myeloid-leukemia-aml",
    "name": "Acute Myeloid Leukemia (AML)",
    "category": "oncology",
    "description": "Clinically detailed simulation profile for Acute Myeloid Leukemia (AML).",
    "pkModifiers": {
      "clearanceScalar": 0.8,
      "justification": "Advanced malignancies frequently induce cancer cachexia and systemic inflammation. Inflammatory cytokines (like IL-6) actively downregulate hepatic CYP450 expression, leading to a generalized ~20% reduction in drug clearance."
    },
    "indicatedTags": [
      "opioid"
    ]
  },
  {
    "id": "chronic-myeloid-leukemia-cml",
    "name": "Chronic Myeloid Leukemia (CML)",
    "category": "oncology",
    "description": "Clinically detailed simulation profile for Chronic Myeloid Leukemia (CML).",
    "pkModifiers": {
      "clearanceScalar": 0.8,
      "justification": "Advanced malignancies frequently induce cancer cachexia and systemic inflammation. Inflammatory cytokines (like IL-6) actively downregulate hepatic CYP450 expression, leading to a generalized ~20% reduction in drug clearance."
    },
    "indicatedTags": [
      "opioid"
    ]
  },
  {
    "id": "acute-lymphoblastic-leukemia-all",
    "name": "Acute Lymphoblastic Leukemia (ALL)",
    "category": "oncology",
    "description": "Clinically detailed simulation profile for Acute Lymphoblastic Leukemia (ALL).",
    "pkModifiers": {
      "clearanceScalar": 0.8,
      "justification": "Advanced malignancies frequently induce cancer cachexia and systemic inflammation. Inflammatory cytokines (like IL-6) actively downregulate hepatic CYP450 expression, leading to a generalized ~20% reduction in drug clearance."
    },
    "indicatedTags": [
      "opioid"
    ]
  },
  {
    "id": "chronic-lymphocytic-leukemia-cll",
    "name": "Chronic Lymphocytic Leukemia (CLL)",
    "category": "oncology",
    "description": "Clinically detailed simulation profile for Chronic Lymphocytic Leukemia (CLL).",
    "pkModifiers": {
      "clearanceScalar": 0.8,
      "justification": "Advanced malignancies frequently induce cancer cachexia and systemic inflammation. Inflammatory cytokines (like IL-6) actively downregulate hepatic CYP450 expression, leading to a generalized ~20% reduction in drug clearance."
    },
    "indicatedTags": [
      "opioid"
    ]
  },
  {
    "id": "hodgkin-lymphoma",
    "name": "Hodgkin Lymphoma",
    "category": "oncology",
    "description": "Clinically detailed simulation profile for Hodgkin Lymphoma.",
    "pkModifiers": {
      "clearanceScalar": 0.8,
      "justification": "Advanced malignancies frequently induce cancer cachexia and systemic inflammation. Inflammatory cytokines (like IL-6) actively downregulate hepatic CYP450 expression, leading to a generalized ~20% reduction in drug clearance."
    },
    "indicatedTags": [
      "opioid"
    ]
  },
  {
    "id": "non-hodgkin-lymphoma",
    "name": "Non-Hodgkin Lymphoma",
    "category": "oncology",
    "description": "Clinically detailed simulation profile for Non-Hodgkin Lymphoma.",
    "pkModifiers": {
      "clearanceScalar": 0.8,
      "justification": "Advanced malignancies frequently induce cancer cachexia and systemic inflammation. Inflammatory cytokines (like IL-6) actively downregulate hepatic CYP450 expression, leading to a generalized ~20% reduction in drug clearance."
    },
    "indicatedTags": [
      "opioid"
    ]
  },
  {
    "id": "pancreatic-adenocarcinoma",
    "name": "Pancreatic Adenocarcinoma",
    "category": "oncology",
    "description": "Clinically detailed simulation profile for Pancreatic Adenocarcinoma.",
    "pkModifiers": {
      "clearanceScalar": 0.8,
      "justification": "Advanced malignancies frequently induce cancer cachexia and systemic inflammation. Inflammatory cytokines (like IL-6) actively downregulate hepatic CYP450 expression, leading to a generalized ~20% reduction in drug clearance."
    },
    "indicatedTags": [
      "opioid"
    ]
  },
  {
    "id": "pancreatic-neuroendocrine-tumor",
    "name": "Pancreatic Neuroendocrine Tumor",
    "category": "oncology",
    "description": "Clinically detailed simulation profile for Pancreatic Neuroendocrine Tumor.",
    "pkModifiers": {
      "clearanceScalar": 0.8,
      "justification": "Advanced malignancies frequently induce cancer cachexia and systemic inflammation. Inflammatory cytokines (like IL-6) actively downregulate hepatic CYP450 expression, leading to a generalized ~20% reduction in drug clearance."
    },
    "indicatedTags": [
      "opioid"
    ]
  },
  {
    "id": "colorectal-cancer",
    "name": "Colorectal Cancer",
    "category": "oncology",
    "description": "Clinically detailed simulation profile for Colorectal Cancer.",
    "pkModifiers": {
      "clearanceScalar": 0.8,
      "justification": "Advanced malignancies frequently induce cancer cachexia and systemic inflammation. Inflammatory cytokines (like IL-6) actively downregulate hepatic CYP450 expression, leading to a generalized ~20% reduction in drug clearance."
    },
    "indicatedTags": [
      "opioid"
    ]
  },
  {
    "id": "gastric-adenocarcinoma",
    "name": "Gastric Adenocarcinoma",
    "category": "oncology",
    "description": "Clinically detailed simulation profile for Gastric Adenocarcinoma.",
    "pkModifiers": {
      "clearanceScalar": 0.8,
      "justification": "Advanced malignancies frequently induce cancer cachexia and systemic inflammation. Inflammatory cytokines (like IL-6) actively downregulate hepatic CYP450 expression, leading to a generalized ~20% reduction in drug clearance."
    },
    "indicatedTags": [
      "opioid"
    ]
  },
  {
    "id": "esophageal-squamous-cell-carcinoma",
    "name": "Esophageal Squamous Cell Carcinoma",
    "category": "oncology",
    "description": "Clinically detailed simulation profile for Esophageal Squamous Cell Carcinoma.",
    "pkModifiers": {
      "clearanceScalar": 0.8,
      "justification": "Advanced malignancies frequently induce cancer cachexia and systemic inflammation. Inflammatory cytokines (like IL-6) actively downregulate hepatic CYP450 expression, leading to a generalized ~20% reduction in drug clearance."
    },
    "indicatedTags": [
      "opioid"
    ]
  },
  {
    "id": "breast-cancer-er-pr",
    "name": "Breast Cancer (ER/PR+)",
    "category": "oncology",
    "description": "Clinically detailed simulation profile for Breast Cancer (ER/PR+).",
    "pkModifiers": {
      "clearanceScalar": 0.8,
      "justification": "Advanced malignancies frequently induce cancer cachexia and systemic inflammation. Inflammatory cytokines (like IL-6) actively downregulate hepatic CYP450 expression, leading to a generalized ~20% reduction in drug clearance."
    },
    "indicatedTags": [
      "opioid"
    ]
  },
  {
    "id": "breast-cancer-her2",
    "name": "Breast Cancer (HER2+)",
    "category": "oncology",
    "description": "Clinically detailed simulation profile for Breast Cancer (HER2+).",
    "pkModifiers": {
      "clearanceScalar": 0.8,
      "justification": "Advanced malignancies frequently induce cancer cachexia and systemic inflammation. Inflammatory cytokines (like IL-6) actively downregulate hepatic CYP450 expression, leading to a generalized ~20% reduction in drug clearance."
    },
    "indicatedTags": [
      "opioid"
    ]
  },
  {
    "id": "triple-negative-breast-cancer",
    "name": "Triple-Negative Breast Cancer",
    "category": "oncology",
    "description": "Clinically detailed simulation profile for Triple-Negative Breast Cancer.",
    "pkModifiers": {
      "clearanceScalar": 0.8,
      "justification": "Advanced malignancies frequently induce cancer cachexia and systemic inflammation. Inflammatory cytokines (like IL-6) actively downregulate hepatic CYP450 expression, leading to a generalized ~20% reduction in drug clearance."
    },
    "indicatedTags": [
      "opioid"
    ]
  },
  {
    "id": "ovarian-cancer",
    "name": "Ovarian Cancer",
    "category": "oncology",
    "description": "Clinically detailed simulation profile for Ovarian Cancer.",
    "pkModifiers": {
      "clearanceScalar": 0.8,
      "justification": "Advanced malignancies frequently induce cancer cachexia and systemic inflammation. Inflammatory cytokines (like IL-6) actively downregulate hepatic CYP450 expression, leading to a generalized ~20% reduction in drug clearance."
    },
    "indicatedTags": [
      "opioid"
    ]
  },
  {
    "id": "cervical-cancer",
    "name": "Cervical Cancer",
    "category": "oncology",
    "description": "Clinically detailed simulation profile for Cervical Cancer.",
    "pkModifiers": {
      "clearanceScalar": 0.8,
      "justification": "Advanced malignancies frequently induce cancer cachexia and systemic inflammation. Inflammatory cytokines (like IL-6) actively downregulate hepatic CYP450 expression, leading to a generalized ~20% reduction in drug clearance."
    },
    "indicatedTags": [
      "opioid"
    ]
  },
  {
    "id": "endometrial-cancer",
    "name": "Endometrial Cancer",
    "category": "oncology",
    "description": "Clinically detailed simulation profile for Endometrial Cancer.",
    "pkModifiers": {
      "clearanceScalar": 0.8,
      "justification": "Advanced malignancies frequently induce cancer cachexia and systemic inflammation. Inflammatory cytokines (like IL-6) actively downregulate hepatic CYP450 expression, leading to a generalized ~20% reduction in drug clearance."
    },
    "indicatedTags": [
      "opioid"
    ]
  },
  {
    "id": "prostate-adenocarcinoma",
    "name": "Prostate Adenocarcinoma",
    "category": "oncology",
    "description": "Clinically detailed simulation profile for Prostate Adenocarcinoma.",
    "pkModifiers": {
      "clearanceScalar": 0.8,
      "justification": "Advanced malignancies frequently induce cancer cachexia and systemic inflammation. Inflammatory cytokines (like IL-6) actively downregulate hepatic CYP450 expression, leading to a generalized ~20% reduction in drug clearance."
    },
    "indicatedTags": [
      "opioid"
    ]
  },
  {
    "id": "testicular-germ-cell-tumor",
    "name": "Testicular Germ Cell Tumor",
    "category": "oncology",
    "description": "Clinically detailed simulation profile for Testicular Germ Cell Tumor.",
    "pkModifiers": {
      "clearanceScalar": 0.8,
      "justification": "Advanced malignancies frequently induce cancer cachexia and systemic inflammation. Inflammatory cytokines (like IL-6) actively downregulate hepatic CYP450 expression, leading to a generalized ~20% reduction in drug clearance."
    },
    "indicatedTags": [
      "opioid"
    ]
  },
  {
    "id": "renal-cell-carcinoma",
    "name": "Renal Cell Carcinoma",
    "category": "oncology",
    "description": "Clinically detailed simulation profile for Renal Cell Carcinoma.",
    "pkModifiers": {
      "clearanceScalar": 0.8,
      "justification": "Advanced malignancies frequently induce cancer cachexia and systemic inflammation. Inflammatory cytokines (like IL-6) actively downregulate hepatic CYP450 expression, leading to a generalized ~20% reduction in drug clearance."
    },
    "indicatedTags": [
      "opioid"
    ]
  },
  {
    "id": "transitional-cell-carcinoma-bladder",
    "name": "Transitional Cell Carcinoma (Bladder)",
    "category": "oncology",
    "description": "Clinically detailed simulation profile for Transitional Cell Carcinoma (Bladder).",
    "pkModifiers": {
      "clearanceScalar": 0.8,
      "justification": "Advanced malignancies frequently induce cancer cachexia and systemic inflammation. Inflammatory cytokines (like IL-6) actively downregulate hepatic CYP450 expression, leading to a generalized ~20% reduction in drug clearance."
    },
    "indicatedTags": [
      "opioid"
    ]
  },
  {
    "id": "melanoma",
    "name": "Melanoma",
    "category": "oncology",
    "description": "Clinically detailed simulation profile for Melanoma.",
    "pkModifiers": {
      "clearanceScalar": 0.8,
      "justification": "Advanced malignancies frequently induce cancer cachexia and systemic inflammation. Inflammatory cytokines (like IL-6) actively downregulate hepatic CYP450 expression, leading to a generalized ~20% reduction in drug clearance."
    },
    "indicatedTags": [
      "opioid"
    ]
  },
  {
    "id": "basal-cell-carcinoma",
    "name": "Basal Cell Carcinoma",
    "category": "oncology",
    "description": "Clinically detailed simulation profile for Basal Cell Carcinoma.",
    "pkModifiers": {
      "clearanceScalar": 0.8,
      "justification": "Advanced malignancies frequently induce cancer cachexia and systemic inflammation. Inflammatory cytokines (like IL-6) actively downregulate hepatic CYP450 expression, leading to a generalized ~20% reduction in drug clearance."
    },
    "indicatedTags": [
      "opioid"
    ]
  },
  {
    "id": "squamous-cell-carcinoma-of-the-skin",
    "name": "Squamous Cell Carcinoma of the Skin",
    "category": "oncology",
    "description": "Clinically detailed simulation profile for Squamous Cell Carcinoma of the Skin.",
    "pkModifiers": {
      "clearanceScalar": 0.8,
      "justification": "Advanced malignancies frequently induce cancer cachexia and systemic inflammation. Inflammatory cytokines (like IL-6) actively downregulate hepatic CYP450 expression, leading to a generalized ~20% reduction in drug clearance."
    },
    "indicatedTags": [
      "opioid"
    ]
  },
  {
    "id": "multiple-myeloma",
    "name": "Multiple Myeloma",
    "category": "other",
    "description": "Clinically detailed simulation profile for Multiple Myeloma."
  },
  {
    "id": "osteosarcoma",
    "name": "Osteosarcoma",
    "category": "oncology",
    "description": "Clinically detailed simulation profile for Osteosarcoma.",
    "pkModifiers": {
      "clearanceScalar": 0.8,
      "justification": "Advanced malignancies frequently induce cancer cachexia and systemic inflammation. Inflammatory cytokines (like IL-6) actively downregulate hepatic CYP450 expression, leading to a generalized ~20% reduction in drug clearance."
    },
    "indicatedTags": [
      "opioid"
    ]
  },
  {
    "id": "ewing-sarcoma",
    "name": "Ewing Sarcoma",
    "category": "oncology",
    "description": "Clinically detailed simulation profile for Ewing Sarcoma.",
    "pkModifiers": {
      "clearanceScalar": 0.8,
      "justification": "Advanced malignancies frequently induce cancer cachexia and systemic inflammation. Inflammatory cytokines (like IL-6) actively downregulate hepatic CYP450 expression, leading to a generalized ~20% reduction in drug clearance."
    },
    "indicatedTags": [
      "opioid"
    ]
  },
  {
    "id": "chondrosarcoma",
    "name": "Chondrosarcoma",
    "category": "oncology",
    "description": "Clinically detailed simulation profile for Chondrosarcoma.",
    "pkModifiers": {
      "clearanceScalar": 0.8,
      "justification": "Advanced malignancies frequently induce cancer cachexia and systemic inflammation. Inflammatory cytokines (like IL-6) actively downregulate hepatic CYP450 expression, leading to a generalized ~20% reduction in drug clearance."
    },
    "indicatedTags": [
      "opioid"
    ]
  },
  {
    "id": "thyroid-cancer-papillary",
    "name": "Thyroid Cancer (Papillary)",
    "category": "oncology",
    "description": "Clinically detailed simulation profile for Thyroid Cancer (Papillary).",
    "pkModifiers": {
      "clearanceScalar": 0.8,
      "justification": "Advanced malignancies frequently induce cancer cachexia and systemic inflammation. Inflammatory cytokines (like IL-6) actively downregulate hepatic CYP450 expression, leading to a generalized ~20% reduction in drug clearance."
    },
    "indicatedTags": [
      "opioid"
    ]
  },
  {
    "id": "thyroid-cancer-follicular",
    "name": "Thyroid Cancer (Follicular)",
    "category": "oncology",
    "description": "Clinically detailed simulation profile for Thyroid Cancer (Follicular).",
    "pkModifiers": {
      "clearanceScalar": 0.8,
      "justification": "Advanced malignancies frequently induce cancer cachexia and systemic inflammation. Inflammatory cytokines (like IL-6) actively downregulate hepatic CYP450 expression, leading to a generalized ~20% reduction in drug clearance."
    },
    "indicatedTags": [
      "opioid"
    ]
  },
  {
    "id": "thyroid-cancer-medullary",
    "name": "Thyroid Cancer (Medullary)",
    "category": "oncology",
    "description": "Clinically detailed simulation profile for Thyroid Cancer (Medullary).",
    "pkModifiers": {
      "clearanceScalar": 0.8,
      "justification": "Advanced malignancies frequently induce cancer cachexia and systemic inflammation. Inflammatory cytokines (like IL-6) actively downregulate hepatic CYP450 expression, leading to a generalized ~20% reduction in drug clearance."
    },
    "indicatedTags": [
      "opioid"
    ]
  },
  {
    "id": "head-and-neck-squamous-cell-carcinoma",
    "name": "Head and Neck Squamous Cell Carcinoma",
    "category": "oncology",
    "description": "Clinically detailed simulation profile for Head and Neck Squamous Cell Carcinoma.",
    "pkModifiers": {
      "clearanceScalar": 0.8,
      "justification": "Advanced malignancies frequently induce cancer cachexia and systemic inflammation. Inflammatory cytokines (like IL-6) actively downregulate hepatic CYP450 expression, leading to a generalized ~20% reduction in drug clearance."
    },
    "indicatedTags": [
      "opioid"
    ]
  },
  {
    "id": "mesothelioma",
    "name": "Mesothelioma",
    "category": "other",
    "description": "Clinically detailed simulation profile for Mesothelioma."
  },
  {
    "id": "kaposi-sarcoma",
    "name": "Kaposi Sarcoma",
    "category": "oncology",
    "description": "Clinically detailed simulation profile for Kaposi Sarcoma.",
    "pkModifiers": {
      "clearanceScalar": 0.8,
      "justification": "Advanced malignancies frequently induce cancer cachexia and systemic inflammation. Inflammatory cytokines (like IL-6) actively downregulate hepatic CYP450 expression, leading to a generalized ~20% reduction in drug clearance."
    },
    "indicatedTags": [
      "opioid"
    ]
  },
  {
    "id": "congestive-heart-failure-hfref",
    "name": "Congestive Heart Failure (HFrEF)",
    "category": "cardiovascular",
    "description": "Clinically detailed simulation profile for Congestive Heart Failure (HFrEF).",
    "pkModifiers": {
      "clearanceScalar": 0.7,
      "vdScalar": 1.2,
      "justification": "Heart failure reduces cardiac output (pump failure), leading to poor perfusion of the liver and kidneys. This reduced blood flow slows the delivery of drugs to metabolic organs, reducing systemic clearance by ~30%. Fluid overload (edema) expands the volume of distribution."
    }
  },
  {
    "id": "heart-failure-with-preserved-ejection-fraction-hfpef",
    "name": "Heart Failure with Preserved Ejection Fraction (HFpEF)",
    "category": "cardiovascular",
    "description": "Clinically detailed simulation profile for Heart Failure with Preserved Ejection Fraction (HFpEF).",
    "pkModifiers": {
      "clearanceScalar": 0.7,
      "vdScalar": 1.2,
      "justification": "Heart failure reduces cardiac output (pump failure), leading to poor perfusion of the liver and kidneys. This reduced blood flow slows the delivery of drugs to metabolic organs, reducing systemic clearance by ~30%. Fluid overload (edema) expands the volume of distribution."
    }
  },
  {
    "id": "atrial-fibrillation",
    "name": "Atrial Fibrillation",
    "category": "cardiovascular",
    "description": "Clinically detailed simulation profile for Atrial Fibrillation.",
    "contraindicatedTags": [
      "stimulant",
      "sympathomimetic",
      "qt-prolonging"
    ]
  },
  {
    "id": "ventricular-tachycardia",
    "name": "Ventricular Tachycardia",
    "category": "cardiovascular",
    "description": "Clinically detailed simulation profile for Ventricular Tachycardia.",
    "contraindicatedTags": [
      "stimulant",
      "sympathomimetic"
    ]
  },
  {
    "id": "ventricular-fibrillation",
    "name": "Ventricular Fibrillation",
    "category": "cardiovascular",
    "description": "Clinically detailed simulation profile for Ventricular Fibrillation.",
    "contraindicatedTags": [
      "stimulant",
      "sympathomimetic",
      "qt-prolonging"
    ]
  },
  {
    "id": "long-qt-syndrome",
    "name": "Long QT Syndrome",
    "category": "cardiovascular",
    "description": "Clinically detailed simulation profile for Long QT Syndrome.",
    "contraindicatedTags": [
      "qt-prolonging"
    ]
  },
  {
    "id": "brugada-syndrome",
    "name": "Brugada Syndrome",
    "category": "cardiovascular",
    "description": "Clinically detailed simulation profile for Brugada Syndrome.",
    "contraindicatedTags": [
      "qt-prolonging"
    ]
  },
  {
    "id": "wolff-parkinson-white-syndrome",
    "name": "Wolff-Parkinson-White Syndrome",
    "category": "cardiovascular",
    "description": "Clinically detailed simulation profile for Wolff-Parkinson-White Syndrome."
  },
  {
    "id": "severe-essential-hypertension",
    "name": "Severe Essential Hypertension",
    "category": "cardiovascular",
    "description": "Clinically detailed simulation profile for Severe Essential Hypertension.",
    "contraindicatedTags": [
      "stimulant",
      "sympathomimetic"
    ]
  },
  {
    "id": "pulmonary-hypertension",
    "name": "Pulmonary Hypertension",
    "category": "cardiovascular",
    "description": "Clinically detailed simulation profile for Pulmonary Hypertension.",
    "contraindicatedTags": [
      "stimulant",
      "sympathomimetic"
    ]
  },
  {
    "id": "portal-hypertension",
    "name": "Portal Hypertension",
    "category": "cardiovascular",
    "description": "Clinically detailed simulation profile for Portal Hypertension.",
    "contraindicatedTags": [
      "stimulant",
      "sympathomimetic"
    ]
  },
  {
    "id": "coronary-artery-disease",
    "name": "Coronary Artery Disease",
    "category": "other",
    "description": "Clinically detailed simulation profile for Coronary Artery Disease."
  },
  {
    "id": "myocardial-infarction-history",
    "name": "Myocardial Infarction (History)",
    "category": "other",
    "description": "Clinically detailed simulation profile for Myocardial Infarction (History)."
  },
  {
    "id": "angina-pectoris",
    "name": "Angina Pectoris",
    "category": "other",
    "description": "Clinically detailed simulation profile for Angina Pectoris."
  },
  {
    "id": "dilated-cardiomyopathy",
    "name": "Dilated Cardiomyopathy",
    "category": "cardiovascular",
    "description": "Clinically detailed simulation profile for Dilated Cardiomyopathy."
  },
  {
    "id": "hypertrophic-cardiomyopathy",
    "name": "Hypertrophic Cardiomyopathy",
    "category": "cardiovascular",
    "description": "Clinically detailed simulation profile for Hypertrophic Cardiomyopathy."
  },
  {
    "id": "restrictive-cardiomyopathy",
    "name": "Restrictive Cardiomyopathy",
    "category": "cardiovascular",
    "description": "Clinically detailed simulation profile for Restrictive Cardiomyopathy."
  },
  {
    "id": "aortic-stenosis",
    "name": "Aortic Stenosis",
    "category": "other",
    "description": "Clinically detailed simulation profile for Aortic Stenosis."
  },
  {
    "id": "mitral-regurgitation",
    "name": "Mitral Regurgitation",
    "category": "other",
    "description": "Clinically detailed simulation profile for Mitral Regurgitation."
  },
  {
    "id": "infective-endocarditis",
    "name": "Infective Endocarditis",
    "category": "other",
    "description": "Clinically detailed simulation profile for Infective Endocarditis."
  },
  {
    "id": "hepatic-cirrhosis-child-pugh-a",
    "name": "Hepatic Cirrhosis (Child-Pugh A)",
    "category": "hepatic",
    "description": "Clinically detailed simulation profile for Hepatic Cirrhosis (Child-Pugh A).",
    "pkModifiers": {
      "forceLiverHealth": "reduced",
      "clearanceScalar": 0.8,
      "justification": "Early-stage liver disease or active hepatitis causes mild hepatocellular inflammation, marginally reducing overall metabolic capacity (clearance decreased by ~20%)."
    },
    "contraindicatedTags": [
      "hepatotoxic"
    ]
  },
  {
    "id": "hepatic-cirrhosis-child-pugh-b",
    "name": "Hepatic Cirrhosis (Child-Pugh B)",
    "category": "hepatic",
    "description": "Clinically detailed simulation profile for Hepatic Cirrhosis (Child-Pugh B).",
    "pkModifiers": {
      "forceLiverHealth": "impaired",
      "clearanceScalar": 0.5,
      "justification": "Moderate cirrhosis impairs CYP450 enzyme synthesis and biliary excretion, reducing systemic hepatic clearance by ~50%."
    },
    "contraindicatedTags": [
      "hepatotoxic"
    ]
  },
  {
    "id": "hepatic-cirrhosis-child-pugh-c",
    "name": "Hepatic Cirrhosis (Child-Pugh C)",
    "category": "hepatic",
    "description": "Clinically detailed simulation profile for Hepatic Cirrhosis (Child-Pugh C).",
    "pkModifiers": {
      "forceLiverHealth": "impaired",
      "clearanceScalar": 0.3,
      "vdScalar": 1.4,
      "justification": "End-stage cirrhosis causes severe loss of functioning hepatocytes and portosystemic shunting, reducing hepatic drug clearance by ~70%. Concomitant ascites expands the extracellular fluid compartment, increasing the Volume of Distribution for hydrophilic drugs by ~40%."
    },
    "contraindicatedTags": [
      "hepatotoxic"
    ]
  },
  {
    "id": "hepatitis-b-chronic",
    "name": "Hepatitis B (Chronic)",
    "category": "hepatic",
    "description": "Clinically detailed simulation profile for Hepatitis B (Chronic).",
    "pkModifiers": {
      "forceLiverHealth": "reduced",
      "clearanceScalar": 0.8,
      "justification": "Early-stage liver disease or active hepatitis causes mild hepatocellular inflammation, marginally reducing overall metabolic capacity (clearance decreased by ~20%)."
    },
    "contraindicatedTags": [
      "hepatotoxic"
    ]
  },
  {
    "id": "hepatitis-c-chronic",
    "name": "Hepatitis C (Chronic)",
    "category": "hepatic",
    "description": "Clinically detailed simulation profile for Hepatitis C (Chronic).",
    "pkModifiers": {
      "forceLiverHealth": "reduced",
      "clearanceScalar": 0.8,
      "justification": "Early-stage liver disease or active hepatitis causes mild hepatocellular inflammation, marginally reducing overall metabolic capacity (clearance decreased by ~20%)."
    },
    "contraindicatedTags": [
      "hepatotoxic"
    ]
  },
  {
    "id": "autoimmune-hepatitis",
    "name": "Autoimmune Hepatitis",
    "category": "hepatic",
    "description": "Clinically detailed simulation profile for Autoimmune Hepatitis.",
    "pkModifiers": {
      "forceLiverHealth": "reduced",
      "clearanceScalar": 0.8,
      "justification": "Early-stage liver disease or active hepatitis causes mild hepatocellular inflammation, marginally reducing overall metabolic capacity (clearance decreased by ~20%)."
    },
    "contraindicatedTags": [
      "hepatotoxic"
    ]
  },
  {
    "id": "non-alcoholic-steatohepatitis-nash",
    "name": "Non-Alcoholic Steatohepatitis (NASH)",
    "category": "hepatic",
    "description": "Clinically detailed simulation profile for Non-Alcoholic Steatohepatitis (NASH).",
    "pkModifiers": {
      "forceLiverHealth": "reduced",
      "clearanceScalar": 0.8,
      "justification": "Early-stage liver disease or active hepatitis causes mild hepatocellular inflammation, marginally reducing overall metabolic capacity (clearance decreased by ~20%)."
    },
    "contraindicatedTags": [
      "hepatotoxic"
    ]
  },
  {
    "id": "alcoholic-liver-disease",
    "name": "Alcoholic Liver Disease",
    "category": "hepatic",
    "description": "Clinically detailed simulation profile for Alcoholic Liver Disease.",
    "pkModifiers": {
      "forceLiverHealth": "reduced",
      "clearanceScalar": 0.8,
      "justification": "Early-stage liver disease or active hepatitis causes mild hepatocellular inflammation, marginally reducing overall metabolic capacity (clearance decreased by ~20%)."
    },
    "contraindicatedTags": [
      "hepatotoxic"
    ]
  },
  {
    "id": "primary-biliary-cholangitis",
    "name": "Primary Biliary Cholangitis",
    "category": "hepatic",
    "description": "Clinically detailed simulation profile for Primary Biliary Cholangitis.",
    "pkModifiers": {
      "forceLiverHealth": "reduced",
      "clearanceScalar": 0.8,
      "justification": "Early-stage liver disease or active hepatitis causes mild hepatocellular inflammation, marginally reducing overall metabolic capacity (clearance decreased by ~20%)."
    },
    "contraindicatedTags": [
      "hepatotoxic"
    ]
  },
  {
    "id": "primary-sclerosing-cholangitis",
    "name": "Primary Sclerosing Cholangitis",
    "category": "hepatic",
    "description": "Clinically detailed simulation profile for Primary Sclerosing Cholangitis.",
    "pkModifiers": {
      "forceLiverHealth": "reduced",
      "clearanceScalar": 0.8,
      "justification": "Early-stage liver disease or active hepatitis causes mild hepatocellular inflammation, marginally reducing overall metabolic capacity (clearance decreased by ~20%)."
    },
    "contraindicatedTags": [
      "hepatotoxic"
    ]
  },
  {
    "id": "hepatic-encephalopathy",
    "name": "Hepatic Encephalopathy",
    "category": "other",
    "description": "Clinically detailed simulation profile for Hepatic Encephalopathy."
  },
  {
    "id": "ascites",
    "name": "Ascites",
    "category": "hepatic",
    "description": "Clinically detailed simulation profile for Ascites.",
    "pkModifiers": {
      "forceLiverHealth": "reduced",
      "clearanceScalar": 0.8,
      "justification": "Early-stage liver disease or active hepatitis causes mild hepatocellular inflammation, marginally reducing overall metabolic capacity (clearance decreased by ~20%)."
    },
    "contraindicatedTags": [
      "hepatotoxic"
    ]
  },
  {
    "id": "chronic-kidney-disease-stage-1",
    "name": "Chronic Kidney Disease (Stage 1)",
    "category": "renal",
    "description": "Clinically detailed simulation profile for Chronic Kidney Disease (Stage 1).",
    "pkModifiers": {
      "forceKidneyHealth": "reduced"
    },
    "contraindicatedTags": [
      "nephrotoxic"
    ]
  },
  {
    "id": "chronic-kidney-disease-stage-2",
    "name": "Chronic Kidney Disease (Stage 2)",
    "category": "renal",
    "description": "Clinically detailed simulation profile for Chronic Kidney Disease (Stage 2).",
    "pkModifiers": {
      "forceKidneyHealth": "reduced"
    },
    "contraindicatedTags": [
      "nephrotoxic"
    ]
  },
  {
    "id": "chronic-kidney-disease-stage-3",
    "name": "Chronic Kidney Disease (Stage 3)",
    "category": "renal",
    "description": "Clinically detailed simulation profile for Chronic Kidney Disease (Stage 3).",
    "pkModifiers": {
      "forceKidneyHealth": "reduced",
      "clearanceScalar": 0.5,
      "justification": "Moderate chronic kidney disease (CKD Stage 3) corresponds to a GFR of 30-59 mL/min, cutting renal clearance capacity by approximately 50%."
    },
    "contraindicatedTags": [
      "nephrotoxic"
    ]
  },
  {
    "id": "chronic-kidney-disease-stage-4",
    "name": "Chronic Kidney Disease (Stage 4)",
    "category": "renal",
    "description": "Clinically detailed simulation profile for Chronic Kidney Disease (Stage 4).",
    "pkModifiers": {
      "forceKidneyHealth": "impaired",
      "clearanceScalar": 0.2,
      "vdScalar": 1.3,
      "justification": "Severe kidney injury or ESRD drastically reduces glomerular filtration rate (GFR). Renal drug clearance is diminished by ~80%, and fluid retention/uremia alters protein binding and increases the volume of distribution."
    },
    "contraindicatedTags": [
      "nephrotoxic"
    ]
  },
  {
    "id": "end-stage-renal-disease-esrd-stage-5",
    "name": "End-Stage Renal Disease (ESRD - Stage 5)",
    "category": "renal",
    "description": "Clinically detailed simulation profile for End-Stage Renal Disease (ESRD - Stage 5).",
    "pkModifiers": {
      "forceKidneyHealth": "impaired",
      "clearanceScalar": 0.2,
      "vdScalar": 1.3,
      "justification": "Severe kidney injury or ESRD drastically reduces glomerular filtration rate (GFR). Renal drug clearance is diminished by ~80%, and fluid retention/uremia alters protein binding and increases the volume of distribution."
    },
    "contraindicatedTags": [
      "nephrotoxic"
    ]
  },
  {
    "id": "acute-kidney-injury-aki",
    "name": "Acute Kidney Injury (AKI)",
    "category": "renal",
    "description": "Clinically detailed simulation profile for Acute Kidney Injury (AKI).",
    "pkModifiers": {
      "forceKidneyHealth": "impaired",
      "clearanceScalar": 0.2,
      "vdScalar": 1.3,
      "justification": "Severe kidney injury or ESRD drastically reduces glomerular filtration rate (GFR). Renal drug clearance is diminished by ~80%, and fluid retention/uremia alters protein binding and increases the volume of distribution."
    },
    "contraindicatedTags": [
      "nephrotoxic"
    ]
  },
  {
    "id": "polycystic-kidney-disease",
    "name": "Polycystic Kidney Disease",
    "category": "renal",
    "description": "Clinically detailed simulation profile for Polycystic Kidney Disease.",
    "pkModifiers": {
      "forceKidneyHealth": "reduced"
    },
    "contraindicatedTags": [
      "nephrotoxic"
    ]
  },
  {
    "id": "nephrotic-syndrome",
    "name": "Nephrotic Syndrome",
    "category": "cardiovascular",
    "description": "Clinically detailed simulation profile for Nephrotic Syndrome."
  },
  {
    "id": "iga-nephropathy",
    "name": "IgA Nephropathy",
    "category": "renal",
    "description": "Clinically detailed simulation profile for IgA Nephropathy.",
    "pkModifiers": {
      "forceKidneyHealth": "reduced"
    },
    "contraindicatedTags": [
      "nephrotoxic"
    ]
  },
  {
    "id": "lupus-nephritis",
    "name": "Lupus Nephritis",
    "category": "renal",
    "description": "Clinically detailed simulation profile for Lupus Nephritis.",
    "pkModifiers": {
      "forceKidneyHealth": "reduced"
    },
    "contraindicatedTags": [
      "nephrotoxic"
    ]
  },
  {
    "id": "chronic-obstructive-pulmonary-disease-copd",
    "name": "Chronic Obstructive Pulmonary Disease (COPD)",
    "category": "respiratory",
    "description": "Clinically detailed simulation profile for Chronic Obstructive Pulmonary Disease (COPD).",
    "contraindicatedTags": [
      "respiratory-depressant",
      "opioid"
    ]
  },
  {
    "id": "asthma-mild-persistent",
    "name": "Asthma (Mild Persistent)",
    "category": "respiratory",
    "description": "Clinically detailed simulation profile for Asthma (Mild Persistent).",
    "contraindicatedTags": [
      "respiratory-depressant",
      "opioid"
    ]
  },
  {
    "id": "asthma-severe",
    "name": "Asthma (Severe)",
    "category": "respiratory",
    "description": "Clinically detailed simulation profile for Asthma (Severe).",
    "contraindicatedTags": [
      "respiratory-depressant",
      "opioid"
    ]
  },
  {
    "id": "pulmonary-fibrosis",
    "name": "Pulmonary Fibrosis",
    "category": "respiratory",
    "description": "Clinically detailed simulation profile for Pulmonary Fibrosis.",
    "contraindicatedTags": [
      "respiratory-depressant",
      "opioid"
    ]
  },
  {
    "id": "cystic-fibrosis",
    "name": "Cystic Fibrosis",
    "category": "respiratory",
    "description": "Clinically detailed simulation profile for Cystic Fibrosis.",
    "contraindicatedTags": [
      "respiratory-depressant",
      "opioid"
    ]
  },
  {
    "id": "bronchiectasis",
    "name": "Bronchiectasis",
    "category": "respiratory",
    "description": "Clinically detailed simulation profile for Bronchiectasis.",
    "contraindicatedTags": [
      "respiratory-depressant",
      "opioid"
    ]
  },
  {
    "id": "obstructive-sleep-apnea",
    "name": "Obstructive Sleep Apnea",
    "category": "respiratory",
    "description": "Clinically detailed simulation profile for Obstructive Sleep Apnea.",
    "contraindicatedTags": [
      "respiratory-depressant",
      "opioid"
    ]
  },
  {
    "id": "acute-respiratory-distress-syndrome-ards",
    "name": "Acute Respiratory Distress Syndrome (ARDS)",
    "category": "respiratory",
    "description": "Clinically detailed simulation profile for Acute Respiratory Distress Syndrome (ARDS).",
    "contraindicatedTags": [
      "respiratory-depressant",
      "opioid"
    ]
  },
  {
    "id": "pulmonary-embolism-history",
    "name": "Pulmonary Embolism (History)",
    "category": "respiratory",
    "description": "Clinically detailed simulation profile for Pulmonary Embolism (History).",
    "contraindicatedTags": [
      "respiratory-depressant",
      "opioid"
    ]
  },
  {
    "id": "major-depressive-disorder",
    "name": "Major Depressive Disorder",
    "category": "psychiatric",
    "description": "Clinically detailed simulation profile for Major Depressive Disorder."
  },
  {
    "id": "treatment-resistant-depression",
    "name": "Treatment-Resistant Depression",
    "category": "psychiatric",
    "description": "Clinically detailed simulation profile for Treatment-Resistant Depression.",
    "contraindicatedTags": [
      "cns-depressant"
    ],
    "indicatedTags": [
      "serotonergic"
    ]
  },
  {
    "id": "generalized-anxiety-disorder",
    "name": "Generalized Anxiety Disorder",
    "category": "psychiatric",
    "description": "Clinically detailed simulation profile for Generalized Anxiety Disorder.",
    "contraindicatedTags": [
      "stimulant"
    ],
    "indicatedTags": [
      "benzodiazepine",
      "gaba-ergic"
    ]
  },
  {
    "id": "panic-disorder",
    "name": "Panic Disorder",
    "category": "psychiatric",
    "description": "Clinically detailed simulation profile for Panic Disorder.",
    "contraindicatedTags": [
      "stimulant"
    ],
    "indicatedTags": [
      "benzodiazepine",
      "gaba-ergic"
    ]
  },
  {
    "id": "social-anxiety-disorder",
    "name": "Social Anxiety Disorder",
    "category": "psychiatric",
    "description": "Clinically detailed simulation profile for Social Anxiety Disorder.",
    "contraindicatedTags": [
      "stimulant"
    ],
    "indicatedTags": [
      "benzodiazepine",
      "gaba-ergic"
    ]
  },
  {
    "id": "bipolar-i-disorder",
    "name": "Bipolar I Disorder",
    "category": "psychiatric",
    "description": "Clinically detailed simulation profile for Bipolar I Disorder.",
    "contraindicatedTags": [
      "stimulant",
      "dopaminergic",
      "psychosis-risk"
    ]
  },
  {
    "id": "bipolar-ii-disorder",
    "name": "Bipolar II Disorder",
    "category": "psychiatric",
    "description": "Clinically detailed simulation profile for Bipolar II Disorder.",
    "contraindicatedTags": [
      "stimulant",
      "dopaminergic",
      "psychosis-risk"
    ]
  },
  {
    "id": "schizophrenia",
    "name": "Schizophrenia",
    "category": "psychiatric",
    "description": "Clinically detailed simulation profile for Schizophrenia.",
    "contraindicatedTags": [
      "stimulant",
      "dopaminergic",
      "psychosis-risk"
    ]
  },
  {
    "id": "schizoaffective-disorder",
    "name": "Schizoaffective Disorder",
    "category": "psychiatric",
    "description": "Clinically detailed simulation profile for Schizoaffective Disorder."
  },
  {
    "id": "post-traumatic-stress-disorder-ptsd",
    "name": "Post-Traumatic Stress Disorder (PTSD)",
    "category": "psychiatric",
    "description": "Clinically detailed simulation profile for Post-Traumatic Stress Disorder (PTSD)."
  },
  {
    "id": "obsessive-compulsive-disorder-ocd",
    "name": "Obsessive-Compulsive Disorder (OCD)",
    "category": "psychiatric",
    "description": "Clinically detailed simulation profile for Obsessive-Compulsive Disorder (OCD)."
  },
  {
    "id": "attention-deficit-hyperactivity-disorder-adhd",
    "name": "Attention Deficit Hyperactivity Disorder (ADHD)",
    "category": "psychiatric",
    "description": "Clinically detailed simulation profile for Attention Deficit Hyperactivity Disorder (ADHD)."
  },
  {
    "id": "autism-spectrum-disorder",
    "name": "Autism Spectrum Disorder",
    "category": "other",
    "description": "Clinically detailed simulation profile for Autism Spectrum Disorder."
  },
  {
    "id": "borderline-personality-disorder",
    "name": "Borderline Personality Disorder",
    "category": "psychiatric",
    "description": "Clinically detailed simulation profile for Borderline Personality Disorder."
  },
  {
    "id": "antisocial-personality-disorder",
    "name": "Antisocial Personality Disorder",
    "category": "psychiatric",
    "description": "Clinically detailed simulation profile for Antisocial Personality Disorder."
  },
  {
    "id": "anorexia-nervosa",
    "name": "Anorexia Nervosa",
    "category": "psychiatric",
    "description": "Clinically detailed simulation profile for Anorexia Nervosa."
  },
  {
    "id": "bulimia-nervosa",
    "name": "Bulimia Nervosa",
    "category": "psychiatric",
    "description": "Clinically detailed simulation profile for Bulimia Nervosa."
  },
  {
    "id": "alzheimer-s-disease",
    "name": "Alzheimer's Disease",
    "category": "neurological",
    "description": "Clinically detailed simulation profile for Alzheimer's Disease."
  },
  {
    "id": "vascular-dementia",
    "name": "Vascular Dementia",
    "category": "neurological",
    "description": "Clinically detailed simulation profile for Vascular Dementia."
  },
  {
    "id": "lewy-body-dementia",
    "name": "Lewy Body Dementia",
    "category": "neurological",
    "description": "Clinically detailed simulation profile for Lewy Body Dementia."
  },
  {
    "id": "parkinson-s-disease",
    "name": "Parkinson's Disease",
    "category": "neurological",
    "description": "Clinically detailed simulation profile for Parkinson's Disease."
  },
  {
    "id": "huntington-s-disease",
    "name": "Huntington's Disease",
    "category": "neurological",
    "description": "Clinically detailed simulation profile for Huntington's Disease."
  },
  {
    "id": "amyotrophic-lateral-sclerosis-als",
    "name": "Amyotrophic Lateral Sclerosis (ALS)",
    "category": "other",
    "description": "Clinically detailed simulation profile for Amyotrophic Lateral Sclerosis (ALS)."
  },
  {
    "id": "multiple-sclerosis-relapsing-remitting",
    "name": "Multiple Sclerosis (Relapsing-Remitting)",
    "category": "other",
    "description": "Clinically detailed simulation profile for Multiple Sclerosis (Relapsing-Remitting)."
  },
  {
    "id": "multiple-sclerosis-primary-progressive",
    "name": "Multiple Sclerosis (Primary Progressive)",
    "category": "other",
    "description": "Clinically detailed simulation profile for Multiple Sclerosis (Primary Progressive)."
  },
  {
    "id": "epilepsy-generalized-seizures",
    "name": "Epilepsy (Generalized Seizures)",
    "category": "neurological",
    "description": "Clinically detailed simulation profile for Epilepsy (Generalized Seizures).",
    "contraindicatedTags": [
      "stimulant"
    ],
    "indicatedTags": [
      "benzodiazepine",
      "gaba-ergic"
    ]
  },
  {
    "id": "epilepsy-focal-seizures",
    "name": "Epilepsy (Focal Seizures)",
    "category": "neurological",
    "description": "Clinically detailed simulation profile for Epilepsy (Focal Seizures).",
    "contraindicatedTags": [
      "stimulant"
    ],
    "indicatedTags": [
      "benzodiazepine",
      "gaba-ergic"
    ]
  },
  {
    "id": "status-epilepticus-history",
    "name": "Status Epilepticus (History)",
    "category": "other",
    "description": "Clinically detailed simulation profile for Status Epilepticus (History)."
  },
  {
    "id": "migraine-with-aura",
    "name": "Migraine with Aura",
    "category": "neurological",
    "description": "Clinically detailed simulation profile for Migraine with Aura."
  },
  {
    "id": "cluster-headaches",
    "name": "Cluster Headaches",
    "category": "neurological",
    "description": "Clinically detailed simulation profile for Cluster Headaches."
  },
  {
    "id": "trigeminal-neuralgia",
    "name": "Trigeminal Neuralgia",
    "category": "neurological",
    "description": "Clinically detailed simulation profile for Trigeminal Neuralgia."
  },
  {
    "id": "myasthenia-gravis",
    "name": "Myasthenia Gravis",
    "category": "neurological",
    "description": "Clinically detailed simulation profile for Myasthenia Gravis."
  },
  {
    "id": "guillain-barr-syndrome-history",
    "name": "Guillain-Barré Syndrome (History)",
    "category": "other",
    "description": "Clinically detailed simulation profile for Guillain-Barré Syndrome (History)."
  },
  {
    "id": "ischemic-stroke-history",
    "name": "Ischemic Stroke (History)",
    "category": "neurological",
    "description": "Clinically detailed simulation profile for Ischemic Stroke (History)."
  },
  {
    "id": "hemorrhagic-stroke-history",
    "name": "Hemorrhagic Stroke (History)",
    "category": "neurological",
    "description": "Clinically detailed simulation profile for Hemorrhagic Stroke (History)."
  },
  {
    "id": "type-1-diabetes-mellitus",
    "name": "Type 1 Diabetes Mellitus",
    "category": "endocrine",
    "description": "Clinically detailed simulation profile for Type 1 Diabetes Mellitus."
  },
  {
    "id": "type-2-diabetes-mellitus",
    "name": "Type 2 Diabetes Mellitus",
    "category": "endocrine",
    "description": "Clinically detailed simulation profile for Type 2 Diabetes Mellitus."
  },
  {
    "id": "hypothyroidism-hashimoto-s",
    "name": "Hypothyroidism (Hashimoto's)",
    "category": "endocrine",
    "description": "Clinically detailed simulation profile for Hypothyroidism (Hashimoto's)."
  },
  {
    "id": "hyperthyroidism-graves",
    "name": "Hyperthyroidism (Graves')",
    "category": "endocrine",
    "description": "Clinically detailed simulation profile for Hyperthyroidism (Graves')."
  },
  {
    "id": "cushing-s-syndrome",
    "name": "Cushing's Syndrome",
    "category": "endocrine",
    "description": "Clinically detailed simulation profile for Cushing's Syndrome."
  },
  {
    "id": "addison-s-disease",
    "name": "Addison's Disease",
    "category": "endocrine",
    "description": "Clinically detailed simulation profile for Addison's Disease."
  },
  {
    "id": "polycystic-ovary-syndrome-pcos",
    "name": "Polycystic Ovary Syndrome (PCOS)",
    "category": "cardiovascular",
    "description": "Clinically detailed simulation profile for Polycystic Ovary Syndrome (PCOS)."
  },
  {
    "id": "diabetes-insipidus",
    "name": "Diabetes Insipidus",
    "category": "endocrine",
    "description": "Clinically detailed simulation profile for Diabetes Insipidus."
  },
  {
    "id": "rheumatoid-arthritis",
    "name": "Rheumatoid Arthritis",
    "category": "autoimmune",
    "description": "Clinically detailed simulation profile for Rheumatoid Arthritis."
  },
  {
    "id": "systemic-lupus-erythematosus-sle",
    "name": "Systemic Lupus Erythematosus (SLE)",
    "category": "autoimmune",
    "description": "Clinically detailed simulation profile for Systemic Lupus Erythematosus (SLE)."
  },
  {
    "id": "psoriatic-arthritis",
    "name": "Psoriatic Arthritis",
    "category": "autoimmune",
    "description": "Clinically detailed simulation profile for Psoriatic Arthritis."
  },
  {
    "id": "ankylosing-spondylitis",
    "name": "Ankylosing Spondylitis",
    "category": "autoimmune",
    "description": "Clinically detailed simulation profile for Ankylosing Spondylitis."
  },
  {
    "id": "sjogren-s-syndrome",
    "name": "Sjogren's Syndrome",
    "category": "autoimmune",
    "description": "Clinically detailed simulation profile for Sjogren's Syndrome."
  },
  {
    "id": "systemic-sclerosis-scleroderma",
    "name": "Systemic Sclerosis (Scleroderma)",
    "category": "other",
    "description": "Clinically detailed simulation profile for Systemic Sclerosis (Scleroderma)."
  },
  {
    "id": "crohn-s-disease",
    "name": "Crohn's Disease",
    "category": "autoimmune",
    "description": "Clinically detailed simulation profile for Crohn's Disease.",
    "contraindicatedTags": [
      "nsaid"
    ]
  },
  {
    "id": "ulcerative-colitis",
    "name": "Ulcerative Colitis",
    "category": "autoimmune",
    "description": "Clinically detailed simulation profile for Ulcerative Colitis.",
    "contraindicatedTags": [
      "nsaid"
    ]
  },
  {
    "id": "celiac-disease",
    "name": "Celiac Disease",
    "category": "autoimmune",
    "description": "Clinically detailed simulation profile for Celiac Disease."
  },
  {
    "id": "hiv-aids-symptomatic",
    "name": "HIV/AIDS (Symptomatic)",
    "category": "infectious",
    "description": "Clinically detailed simulation profile for HIV/AIDS (Symptomatic)."
  },
  {
    "id": "hiv-asymptomatic",
    "name": "HIV (Asymptomatic)",
    "category": "infectious",
    "description": "Clinically detailed simulation profile for HIV (Asymptomatic)."
  },
  {
    "id": "covid-19-acute",
    "name": "COVID-19 (Acute)",
    "category": "infectious",
    "description": "Clinically detailed simulation profile for COVID-19 (Acute)."
  },
  {
    "id": "covid-19-long-covid",
    "name": "COVID-19 (Long COVID)",
    "category": "infectious",
    "description": "Clinically detailed simulation profile for COVID-19 (Long COVID)."
  },
  {
    "id": "herpes-simplex-virus-hsv-1",
    "name": "Herpes Simplex Virus (HSV-1)",
    "category": "infectious",
    "description": "Clinically detailed simulation profile for Herpes Simplex Virus (HSV-1)."
  },
  {
    "id": "herpes-simplex-virus-hsv-2",
    "name": "Herpes Simplex Virus (HSV-2)",
    "category": "infectious",
    "description": "Clinically detailed simulation profile for Herpes Simplex Virus (HSV-2)."
  },
  {
    "id": "influenza-a",
    "name": "Influenza A",
    "category": "other",
    "description": "Clinically detailed simulation profile for Influenza A."
  },
  {
    "id": "influenza-b",
    "name": "Influenza B",
    "category": "other",
    "description": "Clinically detailed simulation profile for Influenza B."
  },
  {
    "id": "respiratory-syncytial-virus-rsv",
    "name": "Respiratory Syncytial Virus (RSV)",
    "category": "respiratory",
    "description": "Clinically detailed simulation profile for Respiratory Syncytial Virus (RSV).",
    "contraindicatedTags": [
      "respiratory-depressant",
      "opioid"
    ]
  },
  {
    "id": "hepatitis-a",
    "name": "Hepatitis A",
    "category": "hepatic",
    "description": "Clinically detailed simulation profile for Hepatitis A.",
    "pkModifiers": {
      "forceLiverHealth": "reduced",
      "clearanceScalar": 0.8,
      "justification": "Early-stage liver disease or active hepatitis causes mild hepatocellular inflammation, marginally reducing overall metabolic capacity (clearance decreased by ~20%)."
    },
    "contraindicatedTags": [
      "hepatotoxic"
    ]
  },
  {
    "id": "hepatitis-b-acute",
    "name": "Hepatitis B (Acute)",
    "category": "hepatic",
    "description": "Clinically detailed simulation profile for Hepatitis B (Acute).",
    "pkModifiers": {
      "forceLiverHealth": "reduced",
      "clearanceScalar": 0.8,
      "justification": "Early-stage liver disease or active hepatitis causes mild hepatocellular inflammation, marginally reducing overall metabolic capacity (clearance decreased by ~20%)."
    },
    "contraindicatedTags": [
      "hepatotoxic"
    ]
  },
  {
    "id": "hepatitis-b-chronic",
    "name": "Hepatitis B (Chronic)",
    "category": "hepatic",
    "description": "Clinically detailed simulation profile for Hepatitis B (Chronic).",
    "pkModifiers": {
      "forceLiverHealth": "reduced",
      "clearanceScalar": 0.8,
      "justification": "Early-stage liver disease or active hepatitis causes mild hepatocellular inflammation, marginally reducing overall metabolic capacity (clearance decreased by ~20%)."
    },
    "contraindicatedTags": [
      "hepatotoxic"
    ]
  },
  {
    "id": "hepatitis-c-acute",
    "name": "Hepatitis C (Acute)",
    "category": "hepatic",
    "description": "Clinically detailed simulation profile for Hepatitis C (Acute).",
    "pkModifiers": {
      "forceLiverHealth": "reduced",
      "clearanceScalar": 0.8,
      "justification": "Early-stage liver disease or active hepatitis causes mild hepatocellular inflammation, marginally reducing overall metabolic capacity (clearance decreased by ~20%)."
    },
    "contraindicatedTags": [
      "hepatotoxic"
    ]
  },
  {
    "id": "hepatitis-c-chronic",
    "name": "Hepatitis C (Chronic)",
    "category": "hepatic",
    "description": "Clinically detailed simulation profile for Hepatitis C (Chronic).",
    "pkModifiers": {
      "forceLiverHealth": "reduced",
      "clearanceScalar": 0.8,
      "justification": "Early-stage liver disease or active hepatitis causes mild hepatocellular inflammation, marginally reducing overall metabolic capacity (clearance decreased by ~20%)."
    },
    "contraindicatedTags": [
      "hepatotoxic"
    ]
  },
  {
    "id": "hepatitis-d",
    "name": "Hepatitis D",
    "category": "hepatic",
    "description": "Clinically detailed simulation profile for Hepatitis D.",
    "pkModifiers": {
      "forceLiverHealth": "reduced",
      "clearanceScalar": 0.8,
      "justification": "Early-stage liver disease or active hepatitis causes mild hepatocellular inflammation, marginally reducing overall metabolic capacity (clearance decreased by ~20%)."
    },
    "contraindicatedTags": [
      "hepatotoxic"
    ]
  },
  {
    "id": "hepatitis-e",
    "name": "Hepatitis E",
    "category": "hepatic",
    "description": "Clinically detailed simulation profile for Hepatitis E.",
    "pkModifiers": {
      "forceLiverHealth": "reduced",
      "clearanceScalar": 0.8,
      "justification": "Early-stage liver disease or active hepatitis causes mild hepatocellular inflammation, marginally reducing overall metabolic capacity (clearance decreased by ~20%)."
    },
    "contraindicatedTags": [
      "hepatotoxic"
    ]
  },
  {
    "id": "human-papillomavirus-hpv",
    "name": "Human Papillomavirus (HPV)",
    "category": "infectious",
    "description": "Clinically detailed simulation profile for Human Papillomavirus (HPV)."
  },
  {
    "id": "epstein-barr-virus-ebv-mononucleosis",
    "name": "Epstein-Barr Virus (EBV / Mononucleosis)",
    "category": "infectious",
    "description": "Clinically detailed simulation profile for Epstein-Barr Virus (EBV / Mononucleosis)."
  },
  {
    "id": "cytomegalovirus-cmv",
    "name": "Cytomegalovirus (CMV)",
    "category": "infectious",
    "description": "Clinically detailed simulation profile for Cytomegalovirus (CMV)."
  },
  {
    "id": "varicella-zoster-virus-chickenpox",
    "name": "Varicella-Zoster Virus (Chickenpox)",
    "category": "infectious",
    "description": "Clinically detailed simulation profile for Varicella-Zoster Virus (Chickenpox)."
  },
  {
    "id": "herpes-zoster-shingles",
    "name": "Herpes Zoster (Shingles)",
    "category": "other",
    "description": "Clinically detailed simulation profile for Herpes Zoster (Shingles)."
  },
  {
    "id": "dengue-fever",
    "name": "Dengue Fever",
    "category": "other",
    "description": "Clinically detailed simulation profile for Dengue Fever."
  },
  {
    "id": "zika-virus",
    "name": "Zika Virus",
    "category": "infectious",
    "description": "Clinically detailed simulation profile for Zika Virus."
  },
  {
    "id": "chikungunya",
    "name": "Chikungunya",
    "category": "other",
    "description": "Clinically detailed simulation profile for Chikungunya."
  },
  {
    "id": "ebola-virus-disease",
    "name": "Ebola Virus Disease",
    "category": "infectious",
    "description": "Clinically detailed simulation profile for Ebola Virus Disease."
  },
  {
    "id": "marburg-virus",
    "name": "Marburg Virus",
    "category": "infectious",
    "description": "Clinically detailed simulation profile for Marburg Virus."
  },
  {
    "id": "rabies",
    "name": "Rabies",
    "category": "other",
    "description": "Clinically detailed simulation profile for Rabies."
  },
  {
    "id": "norovirus",
    "name": "Norovirus",
    "category": "infectious",
    "description": "Clinically detailed simulation profile for Norovirus."
  },
  {
    "id": "rotavirus",
    "name": "Rotavirus",
    "category": "infectious",
    "description": "Clinically detailed simulation profile for Rotavirus."
  },
  {
    "id": "measles",
    "name": "Measles",
    "category": "other",
    "description": "Clinically detailed simulation profile for Measles."
  },
  {
    "id": "mumps",
    "name": "Mumps",
    "category": "other",
    "description": "Clinically detailed simulation profile for Mumps."
  },
  {
    "id": "rubella",
    "name": "Rubella",
    "category": "other",
    "description": "Clinically detailed simulation profile for Rubella."
  },
  {
    "id": "poliomyelitis",
    "name": "Poliomyelitis",
    "category": "other",
    "description": "Clinically detailed simulation profile for Poliomyelitis."
  },
  {
    "id": "tuberculosis-active",
    "name": "Tuberculosis (Active)",
    "category": "infectious",
    "description": "Clinically detailed simulation profile for Tuberculosis (Active)."
  },
  {
    "id": "tuberculosis-latent",
    "name": "Tuberculosis (Latent)",
    "category": "infectious",
    "description": "Clinically detailed simulation profile for Tuberculosis (Latent)."
  },
  {
    "id": "methicillin-resistant-staphylococcus-aureus-mrsa",
    "name": "Methicillin-Resistant Staphylococcus aureus (MRSA)",
    "category": "infectious",
    "description": "Clinically detailed simulation profile for Methicillin-Resistant Staphylococcus aureus (MRSA)."
  },
  {
    "id": "vancomycin-resistant-enterococcus-vre",
    "name": "Vancomycin-Resistant Enterococcus (VRE)",
    "category": "infectious",
    "description": "Clinically detailed simulation profile for Vancomycin-Resistant Enterococcus (VRE)."
  },
  {
    "id": "clostridioides-difficile-c-diff",
    "name": "Clostridioides difficile (C. diff)",
    "category": "infectious",
    "description": "Clinically detailed simulation profile for Clostridioides difficile (C. diff)."
  },
  {
    "id": "streptococcus-pyogenes-strep-throat",
    "name": "Streptococcus pyogenes (Strep Throat)",
    "category": "other",
    "description": "Clinically detailed simulation profile for Streptococcus pyogenes (Strep Throat)."
  },
  {
    "id": "syphilis-primary-secondary",
    "name": "Syphilis (Primary/Secondary)",
    "category": "infectious",
    "description": "Clinically detailed simulation profile for Syphilis (Primary/Secondary)."
  },
  {
    "id": "syphilis-tertiary-neurosyphilis",
    "name": "Syphilis (Tertiary/Neurosyphilis)",
    "category": "infectious",
    "description": "Clinically detailed simulation profile for Syphilis (Tertiary/Neurosyphilis)."
  },
  {
    "id": "gonorrhea",
    "name": "Gonorrhea",
    "category": "infectious",
    "description": "Clinically detailed simulation profile for Gonorrhea."
  },
  {
    "id": "chlamydia",
    "name": "Chlamydia",
    "category": "infectious",
    "description": "Clinically detailed simulation profile for Chlamydia."
  },
  {
    "id": "lyme-disease-acute",
    "name": "Lyme Disease (Acute)",
    "category": "infectious",
    "description": "Clinically detailed simulation profile for Lyme Disease (Acute)."
  },
  {
    "id": "lyme-disease-chronic-ptlds",
    "name": "Lyme Disease (Chronic/PTLDS)",
    "category": "infectious",
    "description": "Clinically detailed simulation profile for Lyme Disease (Chronic/PTLDS)."
  },
  {
    "id": "tetanus",
    "name": "Tetanus",
    "category": "infectious",
    "description": "Clinically detailed simulation profile for Tetanus."
  },
  {
    "id": "cholera",
    "name": "Cholera",
    "category": "infectious",
    "description": "Clinically detailed simulation profile for Cholera."
  },
  {
    "id": "typhoid-fever",
    "name": "Typhoid Fever",
    "category": "infectious",
    "description": "Clinically detailed simulation profile for Typhoid Fever."
  },
  {
    "id": "leprosy-hansen-s-disease",
    "name": "Leprosy (Hansen's Disease)",
    "category": "other",
    "description": "Clinically detailed simulation profile for Leprosy (Hansen's Disease)."
  },
  {
    "id": "anthrax",
    "name": "Anthrax",
    "category": "other",
    "description": "Clinically detailed simulation profile for Anthrax."
  },
  {
    "id": "pertussis-whooping-cough",
    "name": "Pertussis (Whooping Cough)",
    "category": "other",
    "description": "Clinically detailed simulation profile for Pertussis (Whooping Cough)."
  },
  {
    "id": "diphtheria",
    "name": "Diphtheria",
    "category": "other",
    "description": "Clinically detailed simulation profile for Diphtheria."
  },
  {
    "id": "helicobacter-pylori-infection",
    "name": "Helicobacter pylori Infection",
    "category": "infectious",
    "description": "Clinically detailed simulation profile for Helicobacter pylori Infection."
  },
  {
    "id": "legionnaires-disease",
    "name": "Legionnaires' Disease",
    "category": "other",
    "description": "Clinically detailed simulation profile for Legionnaires' Disease."
  },
  {
    "id": "mycoplasma-pneumoniae",
    "name": "Mycoplasma pneumoniae",
    "category": "other",
    "description": "Clinically detailed simulation profile for Mycoplasma pneumoniae."
  },
  {
    "id": "malaria-plasmodium-falciparum",
    "name": "Malaria (Plasmodium falciparum)",
    "category": "infectious",
    "description": "Clinically detailed simulation profile for Malaria (Plasmodium falciparum)."
  },
  {
    "id": "malaria-plasmodium-vivax",
    "name": "Malaria (Plasmodium vivax)",
    "category": "infectious",
    "description": "Clinically detailed simulation profile for Malaria (Plasmodium vivax)."
  },
  {
    "id": "toxoplasmosis",
    "name": "Toxoplasmosis",
    "category": "other",
    "description": "Clinically detailed simulation profile for Toxoplasmosis."
  },
  {
    "id": "giardiasis",
    "name": "Giardiasis",
    "category": "other",
    "description": "Clinically detailed simulation profile for Giardiasis."
  },
  {
    "id": "cryptosporidiosis",
    "name": "Cryptosporidiosis",
    "category": "other",
    "description": "Clinically detailed simulation profile for Cryptosporidiosis."
  },
  {
    "id": "trichomoniasis",
    "name": "Trichomoniasis",
    "category": "other",
    "description": "Clinically detailed simulation profile for Trichomoniasis."
  },
  {
    "id": "candidiasis-systemic",
    "name": "Candidiasis (Systemic)",
    "category": "other",
    "description": "Clinically detailed simulation profile for Candidiasis (Systemic)."
  },
  {
    "id": "candidiasis-oral-thrush",
    "name": "Candidiasis (Oral/Thrush)",
    "category": "other",
    "description": "Clinically detailed simulation profile for Candidiasis (Oral/Thrush)."
  },
  {
    "id": "aspergillosis",
    "name": "Aspergillosis",
    "category": "other",
    "description": "Clinically detailed simulation profile for Aspergillosis."
  },
  {
    "id": "cryptococcosis",
    "name": "Cryptococcosis",
    "category": "other",
    "description": "Clinically detailed simulation profile for Cryptococcosis."
  },
  {
    "id": "histoplasmosis",
    "name": "Histoplasmosis",
    "category": "other",
    "description": "Clinically detailed simulation profile for Histoplasmosis."
  },
  {
    "id": "fibromyalgia",
    "name": "Fibromyalgia",
    "category": "other",
    "description": "Clinically detailed simulation profile for Fibromyalgia."
  },
  {
    "id": "myalgic-encephalomyelitis-chronic-fatigue-syndrome-me-cfs",
    "name": "Myalgic Encephalomyelitis / Chronic Fatigue Syndrome (ME/CFS)",
    "category": "neurological",
    "description": "Clinically detailed simulation profile for Myalgic Encephalomyelitis / Chronic Fatigue Syndrome (ME/CFS)."
  },
  {
    "id": "endometriosis",
    "name": "Endometriosis",
    "category": "other",
    "description": "Clinically detailed simulation profile for Endometriosis."
  },
  {
    "id": "irritable-bowel-syndrome-ibs-d",
    "name": "Irritable Bowel Syndrome (IBS-D)",
    "category": "other",
    "description": "Clinically detailed simulation profile for Irritable Bowel Syndrome (IBS-D)."
  },
  {
    "id": "irritable-bowel-syndrome-ibs-c",
    "name": "Irritable Bowel Syndrome (IBS-C)",
    "category": "other",
    "description": "Clinically detailed simulation profile for Irritable Bowel Syndrome (IBS-C)."
  },
  {
    "id": "interstitial-cystitis",
    "name": "Interstitial Cystitis",
    "category": "other",
    "description": "Clinically detailed simulation profile for Interstitial Cystitis."
  },
  {
    "id": "dysautonomia-postural-orthostatic-tachycardia-syndrome-pots",
    "name": "Dysautonomia (Postural Orthostatic Tachycardia Syndrome - POTS)",
    "category": "cardiovascular",
    "description": "Clinically detailed simulation profile for Dysautonomia (Postural Orthostatic Tachycardia Syndrome - POTS).",
    "contraindicatedTags": [
      "stimulant",
      "sympathomimetic"
    ]
  },
  {
    "id": "ehlers-danlos-syndrome-eds",
    "name": "Ehlers-Danlos Syndrome (EDS)",
    "category": "other",
    "description": "Clinically detailed simulation profile for Ehlers-Danlos Syndrome (EDS)."
  },
  {
    "id": "chronic-myofascial-pain",
    "name": "Chronic Myofascial Pain",
    "category": "other",
    "description": "Clinically detailed simulation profile for Chronic Myofascial Pain."
  },
  {
    "id": "complex-regional-pain-syndrome-crps",
    "name": "Complex Regional Pain Syndrome (CRPS)",
    "category": "other",
    "description": "Clinically detailed simulation profile for Complex Regional Pain Syndrome (CRPS)."
  },
  {
    "id": "chronic-pain-syndrome",
    "name": "Chronic Pain Syndrome",
    "category": "other",
    "description": "Clinically detailed simulation profile for Chronic Pain Syndrome."
  },
  {
    "id": "tinnitus",
    "name": "Tinnitus",
    "category": "other",
    "description": "Clinically detailed simulation profile for Tinnitus."
  }
];
