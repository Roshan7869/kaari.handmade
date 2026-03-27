'use client'
import { YarnBall3DContent } from './YarnBall3DContent';

interface YarnBall3DProps {
  size?: number;
  color?: string;
  animated?: boolean;
}

export default function YarnBall3D({ size = 200, color = '#FF6B9D', animated = true }: YarnBall3DProps) {
  return (
    <div style={{ width: size, height: size }}>
      <YarnBall3DContent color={color} animated={animated} />
    </div>
  );
}
