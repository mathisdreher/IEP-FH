import type { SectorStats } from "./types";

export type SectorLevel = "division" | "group" | "class" | "subclass";

export const SECTOR_LEVELS: SectorLevel[] = ["division", "group", "class", "subclass"];

/**
 * Parse a NAF code into its hierarchical components.
 * Example: "47.11D" → { division: "47", group: "47.1", class_: "47.11", subclass: "47.11D" }
 * Example: "62.01Z" → { division: "62", group: "62.0", class_: "62.01", subclass: "62.01Z" }
 */
export function parseSectorCode(code: string): {
  division: string;
  group: string;
  class_: string;
  subclass: string;
} {
  const clean = code.trim();
  return {
    division: clean.slice(0, 2),                           // "47"
    group: clean.length >= 4 ? clean.slice(0, 4) : clean,  // "47.1"
    class_: clean.length >= 5 ? clean.slice(0, 5) : clean, // "47.11"
    subclass: clean,                                        // "47.11D"
  };
}

/**
 * Get the prefix for a code at a given aggregation level.
 */
export function getSectorPrefix(code: string, level: SectorLevel): string {
  const parsed = parseSectorCode(code);
  switch (level) {
    case "division": return parsed.division;
    case "group": return parsed.group;
    case "class": return parsed.class_;
    case "subclass": return parsed.subclass;
  }
}

/**
 * Get the next (more detailed) level below the given one.
 */
export function getChildLevel(level: SectorLevel): SectorLevel | null {
  const idx = SECTOR_LEVELS.indexOf(level);
  return idx < SECTOR_LEVELS.length - 1 ? SECTOR_LEVELS[idx + 1] : null;
}

/**
 * Get the parent (broader) level above the given one.
 */
export function getParentLevel(level: SectorLevel): SectorLevel | null {
  const idx = SECTOR_LEVELS.indexOf(level);
  return idx > 0 ? SECTOR_LEVELS[idx - 1] : null;
}

/**
 * Aggregate an array of SectorStats by a given NAF level.
 * Groups child sectors under the same prefix and computes weighted averages.
 */
export function groupSectorsByLevel(
  sectors: SectorStats[],
  level: SectorLevel,
  parentPrefix?: string,
): SectorStats[] {
  // Filter by parent prefix if provided
  let items = sectors;
  if (parentPrefix) {
    items = sectors.filter((s) => s.code.startsWith(parentPrefix));
  }

  if (level === "subclass" && !parentPrefix) return items;

  // Group by prefix at the target level
  const groups = new Map<string, SectorStats[]>();
  for (const s of items) {
    const prefix = getSectorPrefix(s.code, level);
    if (!groups.has(prefix)) groups.set(prefix, []);
    groups.get(prefix)!.push(s);
  }

  // Aggregate each group
  return Array.from(groups.entries()).map(([prefix, children]) => {
    const totalCount = children.reduce((sum, c) => sum + c.count, 0);
    const weightedAvg =
      totalCount > 0
        ? Math.round(
            (children.reduce((sum, c) => sum + c.avgScore * c.count, 0) / totalCount) * 10,
          ) / 10
        : 0;

    // Merge distributions
    const distribution: Record<string, number> = {};
    for (const c of children) {
      for (const [bucket, count] of Object.entries(c.distribution)) {
        distribution[bucket] = (distribution[bucket] || 0) + count;
      }
    }

    // Use the label from the first child, or from the largest child
    const biggest = children.reduce((a, b) => (a.count > b.count ? a : b));

    // Collect all medians weighted — approximate with weighted average of medians
    const weightedMedian =
      totalCount > 0
        ? Math.round(
            children.reduce((sum, c) => sum + c.median * c.count, 0) / totalCount,
          )
        : 0;

    return {
      code: prefix,
      label: children.length === 1 ? biggest.label : `${biggest.label} (+${children.length - 1})`,
      count: totalCount,
      avgScore: weightedAvg,
      median: weightedMedian,
      min: Math.min(...children.map((c) => c.min)),
      max: Math.max(...children.map((c) => c.max)),
      distribution,
    };
  });
}
