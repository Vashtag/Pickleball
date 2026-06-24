interface MeterProps {
  label: string;
  value: number;
  max: number;
  /** CSS color for the fill. */
  color?: string;
  /** Show "value / max" instead of just the value. */
  showMax?: boolean;
}

// Simple labeled progress meter used for Balance and Pressure.
export default function Meter({ label, value, max, color = 'var(--color-accent)', showMax = true }: MeterProps) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className="meter">
      <div className="meter__head">
        <span className="meter__label">{label}</span>
        <span className="meter__value">{showMax ? `${value} / ${max}` : value}</span>
      </div>
      <div className="meter__track">
        <div className="meter__fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}
