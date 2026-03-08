export interface Company {
  siren: string;
  name: string;
  sector: string;
  sectorCode: string;
  region: string;
  department: string;
  size: string;
  structure: string;
  latestYear: number;
  latestScore: number | null;
  years: number[];
}

export interface YearRecord {
  siren: string;
  name: string;
  sector: string;
  sectorCode: string;
  region: string;
  department: string;
  size: string;
  structure: string;
  year: number;
  score: number | null;
  scoreRemunerations: number | null;
  scoreAugmentations: number | null;
  scoreAugmentationsHP: number | null;
  scorePromotions: number | null;
  scoreCongesMaternite: number | null;
  scoreHautesRemunerations: number | null;
  uesName: string | null;
  uesSirens: string | null;
}

export interface SectorStats {
  code: string;
  label: string;
  count: number;
  avgScore: number;
  median: number;
  min: number;
  max: number;
  distribution: Record<string, number>;
}

export interface RegionStats {
  name: string;
  count: number;
  avgScore: number;
  median: number;
  distribution: Record<string, number>;
}

export interface NationalStats {
  year: number;
  totalCompanies: number;
  totalWithScore: number;
  avgScore: number;
  median: number;
  distribution: Record<string, number>;
  years: number[];
  countByYear: Record<number, number>;
  avgByYear: Record<number, number>;
}

export interface DataMeta {
  lastModified: string;
  fetchedAt: string;
  datasetId: string;
  sourceUrl: string;
  totalRows: number;
  totalCompanies: number;
  years: number[];
  latestYear: number;
}

// Sub-score breakdown for radar/bar charts
export interface ScoreBreakdown {
  remunerations: number | null;
  augmentations: number | null;
  augmentationsHP: number | null;
  promotions: number | null;
  congesMaternite: number | null;
  hautesRemunerations: number | null;
}

// Labels for sub-score indicators
export const SCORE_LABELS: Record<keyof ScoreBreakdown, { label: string; max: number }> = {
  remunerations: { label: "Écart de rémunération", max: 40 },
  augmentations: { label: "Écart taux d'augmentation", max: 35 },
  augmentationsHP: { label: "Écart taux d'augmentation (hors promo)", max: 20 },
  promotions: { label: "Écart taux de promotion", max: 15 },
  congesMaternite: { label: "Retour congé maternité", max: 15 },
  hautesRemunerations: { label: "Hautes rémunérations", max: 10 },
};

// Size categories for filtering
export const SIZE_CATEGORIES = [
  "50 à 250",
  "251 à 999",
  "1000 et plus",
] as const;

// French regions for filtering
export const REGIONS = [
  "Auvergne-Rhône-Alpes",
  "Bourgogne-Franche-Comté",
  "Bretagne",
  "Centre-Val de Loire",
  "Corse",
  "Grand Est",
  "Guadeloupe",
  "Guyane",
  "Hauts-de-France",
  "Île-de-France",
  "La Réunion",
  "Martinique",
  "Mayotte",
  "Normandie",
  "Nouvelle-Aquitaine",
  "Occitanie",
  "Pays de la Loire",
  "Provence-Alpes-Côte d'Azur",
] as const;
