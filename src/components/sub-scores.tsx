import { ScoreGauge } from "./score-gauge";
import type { YearRecord } from "@/lib/types";

interface SubScoresProps {
  record: YearRecord;
  size: string;
}

// For companies 50-250, there's a combined "augmentations" score (max 35)
// For companies 250+, there's separate "augmentations HP" (max 20) and "promotions" (max 15)
const INDICATORS_SMALL = [
  { key: "scoreRemunerations" as const, label: "Écart de rémunération", max: 40 },
  { key: "scoreAugmentations" as const, label: "Écart taux d'augmentation", max: 35 },
  { key: "scoreCongesMaternite" as const, label: "Retour congé maternité", max: 15 },
  { key: "scoreHautesRemunerations" as const, label: "Hautes rémunérations", max: 10 },
];

const INDICATORS_LARGE = [
  { key: "scoreRemunerations" as const, label: "Écart de rémunération", max: 40 },
  { key: "scoreAugmentationsHP" as const, label: "Écart augmentations", max: 20 },
  { key: "scorePromotions" as const, label: "Écart promotions", max: 15 },
  { key: "scoreCongesMaternite" as const, label: "Retour congé maternité", max: 15 },
  { key: "scoreHautesRemunerations" as const, label: "Hautes rémunérations", max: 10 },
];

export function SubScores({ record, size }: SubScoresProps) {
  const isSmall = size === "50 à 250";
  const indicators = isSmall ? INDICATORS_SMALL : INDICATORS_LARGE;

  return (
    <div className="flex flex-wrap justify-center gap-6">
      {indicators.map(({ key, label, max }) => (
        <ScoreGauge
          key={key}
          score={record[key]}
          max={max}
          size="sm"
          label={label}
        />
      ))}
    </div>
  );
}
