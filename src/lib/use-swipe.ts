import { useRef, useCallback, useEffect } from 'react';

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
}

interface PointerHandlerProps {
  onPointerDown:   (e: React.PointerEvent) => void;
  onPointerMove:   (e: React.PointerEvent) => void;
  onPointerUp:     (e: React.PointerEvent) => void;
  onPointerCancel: (e: React.PointerEvent) => void;
  onClickCapture:  (e: React.MouseEvent) => void;
  style:           { touchAction: 'pan-y' };
}

// Unified swipe handler for touch + mouse drag using pointer events.
// Returns props to spread on the swipeable element. Suppresses click that
// follows a real drag so swipe doesn't trigger nested click handlers.
export function useSwipe({ onSwipeLeft, onSwipeRight, threshold = 40 }: SwipeHandlers): PointerHandlerProps {
  const start  = useRef<{ x: number; y: number } | null>(null);
  const moved  = useRef(false);
  const swiped = useRef(false);

  const reset = () => {
    start.current = null;
    moved.current = false;
  };

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    start.current = { x: e.clientX, y: e.clientY };
    moved.current = false;
    swiped.current = false;
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!start.current) return;
    const dx = e.clientX - start.current.x;
    const dy = e.clientY - start.current.y;
    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) moved.current = true;
    // For mouse drag, prevent text selection while swiping horizontally
    if (e.pointerType === 'mouse' && Math.abs(dx) > Math.abs(dy)) {
      e.preventDefault();
    }
  }, []);

  const finish = useCallback((e: React.PointerEvent) => {
    if (!start.current) return;
    const dx = e.clientX - start.current.x;
    const dy = e.clientY - start.current.y;
    const ax = Math.abs(dx);
    const ay = Math.abs(dy);
    reset();
    // Horizontal swipe wins over vertical, must clear threshold
    if (ax < threshold || ax < ay) return;
    swiped.current = true;
    if (dx < 0) onSwipeLeft?.();
    else        onSwipeRight?.();
  }, [onSwipeLeft, onSwipeRight, threshold]);

  const onPointerUp     = finish;
  const onPointerCancel = useCallback(() => reset(), []);

  // Suppress synthetic click that fires after a drag-swipe (prevents
  // accidentally opening lightbox / following links after a drag).
  const onClickCapture = useCallback((e: React.MouseEvent) => {
    if (swiped.current) {
      e.stopPropagation();
      e.preventDefault();
      swiped.current = false;
    }
  }, []);

  return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onClickCapture, style: { touchAction: 'pan-y' } };
}

// Drag-to-scroll for horizontally-overflowing strips (mouse + touch).
// Native touch already pans the strip; this hook adds mouse-drag support
// and suppresses the click that fires after a real drag (so dragging
// across thumbnails doesn't accidentally select one). Click without drag
// still works normally — a tap selects the thumb.
export function useDragScroll<T extends HTMLElement>(threshold = 6) {
  const ref = useRef<T | null>(null);
  const state = useRef({ active: false, startX: 0, startScroll: 0, moved: false });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onPointerDown = (e: PointerEvent) => {
      // Only handle mouse drag here — touch already gets native scrolling
      if (e.pointerType !== 'mouse') return;
      if (e.button !== 0) return;
      state.current = { active: true, startX: e.clientX, startScroll: el.scrollLeft, moved: false };
      el.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!state.current.active) return;
      const dx = e.clientX - state.current.startX;
      if (Math.abs(dx) > threshold) state.current.moved = true;
      if (state.current.moved) {
        el.scrollLeft = state.current.startScroll - dx;
        e.preventDefault();
      }
    };

    const finish = (e: PointerEvent) => {
      if (!state.current.active) return;
      const wasMoved = state.current.moved;
      state.current.active = false;
      try { el.releasePointerCapture(e.pointerId); } catch {}
      if (wasMoved) {
        // Suppress the click that follows the drag
        const blockClick = (ev: MouseEvent) => {
          ev.stopPropagation();
          ev.preventDefault();
          el.removeEventListener('click', blockClick, true);
        };
        el.addEventListener('click', blockClick, true);
        // Fallback: clear the listener if no click arrives
        setTimeout(() => el.removeEventListener('click', blockClick, true), 250);
      }
    };

    el.addEventListener('pointerdown',   onPointerDown);
    el.addEventListener('pointermove',   onPointerMove);
    el.addEventListener('pointerup',     finish);
    el.addEventListener('pointercancel', finish);
    return () => {
      el.removeEventListener('pointerdown',   onPointerDown);
      el.removeEventListener('pointermove',   onPointerMove);
      el.removeEventListener('pointerup',     finish);
      el.removeEventListener('pointercancel', finish);
    };
  }, [threshold]);

  return ref;
}
