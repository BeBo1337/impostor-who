import { act, fireEvent, render, screen } from '@testing-library/react';
import { useEffect, useReducer, useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ARM_DELAY_MS, INITIAL_DEAL_STATE, dealReducer, type DealState } from '../game/dealReducer';
import type { Round } from '../game/round';
import { useConcealOnHide } from '../hooks/useConcealOnHide';
import { DealFlow } from './DealFlow';

const WORD = 'מטרייה';
const HINT = 'מזג אוויר';

const round: Round = {
  id: 'round-test',
  players: [
    { id: 'p1', name: 'אורי' },
    { id: 'p2', name: 'Dana' },
    { id: 'p3', name: 'גל' },
    { id: 'p4', name: 'נועה 🎉' },
  ],
  impostorIds: new Set(['p2']),
  entry: { id: 'everyday:מטרייה', categoryId: 'everyday', word: WORD, hints: [HINT, 'ימי חורף', 'ידית'] },
  hint: HINT,
  starterId: 'p3',
};

/** Minimal host mirroring App: arm timer, conceal-on-hide, rerender trigger. */
function Host({ onState }: { onState?: (state: DealState) => void }) {
  const [state, dispatch] = useReducer(dealReducer, INITIAL_DEAL_STATE, () =>
    dealReducer(INITIAL_DEAL_STATE, { type: 'START_ROUND', round }),
  );
  const [tick, setTick] = useState(0);

  useEffect(() => {
    onState?.(state);
  }, [state, onState]);

  useEffect(() => {
    if ((state.status === 'handoff' || state.status === 'revealed') && !state.armed) {
      const timer = setTimeout(() => dispatch({ type: 'ARM' }), ARM_DELAY_MS);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [state]);

  useConcealOnHide(state.status === 'revealed', () => dispatch({ type: 'CONCEAL' }));

  if (state.status === 'setup') return <p>setup</p>;
  return (
    <>
      <button type="button" onClick={() => setTick((t) => t + 1)}>
        rerender {tick}
      </button>
      <DealFlow state={state} dispatch={dispatch} onExitRequest={() => {}} onNewRound={() => {}} onBackToSetup={() => {}} />
    </>
  );
}

const revealButton = () => screen.getByRole('button', { name: /הצגת התפקיד שלי/ });
const hideButton = () => screen.getByRole('button', { name: /הסתרה והמשך/ });
const arm = () => act(() => vi.advanceTimersByTime(ARM_DELAY_MS + 10));

function setVisibility(state: 'hidden' | 'visible') {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state });
  fireEvent(document, new Event('visibilitychange'));
}

