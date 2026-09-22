import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from 'react';

/** How close to the scroll container's edge a drag must get before it scrolls. */
const EDGE_ZONE = 56;
/** Upper bound on auto-scroll speed, in pixels per frame. */
const MAX_SCROLL_STEP = 14;

interface Metrics {
  /** Each row's offsetTop inside the list, measured once when the drag starts. */
  readonly tops: readonly number[];
  readonly heights: readonly number[];
  /** Distance a displaced neighbour travels: the dragged row's slot plus the list gap. */
  readonly slot: number;
}

interface DragState {
  readonly pointerId: number;
  readonly from: number;
  readonly startY: number;
  readonly startScrollTop: number;
  readonly metrics: Metrics;
  /** How far the dragged row has travelled, in list coordinates. */
  readonly delta: number;
  /** Where the dragged row would land if the pointer were released now. */
  readonly to: number;
}

export interface DragSort {
  /** The row being dragged, or null when idle. */
  readonly activeIndex: number | null;
  /** Vertical offset to render on the row at `index` while a drag is running. */
  translateFor(index: number): number;
  /** Spread onto each row's drag handle. */
  handleProps(index: number): {
    onPointerDown(event: ReactPointerEvent<HTMLElement>): void;
    onPointerMove(event: ReactPointerEvent<HTMLElement>): void;
    onPointerUp(event: ReactPointerEvent<HTMLElement>): void;
    onPointerCancel(event: ReactPointerEvent<HTMLElement>): void;
  };
}

export interface UseDragSortOptions {
  /** The list element whose direct children are the sortable rows. */
  listRef: RefObject<HTMLElement | null>;
  /** Called on release, only when the row actually changed position. */
  onDrop: (from: number, to: number) => void;
}

/** Nearest ancestor that actually scrolls, so a drag can reach off-screen rows. */
function findScroller(element: HTMLElement): HTMLElement | null {
  for (let node = element.parentElement; node; node = node.parentElement) {
    const overflowY = getComputedStyle(node).overflowY;
    if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight) return node;
  }
  return null;
}

function measure(list: HTMLElement, from: number): Metrics {
  const rows = Array.from(list.children) as HTMLElement[];
  const tops = rows.map((row) => row.offsetTop);
  const heights = rows.map((row) => row.offsetHeight);
  const first = tops[0] ?? 0;
  const gap = rows.length > 1 ? (tops[1] ?? 0) - first - (heights[0] ?? 0) : 0;
  return { tops, heights, slot: (heights[from] ?? 0) + gap };
}

/** The index the dragged row belongs at: how many other rows sit above its centre. */
function landingIndex(metrics: Metrics, from: number, delta: number): number {
  const centre = (metrics.tops[from] ?? 0) + delta + (metrics.heights[from] ?? 0) / 2;
  let index = 0;
  for (let i = 0; i < metrics.tops.length; i += 1) {
    if (i === from) continue;
    if ((metrics.tops[i] ?? 0) + (metrics.heights[i] ?? 0) / 2 < centre) index += 1;
  }
  return index;
}

/**
 * Pointer-driven vertical sorting for a list, using a per-row drag handle.
 *
 * Works the same for touch, mouse and pen because it only uses pointer events,
 * and it never reorders the DOM while dragging: rows are shifted with a
 * transform and the real move is reported once on release.
 */
export function useDragSort({ listRef, onDrop }: UseDragSortOptions): DragSort {
  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const scrollerRef = useRef<HTMLElement | null>(null);
  const pointerYRef = useRef(0);
  const frameRef = useRef(0);
  const onDropRef = useRef(onDrop);

  useEffect(() => {
    onDropRef.current = onDrop;
  }, [onDrop]);

  /** Recomputes the drag from the last known pointer position and scroll offset. */
  const track = useCallback(() => {
    const current = dragRef.current;
    if (!current) return;
    const scrolled = (scrollerRef.current?.scrollTop ?? 0) - current.startScrollTop;
    const delta = pointerYRef.current - current.startY + scrolled;
    const to = landingIndex(current.metrics, current.from, delta);
    if (delta === current.delta && to === current.to) return;
    const next: DragState = { ...current, delta, to };
    dragRef.current = next;
    setDrag(next);
  }, []);

  const autoScroll = useCallback(() => {
    frameRef.current = 0;
    const scroller = scrollerRef.current;
    if (!dragRef.current || !scroller) return;
    const rect = scroller.getBoundingClientRect();
    const y = pointerYRef.current;
    let step = 0;
    if (y < rect.top + EDGE_ZONE) step = -Math.min(MAX_SCROLL_STEP, (rect.top + EDGE_ZONE - y) / 3);
    else if (y > rect.bottom - EDGE_ZONE) step = Math.min(MAX_SCROLL_STEP, (y - (rect.bottom - EDGE_ZONE)) / 3);
    if (step === 0) return;
    const before = scroller.scrollTop;
    scroller.scrollTop = before + step;
    // Stop once the container has nothing left to scroll in that direction.
    if (scroller.scrollTop === before) return;
    track();
    frameRef.current = requestAnimationFrame(autoScroll);
  }, [track]);

  const stop = useCallback((commit: boolean) => {
    const current = dragRef.current;
    dragRef.current = null;
    scrollerRef.current = null;
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = 0;
    }
    setDrag(null);
    if (commit && current && current.to !== current.from) onDropRef.current(current.from, current.to);
  }, []);

  useEffect(() => () => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
  }, []);

  const handleProps = useCallback(
    (index: number) => ({
      onPointerDown(event: ReactPointerEvent<HTMLElement>) {
        const list = listRef.current;
        if (!list || dragRef.current || (event.pointerType === 'mouse' && event.button !== 0)) return;
        if (list.children.length < 2) return;
        const handle = event.currentTarget;
        // Keeps the press from selecting text or starting a native image drag,
        // so the handle is focused explicitly instead.
        event.preventDefault();
        handle.focus();
        handle.setPointerCapture(event.pointerId);
        scrollerRef.current = findScroller(list);
        const next: DragState = {
          pointerId: event.pointerId,
          from: index,
          startY: event.clientY,
          startScrollTop: scrollerRef.current?.scrollTop ?? 0,
          metrics: measure(list, index),
          delta: 0,
          to: index,
        };
        pointerYRef.current = event.clientY;
        dragRef.current = next;
        setDrag(next);
      },
      onPointerMove(event: ReactPointerEvent<HTMLElement>) {
        if (dragRef.current?.pointerId !== event.pointerId) return;
        pointerYRef.current = event.clientY;
        track();
        if (!frameRef.current) frameRef.current = requestAnimationFrame(autoScroll);
      },
      onPointerUp(event: ReactPointerEvent<HTMLElement>) {
        if (dragRef.current?.pointerId !== event.pointerId) return;
        stop(true);
      },
      onPointerCancel(event: ReactPointerEvent<HTMLElement>) {
        if (dragRef.current?.pointerId !== event.pointerId) return;
        stop(false);
      },
    }),
    [autoScroll, listRef, stop, track],
  );

  const translateFor = useCallback(
    (index: number) => {
      if (!drag) return 0;
      if (index === drag.from) return drag.delta;
      if (drag.to > drag.from && index > drag.from && index <= drag.to) return -drag.metrics.slot;
      if (drag.to < drag.from && index >= drag.to && index < drag.from) return drag.metrics.slot;
      return 0;
    },
    [drag],
  );

  return { activeIndex: drag?.from ?? null, translateFor, handleProps };
}
