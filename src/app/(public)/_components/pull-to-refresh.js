'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RotateCw } from 'lucide-react';

const TRIGGER_PX = 80;       // pull distance to fire refresh
const MAX_PULL_PX = 140;     // visual cap
const DAMPING = 0.5;         // 1 = follows finger, lower = stiffer
const HOLD_PX = 56;          // content offset held during refresh

export default function PullToRefresh({ children }) {
  const router = useRouter();
  const startY = useRef(null);
  const pullRef = useRef(0);
  const refreshingRef = useRef(false);
  const [pull, setPullState] = useState(0);
  const [refreshing, setRefreshingState] = useState(false);

  const setPull = (v) => {
    pullRef.current = v;
    setPullState(v);
  };
  const setRefreshing = (v) => {
    refreshingRef.current = v;
    setRefreshingState(v);
  };

  useEffect(() => {
    const onTouchStart = (e) => {
      if (window.scrollY > 0 || refreshingRef.current) return;
      startY.current = e.touches[0].clientY;
    };

    const onTouchMove = (e) => {
      if (startY.current == null) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy <= 0) {
        setPull(0);
        return;
      }
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
      if (final >= TRIGGER_PX && !refreshingRef.current) {
        setRefreshing(true);
        setPull(HOLD_PX);
        router.refresh();
        // RSC refresh has no completion callback; cushion for user feedback
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
  }, [router]);

  const visible = pull > 0 || refreshing;
  const progress = Math.min(1, pull / TRIGGER_PX);

  return (
    <>
      {/* Spinner sits below the header, behind the content. Revealed as the
          content (children) translates down with the finger. */}
      <div
        aria-hidden
        className="fixed left-0 right-0 z-30 flex justify-center pointer-events-none"
        style={{
          top: 'calc(3.5rem + env(safe-area-inset-top, 0px))', // below mobile header (h-14)
          opacity: visible ? Math.max(0.4, progress) : 0,
          transition: pull === 0 && !refreshing ? 'opacity 200ms' : 'none',
        }}
      >
        <div className="mt-2 w-9 h-9 border border-cream-200 bg-white rounded-full flex items-center justify-center shadow-sm">
          <RotateCw
            size={15}
            strokeWidth={1.8}
            className={`text-charcoal-700 ${refreshing ? 'animate-spin' : ''}`}
            style={!refreshing ? { transform: `rotate(${progress * 270}deg)`, transition: 'transform 80ms linear' } : undefined}
          />
        </div>
      </div>

      {/* The actual content — translates down with the pull. */}
      <div
        style={{
          transform: `translateY(${pull}px)`,
          transition: pull === 0 && !refreshing ? 'transform 250ms cubic-bezier(0.2, 0.7, 0.2, 1)' : 'none',
          willChange: 'transform',
        }}
      >
        {children}
      </div>
    </>
  );
}
