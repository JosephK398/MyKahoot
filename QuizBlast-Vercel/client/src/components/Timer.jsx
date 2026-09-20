/**
 * QuizBlast — components/Timer.jsx
 * Circular SVG countdown timer.
 * Props:
 *   duration  — total seconds (resets when changed)
 *   size      — SVG px size (default 72)
 *   onExpire  — callback when timer hits 0
 */

import { useState, useEffect, useRef } from 'react';

export default function Timer({ duration, onExpire, size = 72 }) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const startRef   = useRef(Date.now());
  const expiredRef = useRef(false);

  // Reset whenever duration prop changes (new question)
  useEffect(() => {
    setTimeLeft(duration);
    startRef.current = Date.now();
    expiredRef.current = false;

    const id = setInterval(() => {
      const elapsed   = (Date.now() - startRef.current) / 1000;
      const remaining = Math.max(0, duration - elapsed);
      setTimeLeft(remaining);

      if (remaining === 0 && !expiredRef.current) {
        expiredRef.current = true;
        clearInterval(id);
        onExpire?.();
      }
    }, 100);

    return () => clearInterval(id);
  }, [duration]); // eslint-disable-line react-hooks/exhaustive-deps

  const R            = size / 2 - 6;
  const circumference = 2 * Math.PI * R;
  const progress     = timeLeft / duration;
  const dashOffset   = circumference * (1 - progress);

  // Colour: green → amber → red
  const stroke = progress > 0.5 ? '#30D158' : progress > 0.25 ? '#FF9F0A' : '#FF2D55';

  return (
    <svg
      className="timer-svg"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-label={`${Math.ceil(timeLeft)} seconds remaining`}
    >
      {/* Track */}
      <circle
        cx={size / 2} cy={size / 2} r={R}
        fill="none"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth="6"
      />
      {/* Progress arc */}
      <circle
        cx={size / 2} cy={size / 2} r={R}
        fill="none"
        stroke={stroke}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.1s linear, stroke 0.4s ease' }}
      />
      {/* Number */}
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fill="white"
        fontSize={size * 0.32}
        fontFamily="'Fredoka One', system-ui"
        fontWeight="400"
      >
        {Math.ceil(timeLeft)}
      </text>
    </svg>
  );
}
