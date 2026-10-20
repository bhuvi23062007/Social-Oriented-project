export type WasteType = 'LITTER' | 'BIN_OVERFLOW' | 'GARBAGE_PILE' | 'DRAIN_BLOCK' | 'BULK_DUMP'

export const WASTE_OPTIONS: { value: WasteType; label: string; points: number }[] = [
  { value: 'LITTER', label: 'Litter on street / roadside', points: 10 },
  { value: 'BIN_OVERFLOW', label: 'Overflowing public bin', points: 15 },
  { value: 'GARBAGE_PILE', label: 'Garbage pile / dumped bags', points: 25 },
  { value: 'DRAIN_BLOCK', label: 'Waste blocking a drain', points: 30 },
  { value: 'BULK_DUMP', label: 'Large dumping (debris, furniture)', points: 50 },
]

export const wasteLabel = (t?: string) => WASTE_OPTIONS.find((o) => o.value === t)?.label ?? 'Waste'
export const wastePoints = (t?: string) => WASTE_OPTIONS.find((o) => o.value === t)?.points ?? 10
export const mapsLink = (lat: number, lng: number) => `https://www.google.com/maps?q=${lat},${lng}`