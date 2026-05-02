'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RotateCw } from 'lucide-react';

const TRIGGER_PX = 80;       // pull distance to fire refresh
const MAX_PULL_PX = 120;     // visual cap on pull distance
const DAMPING = 0.5;         // 1 = follows finger 1:1, lower = stiffer

export default function PullToRefresh() {
  const router = useRouter();
  const startY = useRef(null);
  const pullRef = useRef(0);
  const [pull, setPullState] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const setPull = (v) => {
    pullRef.current = v;
    setPullState(v);
  };

  useEffect(() => {
    const onTouchStart = (e) => {
      // Only engage when at very top of page
      if (window.scrollY > 0) return;
      startY.current = e.touches[0].clientY;
    };

    const onTouchMove = (e) => {
      if (startY.current == null) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy <= 0) {
        setPull(0);
        return;
      }
      // Block native scroll only while we're showing the pull
      if (window.scrollY <= 0) {
        e.preventDefault();
        const damped = Math.min(MAX_PULL_PX, dy * DAMPING);
        setPull(damped);
      }
    };

    const onTouchEnd = () => {
      if (startY.current == null) return;
      startY.current = null;
      const final = pullRef.current;
      if (final >= TRIGGER_PX && !refreshing) {
        setRefreshing(true);
        setPull(60); // snap-back to spinner position
        router.refresh();
        // RSC refresh has no completion callback — give it a beat for visual feedback
        setTimeout(() => {
          setRefreshing(false);
          setPull(0);
        }, 700);
      } else {
        setPull(0);
      }
    };

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd);
    document.addEventListener('touchcancel', onTouchEnd);
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
      document.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [router, refreshing]);

  const visible = pull > 0 || refreshing;
  const progress = Math.min(1, pull / TRIGGER_PX);

  return (
    <>
      <div
        aria-hidden
        className="fixed top-0 left-0 right-0 z-[60] flex justify-center pointer-events-none"
        style={{
          transform: `translateY(${Math.max(0, pull - 30)}px)`,
          opacity: visible ? Math.max(0.3, progress) : 0,
          transition: pull === 0 && !refreshing ? 'opacity 200ms, transform 200ms' : 'none',
        }}
      >
        <div className="mt-3 w-9 h-9 border border-cream-200 bg-white rounded-full flex items-center justify-center shadow-sm">
          <RotateCw
            size={15}
            strokeWidth={1.8}
            className={`text-charcoal-700 ${refreshing ? 'animate-spin' : ''}`}
            style={!refreshing ? { transform: `rotate(${progress * 270}deg)`, transition: 'transform 80ms linear' } : undefined}
          />
        </div>
      </div>
    </>
  );
}
