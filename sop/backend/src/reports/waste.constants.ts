import { WasteType } from '@prisma/client';

export const WASTE_POINTS: Record<WasteType, number> = {
  LITTER: 10,
  BIN_OVERFLOW: 15,
  GARBAGE_PILE: 25,
  DRAIN_BLOCK: 30,
  BULK_DUMP: 50,
};

export const WASTE_LABELS: Record<WasteType, string> = {
  LITTER: 'Litter on street / roadside',
  BIN_OVERFLOW: 'Overflowing public bin',
  GARBAGE_PILE: 'Garbage pile / dumped bags',
  DRAIN_BLOCK: 'Waste blocking a drain',
  BULK_DUMP: 'Large dumping (debris, furniture)',
};

export const NEARBY_RADIUS_KM = 5;
export const CLEANER_ONLINE_MINUTES = 15;

export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}