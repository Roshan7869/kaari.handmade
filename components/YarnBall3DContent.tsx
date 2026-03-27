'use client';

interface YarnBall3DContentProps {
  color?: string;
  animated?: boolean;
}

export function YarnBall3DContent({ color = '#FF6B9D', animated = true }: YarnBall3DContentProps) {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div
        className={`relative rounded-full ${animated ? 'animate-pulse' : ''}`}
        style={{
          width: '80%',
          height: '80%',
          background: `radial-gradient(circle at 35% 35%, ${color}dd, ${color}88 50%, ${color}44)`,
          boxShadow: `0 0 30px ${color}55, inset 0 0 20px ${color}33`,
        }}
      >
        {/* Yarn wrap lines */}
        <div className="absolute inset-0 rounded-full overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute inset-0 rounded-full border-2"
              style={{
                borderColor: `${color}66`,
                transform: `rotate(${i * 22.5}deg)`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default YarnBall3DContent;