describe('DealFlow', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
  });

  it('shows a concealed handoff with public progress and no secret content', () => {
    render(<Host />);
    expect(screen.getByText('העבירו את הטלפון ל…')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('אורי');
    expect(screen.getAllByText('שחקן 1 מתוך 4').length).toBeGreaterThan(0);
    expect(document.body.textContent).not.toContain(WORD);
    expect(document.body.textContent).not.toContain(HINT);
    expect(document.body.textContent).not.toContain('המתחזה!');
  });

  it('ignores a reveal tap before the handoff is armed, then reveals the word for an ordinary player', () => {
    render(<Host />);
    fireEvent.click(revealButton());
    expect(document.body.textContent).not.toContain(WORD);

    arm();
    fireEvent.click(revealButton());
    expect(screen.getByText(WORD)).toBeInTheDocument();
    expect(screen.getByText('המילה שלך')).toBeInTheDocument();
    expect(document.body.textContent).not.toContain(HINT);
  });

  it('gives the impostor the hint and never the word', () => {
    render(<Host />);
    // Player 1 (ordinary) → hide → Player 2 (impostor).
    arm();
    fireEvent.click(revealButton());
    arm();
    fireEvent.click(hideButton());
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Dana');
    arm();
    fireEvent.click(revealButton());
    expect(screen.getByText('אתה המתחזה!')).toBeInTheDocument();
    expect(screen.getByText(HINT)).toBeInTheDocument();
    expect(document.body.textContent).not.toContain(WORD);
  });

  it('does not skip a player on a rapid double tap of hide-and-continue', () => {
    render(<Host />);
    arm();
    fireEvent.click(revealButton());
    arm();
    fireEvent.click(hideButton());
    // The second tap lands on the freshly shown handoff; it must not reveal anything.
    fireEvent.click(revealButton());
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Dana');
    expect(document.body.textContent).not.toContain(WORD);
    expect(document.body.textContent).not.toContain(HINT);
  });

  it('does not advance when hide is tapped immediately after reveal', () => {
    render(<Host />);
    arm();
    fireEvent.click(revealButton());
    fireEvent.click(hideButton());
    expect(screen.getByText(WORD)).toBeInTheDocument();
    expect(screen.getAllByText('שחקן 1 מתוך 4').length).toBeGreaterThan(0);
  });

  it('conceals the card when the page is hidden and requires the same player to reveal again', () => {
    render(<Host />);
    arm();
    fireEvent.click(revealButton());
    expect(screen.getByText(WORD)).toBeInTheDocument();

    setVisibility('hidden');
    expect(document.body.textContent).not.toContain(WORD);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('אורי');
    expect(screen.getAllByText('שחקן 1 מתוך 4').length).toBeGreaterThan(0);

    setVisibility('visible');
    fireEvent.click(revealButton());
    expect(document.body.textContent).not.toContain(WORD);
    arm();
    fireEvent.click(revealButton());
    expect(screen.getByText(WORD)).toBeInTheDocument();
  });

  it('conceals the card when the window loses focus', () => {
    render(<Host />);
    arm();
    fireEvent.click(revealButton());
    fireEvent(window, new Event('blur'));
    expect(document.body.textContent).not.toContain(WORD);
  });

  it('removes private content from the DOM before showing the next handoff', () => {
    render(<Host />);
    arm();
    fireEvent.click(revealButton());
    arm();
    fireEvent.click(hideButton());
    expect(document.body.textContent).not.toContain(WORD);
    expect(document.body.textContent).not.toContain(HINT);
    expect(screen.getByText('העבירו את הטלפון ל…')).toBeInTheDocument();
  });

  it('keeps the same assignment across rerenders', () => {
    render(<Host />);
    arm();
    fireEvent.click(revealButton());
    expect(screen.getByText(WORD)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /rerender/ }));
    fireEvent.click(screen.getByRole('button', { name: /rerender/ }));
    expect(screen.getByText(WORD)).toBeInTheDocument();
    expect(screen.getByText('המילה שלך')).toBeInTheDocument();
  });

  it('completes only after every player has viewed their card', () => {
    const states: DealState[] = [];
    render(<Host onState={(s) => states.push(s)} />);
    for (let i = 0; i < round.players.length; i += 1) {
      expect(screen.queryByText('כל התפקידים חולקו!')).not.toBeInTheDocument();
      arm();
      fireEvent.click(revealButton());
      arm();
      fireEvent.click(hideButton());
    }
    expect(screen.getByText('כל התפקידים חולקו!')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'סבב חדש' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'חזרה להגדרות' })).toBeInTheDocument();
    expect(document.body.textContent).not.toContain(WORD);
    expect(document.body.textContent).not.toContain(HINT);
    expect(states.at(-1)?.status).toBe('complete');
  });

  it('announces the randomly drawn opening player on the ready screen without exposing roles', () => {
    render(<Host />);
    for (let i = 0; i < round.players.length; i += 1) {
      arm();
      fireEvent.click(revealButton());
      arm();
      fireEvent.click(hideButton());
    }
    const starterSection = screen.getByRole('region', { name: 'מתחילים עם' });
    expect(starterSection).toHaveTextContent('גל');
    expect(starterSection).toHaveTextContent('נבחר בהגרלה מבין כל השחקנים');
    expect(document.body.textContent).not.toContain('המתחזה!');
    expect(document.body.textContent).not.toContain(WORD);
    expect(document.body.textContent).not.toContain(HINT);
  });
});
