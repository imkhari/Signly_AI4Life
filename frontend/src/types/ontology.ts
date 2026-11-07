export interface ChiefComplaintOntology {
  code: string;
  label_vi: string;
  icon: string;
  synonyms_vi: string[];
  vsl_gloss: string[];
}

export interface BodyRegionOntology {
  code: string;
  label_vi: string;
  synonyms_vi: string[];
  view: 'front' | 'back' | 'both';
  vsl_gloss: string[];
}

export interface VslGlossOntology {
  gloss: string;
  meaning_vi: string;
  category: 'symptom' | 'region' | 'time' | 'quantity' | 'modifier';
}

export interface OntologyResponse {
  chief_complaints: ChiefComplaintOntology[];
  body_regions: BodyRegionOntology[];
  vsl_gloss: VslGlossOntology[];
}

