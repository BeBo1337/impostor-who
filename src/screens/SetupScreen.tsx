import { useId } from 'react';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { IconButton } from '../components/ui/IconButton';
import { CategoryIcon } from '../components/icons/CategoryIcon';
import { HelpIcon, MinusIcon, PencilIcon, PlusIcon } from '../components/ui/Icons';
import { Sticker } from '../components/ui/Sticker';
import { PeekingEyes } from '../components/mascot/PeekingEyes';
import { he } from '../copy/he';
import { CATEGORIES, getCategory } from '../data/categories';
import { maxImpostors, type StartCheck } from '../game/rules';
import type { SetupState } from '../game/setupReducer';
import styles from './SetupScreen.module.css';

export interface SetupScreenProps {
  setup: SetupState;
  startCheck: StartCheck;
  storageAvailable: boolean;
  onOpenPlayers: () => void;
  onOpenCategories: () => void;
  onOpenCustomWords: () => void;
  onOpenHowTo: () => void;
  onImpostorCountChange: (count: number) => void;
  onStart: () => void;
}

const ROSTER_PREVIEW = 10;
const CATEGORY_PREVIEW = 8;

function blockedReason(check: StartCheck): string | null {
  if (check.ok) return null;
  switch (check.reason) {
    case 'players':
      return he.setup.startBlockedPlayers;
    case 'categories':
      return he.setup.startBlockedCategories;
    case 'impostors':
      return he.setup.startBlockedImpostors;
    default:
      return null;
  }
}

