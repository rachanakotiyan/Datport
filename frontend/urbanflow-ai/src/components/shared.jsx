import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Animated counter hook
export function useAnimatedCounter(target, duration = 2000, startDelay = 0) {
  const [count, setCount] = useState(0);
  const frameRef = useRef(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const startTime = performance.now();
      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setCount(Math.round(target * eased));
        if (progress < 1) {
          frameRef.current = requestAnimationFrame(animate);
        }
      };
      frameRef.current = requestAnimationFrame(animate);
    }, startDelay);

    return () => {
      clearTimeout(timeout);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [target, duration, startDelay]);

  return count;
}

// Format number with commas
export function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(num >= 10000 ? 0 : 1) + 'K';
  return num.toLocaleString();
}

// Mini sparkline component
export function Sparkline({ data, color = '#6366f1', width = 80, height = 30 }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        points={points}
      />
      <polygon
        fill={`url(#spark-${color.replace('#', '')})`}
        points={`0,${height} ${points} ${width},${height}`}
      />
    </svg>
  );
}

// Congestion color helper
export function getCongestionColor(value) {
  if (value >= 80) return '#ef4444';
  if (value >= 60) return '#f59e0b';
  if (value >= 40) return '#eab308';
  if (value >= 20) return '#22c55e';
  return '#10b981';
}

// Congestion level text
export function getCongestionLevel(value) {
  if (value >= 80) return 'Severe';
  if (value >= 60) return 'Heavy';
  if (value >= 40) return 'Moderate';
  if (value >= 20) return 'Light';
  return 'Free Flow';
}

// Animation variants
export const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' }
  },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
};

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1
    }
  }
};

export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' }
  }
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: 'easeOut' }
  }
};

// Recharts custom tooltip
export function CustomTooltip({ active, payload, label, valueFormatter }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{
      background: 'rgba(17, 24, 39, 0.95)',
      border: '1px solid rgba(99, 102, 241, 0.3)',
      borderRadius: '8px',
      padding: '12px 16px',
      backdropFilter: 'blur(12px)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
    }}>
      <p style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '4px' }}>{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color || '#f1f5f9', fontSize: '0.85rem', fontWeight: 600 }}>
          {entry.name}: {valueFormatter ? valueFormatter(entry.value) : entry.value}
        </p>
      ))}
    </div>
  );
}

// Background particles component
export function BackgroundEffects() {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    size: 2 + Math.random() * 4,
    left: Math.random() * 100,
    delay: Math.random() * 15,
    duration: 12 + Math.random() * 18,
    color: i % 3 === 0 ? 'rgba(99, 102, 241, 0.5)' : i % 3 === 1 ? 'rgba(6, 182, 212, 0.4)' : 'rgba(139, 92, 246, 0.3)',
  }));

  return (
    <>
      <div className="cyber-grid" />
      <div className="ambient-glow ambient-glow-1" />
      <div className="ambient-glow ambient-glow-2" />
      <div className="bg-particles">
        {particles.map(p => (
          <div
            key={p.id}
            className="particle"
            style={{
              width: p.size,
              height: p.size,
              left: `${p.left}%`,
              background: p.color,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
            }}
          />
        ))}
      </div>
    </>
  );
}

// Refresh timestamp
export function RefreshIndicator() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 30000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="refresh-indicator">
      <span className="refresh-dot" />
      <span>Last refresh: {time.toLocaleTimeString()}</span>
    </div>
  );
}
