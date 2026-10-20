const DEG: Record<string, number> = {
  straight: 0,
  'slight right': 45,
  right: 90,
  'sharp right': 135,
  uturn: 180,
  'sharp left': -135,
  left: -90,
  'slight left': -45,
}

export default function TurnIcon({ type, modifier, size = 28 }: { type: string; modifier?: string; size?: number }) {
  if (type === 'arrive') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" />
      </svg>
    )
  }
  const deg = DEG[modifier ?? 'straight'] ?? 0
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      style={{ transform: `rotate(${deg}deg)` }}
    >
      <path d="M12 2 20 11h-5.5v11h-5V11H4z" />
    </svg>
  )
}