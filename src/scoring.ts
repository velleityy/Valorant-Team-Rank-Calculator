export const RANK_POINTS = {
    iron: 1,
    bronze: 3,
    silver: 4,
    gold: 5,
    platinum: 7,
    diamond1: 10,
    diamond2: 11,
    diamond3: 12,
    ascendant1: 13,
    ascendant2: 14,
    ascendant3: 15,
    immo_0: 17,
    immo_150: 20,
    immo_300: 24,
    immo_500: 27,
    rad_700: 30,
  } as const;
  
  export const TEAM_CAP = 85;
  
  export type RankKey = keyof typeof RANK_POINTS;
  export type Recency = "normal" | "since_v25_a1" | "since_v25_a5";
  
  export const RANK_OPTIONS: Array<{ key: RankKey; label: string }> = [
    { key: "iron", label: "Iron" },
    { key: "bronze", label: "Bronze" },
    { key: "silver", label: "Silver" },
    { key: "gold", label: "Gold" },
    { key: "platinum", label: "Platinum" },
    { key: "diamond1", label: "Diamond 1" },
    { key: "diamond2", label: "Diamond 2" },
    { key: "diamond3", label: "Diamond 3" },
    { key: "ascendant1", label: "Ascendant 1" },
    { key: "ascendant2", label: "Ascendant 2" },
    { key: "ascendant3", label: "Ascendant 3" },
    { key: "immo_0", label: "Immortal (0rr+)" },
    { key: "immo_150", label: "Immortal (150rr+)" },
    { key: "immo_300", label: "Immortal (300rr+)" },
    { key: "immo_500", label: "Immortal–Radiant (500rr+)" },
    { key: "rad_700", label: "Radiant (700rr+)" },
  ];
  
  export const RECENCY_OPTIONS: Array<{ key: Recency; label: string }> = [
    { key: "normal", label: "Normal (no reduction)" },
    { key: "since_v25_a1", label: "Inactive since V25 A1 (-30%)" },
    { key: "since_v25_a5", label: "Inactive since V25 A5 (-70%)" },
  ];
  
  export function recencyMultiplier(r: Recency): number {
    if (r === "since_v25_a1") return 0.7; // -30%
    if (r === "since_v25_a5") return 0.3; // -70%
    return 1.0;
  }
  
  export function scorePlayer(
    rankA1: RankKey,
    rankA5: RankKey
  ) {
    const a1Points = RANK_POINTS[rankA1];
    const a5Points = RANK_POINTS[rankA5];
  
    const weightedA1 = a1Points * 0.3;
    const weightedA5 = a5Points * 0.7;
  
    // Final rounding rule (recommended: ceil for fairness)
    const final = Math.ceil(weightedA1 + weightedA5);
  
    return {
      a1Points,
      a5Points,
      weightedA1,
      weightedA5,
      final,
    };
  }
  