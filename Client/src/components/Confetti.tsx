import { useMemo } from "react";

type ConfettiPiece = {
  left: number;
  delay: number;
  duration: number;
  color: string;
};

const colors = ["#fb923c", "#f97316", "#facc15", "#38bdf8", "#a855f7", "#22c55e"];

const Confetti = () => {
  const pieces = useMemo<ConfettiPiece[]>(() => {
    return Array.from({ length: 24 }).map(() => ({
      left: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 4 + Math.random() * 3,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
  }, []);

  return (
    <div className="confetti-container">
      {pieces.map((piece, index) => (
        <span
          key={index}
          className="confetti-piece"
          style={{
            left: `${piece.left}%`,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
            backgroundColor: piece.color,
          }}
        />
      ))}
    </div>
  );
};

export default Confetti;
