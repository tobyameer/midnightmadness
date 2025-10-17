import { useEffect, useMemo, useRef, useState } from "react";

type SessionTimerProps = {
  expiresAt?: string | null;
  onExpire?: () => void;
  className?: string;
};

function formatRemaining(ms: number) {
  if (ms <= 0) {
    return "00:00";
  }
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

const SessionTimer = ({ expiresAt, onExpire, className }: SessionTimerProps) => {
  const [remaining, setRemaining] = useState<number>(() => {
    if (!expiresAt) return 0;
    return new Date(expiresAt).getTime() - Date.now();
  });
  const expiredRef = useRef(false);

  useEffect(() => {
    if (!expiresAt) {
      setRemaining(0);
      return undefined;
    }

    expiredRef.current = false;

    function update() {
      const target = new Date(expiresAt).getTime();
      if (Number.isNaN(target)) {
        setRemaining(0);
        return;
      }
      const diff = target - Date.now();
      setRemaining(diff);
      if (diff <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        onExpire?.();
      }
    }

    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, [expiresAt, onExpire]);

  const formatted = useMemo(() => formatRemaining(remaining), [remaining]);

  if (!expiresAt) {
    return null;
  }

  return (
    <div className={className}>
      <span className="text-sm font-medium text-muted-foreground">Session expires in</span>
      <span className="ml-2 font-mono text-lg font-semibold text-[hsl(var(--accent))]">{formatted}</span>
    </div>
  );
};

export default SessionTimer;
