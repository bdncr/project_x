"use client";

import { FocusEvent, KeyboardEvent, useEffect, useRef, useState } from "react";

/** Short enough to feel instant, long enough that dragging the pointer across the rail on the
 * way to another button doesn't flash a card open. */
const OPEN_DELAY_MS = 220;
/** Grace period after leaving the trigger, so the pointer can travel into the card itself. */
const CLOSE_DELAY_MS = 200;

/**
 * Open/close behaviour for a rail hover card: delayed open, forgiving close, and keyboard
 * parity (focus opens, focus leaving the wrapper closes, Escape closes). Spread `hoverProps`
 * onto the element that wraps both the trigger and the card, so the card counts as "inside"
 * and hovering it does not close it.
 *
 * `onFirstOpen` fires once per mount, for cards that fetch their contents lazily.
 */
export function useHoverCard(onFirstOpen?: () => void) {
  const [open, setOpen] = useState(false);
  const openedRef = useRef(false);
  const openTimer = useRef<number | undefined>(undefined);
  const closeTimer = useRef<number | undefined>(undefined);
  /* Held in a ref so a caller passing an inline arrow does not re-arm anything. */
  const firstOpenRef = useRef(onFirstOpen);
  firstOpenRef.current = onFirstOpen;

  useEffect(() => () => {
    window.clearTimeout(openTimer.current);
    window.clearTimeout(closeTimer.current);
  }, []);

  function reveal() {
    setOpen(true);
    if (openedRef.current) return;
    openedRef.current = true;
    firstOpenRef.current?.();
  }

  const hoverProps = {
    onMouseEnter: () => {
      window.clearTimeout(closeTimer.current);
      openTimer.current = window.setTimeout(reveal, OPEN_DELAY_MS);
    },
    onMouseLeave: () => {
      window.clearTimeout(openTimer.current);
      closeTimer.current = window.setTimeout(() => setOpen(false), CLOSE_DELAY_MS);
    },
    onFocus: () => {
      window.clearTimeout(closeTimer.current);
      reveal();
    },
    onBlur: (event: FocusEvent<HTMLElement>) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
    },
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
      if (event.key === "Escape") setOpen(false);
    },
  };

  /** Lets a caller reset the "already fetched" latch when the underlying subject changes. */
  function reset() {
    openedRef.current = false;
    setOpen(false);
  }

  return { open, hoverProps, reset };
}