export function SetupScreen({
  setup,
  startCheck,
  storageAvailable,
  onOpenPlayers,
  onOpenCategories,
  onOpenCustomWords,
  onOpenHowTo,
  onImpostorCountChange,
  onStart,
}: SetupScreenProps) {
  const playersHeadingId = useId();
  const categoriesHeadingId = useId();
  const customHeadingId = useId();
  const impostorsHeadingId = useId();
  const reasonId = useId();
  const customCount = setup.customWords.length;
  const customSelected = setup.categoryIds.includes('custom');

  const playerCount = setup.players.length;
  const max = maxImpostors(playerCount);
  const reason = blockedReason(startCheck);
  const visiblePlayers = setup.players.slice(0, ROSTER_PREVIEW);
  const hiddenPlayers = playerCount - visiblePlayers.length;
  const selectedCategories = setup.categoryIds.map(getCategory);
  const visibleCategories = selectedCategories.slice(0, CATEGORY_PREVIEW);
  const hiddenCategories = selectedCategories.length - visibleCategories.length;

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroCard}>
          <PeekingEyes className={styles.heroEyes} />
          <Sticker className={styles.heroSticker} tone="coral" rotate={-7} aria-hidden>
            {he.topSecretSticker}
          </Sticker>
          <h1 className={styles.title}>{he.appName}</h1>
          <p className={styles.tagline}>{he.tagline}</p>
        </div>
      </header>

      <main className={styles.main}>
        <section className={[styles.section, styles.players].join(' ')} aria-labelledby={playersHeadingId}>
          <div className={styles.sectionHead}>
            <h2 id={playersHeadingId} className={styles.sectionTitle}>
              {he.setup.playersTitle}
            </h2>
            <span className={styles.sectionCount}>{playerCount > 0 ? he.counts.players(playerCount) : null}</span>
            <Button
              variant={playerCount === 0 ? 'primary' : 'ghost'}
              size="sm"
              onClick={onOpenPlayers}
              icon={playerCount === 0 ? <PlusIcon /> : <PencilIcon />}
            >
              {playerCount === 0 ? he.setup.playersAdd : he.setup.playersEdit}
            </Button>
          </div>
          {playerCount === 0 ? (
            <button type="button" className={styles.emptyPlayers} onClick={onOpenPlayers}>
              <span className={styles.emptyEyes} aria-hidden="true">
                <PeekingEyes />
              </span>
              <span className={styles.emptyTitle}>{he.setup.playersEmpty}</span>
              <span className={styles.emptyHint}>{he.setup.playersEmptyHint}</span>
            </button>
          ) : (
            <ul className={styles.roster}>
              {visiblePlayers.map((player) => (
                <li key={player.id} className={styles.rosterItem}>
                  <Avatar id={player.id} name={player.name} size="sm" />
                  <bdi className={styles.rosterName}>{player.name}</bdi>
                </li>
              ))}
              {hiddenPlayers > 0 ? (
                <li className={[styles.rosterItem, styles.rosterMore].join(' ')}>{he.setup.playersMore(hiddenPlayers)}</li>
              ) : null}
            </ul>
          )}
        </section>

        <section className={[styles.section, styles.categories].join(' ')} aria-labelledby={categoriesHeadingId}>
          <div className={styles.sectionHead}>
            <h2 id={categoriesHeadingId} className={styles.sectionTitle}>
              {he.setup.categoriesTitle}
            </h2>
            <span className={styles.sectionCount}>
              {selectedCategories.length > 0
                ? he.setup.categoriesSelected(selectedCategories.length, CATEGORIES.length)
                : null}
            </span>
            <Button variant="paper" size="sm" onClick={onOpenCategories}>
              {he.setup.categoriesChoose}
            </Button>
          </div>
          {selectedCategories.length === 0 ? (
            <p className={styles.categoriesEmpty}>{he.setup.categoriesEmpty}</p>
          ) : (
            <ul className={styles.chips}>
              {visibleCategories.map((category) => (
                <li key={category.id} className={styles.chip} data-tone={category.tone}>
                  <CategoryIcon id={category.id} size={20} className={styles.chipIcon} />
                  <span>{category.label}</span>
                </li>
              ))}
              {hiddenCategories > 0 ? (
                <li className={[styles.chip, styles.chipMore].join(' ')}>{he.setup.playersMore(hiddenCategories)}</li>
              ) : null}
            </ul>
          )}
        </section>

        <section className={[styles.section, styles.custom].join(' ')} aria-labelledby={customHeadingId}>
          <div className={styles.sectionHead}>
            <h2 id={customHeadingId} className={styles.sectionTitle}>
              {he.setup.customTitle}
            </h2>
            <span className={styles.sectionCount}>{customCount > 0 ? he.counts.words(customCount) : null}</span>
            <Button
              variant={customCount === 0 ? 'primary' : 'ghost'}
              size="sm"
              onClick={onOpenCustomWords}
              icon={customCount === 0 ? <PlusIcon /> : <PencilIcon />}
            >
              {customCount === 0 ? he.setup.customAdd : he.setup.customEdit}
            </Button>
          </div>
          <p className={styles.customStatus}>
            {customCount === 0
              ? he.setup.customEmpty
              : customSelected
                ? he.setup.customIncluded
                : he.setup.customNotIncluded}
          </p>
        </section>

        <section className={[styles.section, styles.impostors].join(' ')} aria-labelledby={impostorsHeadingId}>
          <div className={styles.sectionHead}>
            <h2 id={impostorsHeadingId} className={styles.sectionTitle}>
              {he.setup.impostorsTitle}
            </h2>
            <span className={styles.sectionCount}>{he.setup.impostorsMax(max)}</span>
          </div>
          <div className={styles.stepperRow}>
            <p className={styles.stepperLabel}>{he.setup.impostorsLabel}</p>
            <div className={styles.stepper}>
              <IconButton
                aria-label={he.setup.impostorsDecrease}
                onClick={() => onImpostorCountChange(setup.impostorCount - 1)}
                disabled={setup.impostorCount <= 1}
              >
                <MinusIcon />
              </IconButton>
              <div className={styles.stepperValue} aria-live="polite" aria-atomic="true">
                <span aria-hidden="true">{setup.impostorCount}</span>
                <span className="sr-only">{he.counts.impostors(setup.impostorCount)}</span>
              </div>
              <IconButton
                aria-label={he.setup.impostorsIncrease}
                onClick={() => onImpostorCountChange(setup.impostorCount + 1)}
                disabled={setup.impostorCount >= max}
              >
                <PlusIcon />
              </IconButton>
            </div>
          </div>
          <p className={styles.rule}>{he.setup.impostorsRule}</p>
        </section>

        <button type="button" className={styles.howTo} onClick={onOpenHowTo}>
          <span className={styles.howToIcon} aria-hidden="true">
            <HelpIcon />
          </span>
          <span className={styles.howToText}>
            <span className={styles.howToTitle}>{he.setup.howToTitle}</span>
            <span className={styles.howToHint}>{he.setup.howToHint}</span>
          </span>
        </button>

        {!storageAvailable ? <p className={styles.storageNote}>{he.setup.storageUnavailable}</p> : null}
      </main>

      <footer className={styles.footer}>
        {reason ? (
          <p id={reasonId} className={styles.blocked} role="status">
            {reason}
          </p>
        ) : null}
        <Button
          variant="primary"
          size="lg"
          block
          aria-disabled={!startCheck.ok}
          aria-describedby={reason ? reasonId : undefined}
          onClick={() => {
            if (startCheck.ok) onStart();
          }}
        >
          {he.setup.start}
        </Button>
      </footer>
    </div>
  );
}
