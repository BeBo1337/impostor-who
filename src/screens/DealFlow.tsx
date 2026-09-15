import { useEffect, useRef, type Dispatch } from 'react';
import { Mask } from '../components/mascot/Mask';
import { PeekingEyes } from '../components/mascot/PeekingEyes';
import { Button } from '../components/ui/Button';
import { IconButton } from '../components/ui/IconButton';
import { CloseIcon, EyeIcon, EyeOffIcon } from '../components/ui/Icons';
import { Sticker } from '../components/ui/Sticker';
import { he } from '../copy/he';
import type { DealAction, DealState } from '../game/dealReducer';
import { roleFor, starterOf, type Role, type Round, type RoundPlayer } from '../game/round';
import styles from './DealFlow.module.css';

type ActiveDealState = Exclude<DealState, { status: 'setup' }>;

export interface DealFlowProps {
  state: ActiveDealState;
  dispatch: Dispatch<DealAction>;
  onExitRequest: () => void;
  onNewRound: () => void;
  onBackToSetup: () => void;
}

export function DealFlow({ state, dispatch, onExitRequest, onNewRound, onBackToSetup }: DealFlowProps) {
  if (state.status === 'complete') {
    return <CompleteScreen round={state.round} onNewRound={onNewRound} onBackToSetup={onBackToSetup} />;
  }

  const player = state.round.players[state.index];
  if (!player) return null;
  const total = state.round.players.length;
  const position = state.index + 1;

  return (
    <div className={styles.screen}>
      <header className={styles.topBar}>
        <p className={styles.progress}>{he.deal.progress(position, total)}</p>
        <IconButton aria-label={he.deal.exit} tone="light" onClick={onExitRequest}>
          <CloseIcon />
        </IconButton>
      </header>

      {/* Public progress only; never any role information. */}
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {he.deal.progress(position, total)}. {he.deal.passTo} {player.name}
      </p>

      {state.status === 'handoff' ? (
        <HandoffStage
          key={`handoff-${state.index}`}
          player={player}
          armed={state.armed}
          onReveal={() => dispatch({ type: 'REVEAL' })}
        />
      ) : (
        <RevealStage
          key={`reveal-${state.index}`}
          player={player}
          round={state.round}
          armed={state.armed}
          onHide={() => dispatch({ type: 'CONCEAL_AND_ADVANCE' })}
        />
      )}
    </div>
  );
}

interface HandoffStageProps {
  player: RoundPlayer;
  armed: boolean;
  onReveal: () => void;
}

/** Public screen: identical for every player regardless of their role. */
function HandoffStage({ player, armed, onReveal }: HandoffStageProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div className={styles.stage}>
      <div className={styles.passBlock}>
        <p className={styles.passTo}>{he.deal.passTo}</p>
        <h1 ref={headingRef} tabIndex={-1} className={styles.playerName}>
          <bdi>{player.name}</bdi>
        </h1>
      </div>

      <div className={styles.sealedCard} aria-hidden="true">
        <PeekingEyes className={styles.sealedEyes} />
        <Sticker className={styles.sealedSticker} tone="lime" rotate={6}>
          {he.secretSticker}
        </Sticker>
        <p className={styles.sealedTitle}>{he.deal.forYourEyes}</p>
        <p className={styles.sealedCaption}>{he.deal.cardCaption}</p>
      </div>

      <Button
        variant="primary"
        size="lg"
        block
        icon={<EyeIcon />}
        aria-disabled={!armed}
        className={styles.action}
        onClick={() => {
          if (armed) onReveal();
        }}
      >
        {he.deal.reveal}
      </Button>
    </div>
  );
}

interface RevealStageProps {
  player: RoundPlayer;
  round: Round;
  armed: boolean;
  onHide: () => void;
}

/** Private screen: renders only the current player's role. */
function RevealStage({ player, round, armed, onHide }: RevealStageProps) {
  const cardRef = useRef<HTMLElement>(null);
  const role: Role = roleFor(round, player.id);

  useEffect(() => {
    cardRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div className={styles.stage}>
      <div className={styles.passBlock}>
        <p className={styles.passTo}>
          <bdi>{player.name}</bdi>
        </p>
      </div>

      <section
        ref={cardRef}
        tabIndex={-1}
        className={styles.roleCard}
        data-role={role.kind}
        aria-label={role.kind === 'word' ? he.deal.yourWord : he.deal.impostorTitle}
      >
        {role.kind === 'word' ? (
          <>
            <p className={styles.roleLabel}>{he.deal.yourWord}</p>
            <p className={styles.secret}>{role.word}</p>
            <p className={styles.roleNote}>{he.deal.keepSecret}</p>
          </>
        ) : (
          <>
            <h2 className={styles.impostorTitle}>{he.deal.impostorTitle}</h2>
            <Mask className={styles.mask} />
            <p className={styles.roleLabel}>{he.deal.yourHint}</p>
            <p className={styles.secret}>{role.hint}</p>
            <p className={styles.roleNote}>{he.deal.blendIn}</p>
          </>
        )}
      </section>

      <Button
        variant="paper"
        size="lg"
        block
        icon={<EyeOffIcon />}
        aria-disabled={!armed}
        className={styles.action}
        onClick={() => {
          if (armed) onHide();
        }}
      >
        {he.deal.hideAndContinue}
      </Button>
    </div>
  );
}

interface CompleteScreenProps {
  round: Round;
  onNewRound: () => void;
  onBackToSetup: () => void;
}

function CompleteScreen({ round, onNewRound, onBackToSetup }: CompleteScreenProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const starter = starterOf(round);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div className={styles.complete}>
      <div className={styles.completeCard}>
        <PeekingEyes mood="happy" className={styles.completeEyes} />
        <Sticker className={styles.completeSticker} tone="coral" rotate={-8} aria-hidden>
          {he.complete.sticker}
        </Sticker>
        <h1 ref={headingRef} tabIndex={-1} className={styles.completeTitle}>
          {he.complete.title}
        </h1>
        <p className={styles.completeBody}>{he.complete.body}</p>
        {/* Public: the opening speaker is drawn uniformly from everyone, so it says nothing about roles. */}
        <section className={styles.starter} aria-label={he.complete.starterLabel}>
          <p className={styles.starterLabel}>{he.complete.starterLabel}</p>
          <p className={styles.starterName}>
            <bdi>{starter.name}</bdi>
          </p>
          <p className={styles.starterCaption}>{he.complete.starterCaption}</p>
        </section>
      </div>
      <div className={styles.completeActions}>
        <Button variant="primary" size="lg" block onClick={onNewRound}>
          {he.complete.newRound}
        </Button>
        <Button variant="ghostLight" size="md" block onClick={onBackToSetup}>
          {he.complete.backToSetup}
        </Button>
      </div>
    </div>
  );
}
