
import React, { useEffect, useRef } from 'react';

interface VisualizerProps {
  active: boolean;
  color: string;
}

const Visualizer: React.FC<VisualizerProps> = ({ active, color }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const bars = 40;
    const barWidth = 4;
    const gap = 2;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = color;

      for (let i = 0; i < bars; i++) {
        const height = Math.random() * (active ? 40 : 2) + 2;
        const x = i * (barWidth + gap);
        const y = (canvas.height - height) / 2;
        ctx.fillRect(x, y, barWidth, height);
      }
      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [active, color]);

  return (
    <canvas 
      ref={canvasRef} 
      width={240} 
      height={50} 
      className="opacity-60"
    />
  );
};

export default Visualizer;
