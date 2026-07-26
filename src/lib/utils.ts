export function formatPosition(position: string | null | undefined): string {
  if (!position) return "";
  
  const mapping: Record<string, string> = {
    "setter": "S",
    "libero": "L",
    "defensive specialist": "DS",
    "middle blocker": "M",
    "middle": "M",
    "outside hitter": "OH",
    "outside": "OH",
    "right side": "OPP",
    "opposite hitter": "OPP",
    "opposite": "OPP",
    "opp": "OPP",
    "ds": "DS",
    "oh": "OH",
    "s": "S",
    "l": "L",
    "m": "M"
  };

  const normalized = position.toLowerCase().trim();
  return mapping[normalized] || position;
}
