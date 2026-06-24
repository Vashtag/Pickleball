import { useEffect, useRef } from 'react';

interface StatusLogProps {
  entries: string[];
}

// Scrolling action feed; auto-scrolls to the newest entry.
export default function StatusLog({ entries }: StatusLogProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [entries.length]);

  // Show the most recent entries (cap for readability).
  const recent = entries.slice(-40);

  return (
    <div className="status-log">
      <div className="status-log__title">Rally Log</div>
      <div className="status-log__feed">
        {recent.map((line, i) => (
          <div key={i} className="status-log__line">
            {line}
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}
