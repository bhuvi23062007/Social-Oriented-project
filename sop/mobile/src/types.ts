export type Role = 'CITIZEN' | 'CLEANING_STAFF' | 'ADMIN';
export type ReportStatus = 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'CLEANING_COMPLETED' | 'RESOLVED' | 'REJECTED';
export type WasteType = 'LITTER' | 'BIN_OVERFLOW' | 'GARBAGE_PILE' | 'DRAIN_BLOCK' | 'BULK_DUMP';
export type MessageStatus = 'UNREAD' | 'ACCEPTED' | 'IN_PROGRESS' | 'DONE';
export type Priority = 'NORMAL' | 'URGENT';

export interface AuthState {
  userId: string;
  name: string;
  email: string;
  role: Role;
  token: string;
}

export interface ReportImage {
  id?: string;
  url: string;
  type?: 'BEFORE' | 'AFTER';
}

export interface Report {
  id: string;
  description: string;
  latitude: number;
  longitude: number;
  wasteType: WasteType;
  distanceKm?: number;
  status: ReportStatus;
  reporterId: string;
  createdAt: string;
  images: ReportImage[];
  statusHistory?: { status: ReportStatus; note?: string; changedAt: string }[];
  reporter?: { id: string; name?: string; email?: string };
  assignment?: {
    assignedAt?: string;
    completedAt?: string | null;
    cleaningTeamId?: string | null;
    cleanerId?: string | null;
    cleaningTeam?: { id: string; name: string } | null;
    cleaner?: { id: string; name: string } | null;
  } | null;
}

export interface CreditEvent {
  id: string;
  reason: string;
  points: number;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface CleanerMessage {
  id: string;
  location: string;
  body: string;
  priority: Priority;
  status: MessageStatus;
  createdAt: string;
  cleaner?: { id: string; name: string };
}

export const WASTE_OPTIONS: { value: WasteType; label: string; points: number }[] = [
  { value: 'LITTER', label: 'Litter on street / roadside', points: 10 },
  { value: 'BIN_OVERFLOW', label: 'Overflowing public bin', points: 15 },
  { value: 'GARBAGE_PILE', label: 'Garbage pile / dumped bags', points: 25 },
  { value: 'DRAIN_BLOCK', label: 'Waste blocking a drain', points: 30 },
  { value: 'BULK_DUMP', label: 'Large dumping (debris, furniture)', points: 50 },
];

export const wasteLabel = (type?: string) => WASTE_OPTIONS.find((x) => x.value === type)?.label ?? 'Waste';
export const wastePoints = (type?: string) => WASTE_OPTIONS.find((x) => x.value === type)?.points ?? 10;
export const statusLabel = (status: ReportStatus) => ({
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  IN_PROGRESS: 'In progress',
  CLEANING_COMPLETED: 'Awaiting verification',
  RESOLVED: 'Resolved',
  REJECTED: 'Rejected',
}[status] ?? status);
