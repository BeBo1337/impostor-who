import { useEffect, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { IconButton } from '../components/ui/IconButton';
import { CheckIcon, CloseIcon, GripIcon, PencilIcon, PlusIcon } from '../components/ui/Icons';
import { Sheet } from '../components/ui/Sheet';
import { he } from '../copy/he';
import { MAX_NAME_LENGTH, validateName, type NameError, type Player } from '../game/players';
import { MIN_PLAYERS } from '../game/rules';
import { useDragSort } from '../hooks/useDragSort';
import styles from './PlayersSheet.module.css';

export interface PlayersSheetProps {
  open: boolean;
  onClose: () => void;
  players: readonly Player[];
  onAdd: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onRemove: (id: string) => void;
  /** Reorders the roster, which is also the order the phone is passed in. */
  onMove: (id: string, toIndex: number) => void;
}

function errorText(error: NameError): string {
  switch (error) {
    case 'empty':
      return he.players.errors.empty;
    case 'tooLong':
      return he.players.errors.tooLong(MAX_NAME_LENGTH);
    case 'duplicate':
      return he.players.errors.duplicate;
    default:
      return '';
  }
}

export function PlayersSheet({ open, onClose, players, onAdd, onRename, onRemove, onMove }: PlayersSheetProps) {
  const inputId = useId();
  const errorId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<NameError | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const pendingScroll = useRef(false);

  useEffect(() => {
    if (!open) {
      setDraft('');
      setError(null);
      setEditingId(null);
      setAnnouncement('');
    }
  }, [open]);

  useEffect(() => {
    if (pendingScroll.current) {
      pendingScroll.current = false;
      listRef.current?.lastElementChild?.scrollIntoView({ block: 'nearest' });
    }
  }, [players.length]);

  const handleAdd = (event?: { preventDefault(): void }) => {
    event?.preventDefault();
    const check = validateName(draft, players);
    if (!check.ok) {
      setError(check.error);
      inputRef.current?.focus();
      return;
    }
    onAdd(check.name);
    setDraft('');
    setError(null);
    setAnnouncement(he.players.added(check.name));
    pendingScroll.current = true;
    inputRef.current?.focus();
  };

  const handleRemove = (player: Player) => {
    onRemove(player.id);
    setAnnouncement(he.players.removed(player.name));
    if (editingId === player.id) setEditingId(null);
  };

  const handleRename = (player: Player, name: string) => {
    onRename(player.id, name);
    setEditingId(null);
    setAnnouncement(he.players.renamed(name));
  };

  const handleMove = (player: Player, toIndex: number) => {
    if (toIndex < 0 || toIndex >= players.length) return;
    onMove(player.id, toIndex);
    setAnnouncement(he.players.moved(player.name, toIndex + 1, players.length));
  };

  // Arrow keys give the same reordering to anyone not using a pointer.
  const handleMoveKey = (event: ReactKeyboardEvent, player: Player, index: number) => {
    const step = event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : 0;
    if (step === 0) return;
    event.preventDefault();
    handleMove(player, index + step);
  };

  const sort = useDragSort({
    listRef,
    onDrop: (from, to) => {
      const player = players[from];
      if (player) handleMove(player, to);
    },
  });
  const reorderable = players.length > 1;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={he.players.title}
      subtitle={players.length > 0 ? he.counts.players(players.length) : he.players.minHint}
      footer={
        <Button variant="ink" block size="md" onClick={onClose}>
          {he.players.done}
        </Button>
      }
    >
      <form className={styles.addRow} onSubmit={handleAdd} noValidate>
        <label htmlFor={inputId} className="sr-only">
          {he.players.inputLabel}
        </label>
        <input
          id={inputId}
          ref={inputRef}
          data-autofocus
          className={styles.input}
          type="text"
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            if (error) setError(null);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
              event.preventDefault();
              handleAdd();
            }
          }}
          placeholder={he.players.inputPlaceholder}
          autoComplete="off"
          autoCapitalize="words"
          enterKeyHint="done"
          maxLength={80}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        />
        <Button type="submit" variant="primary" icon={<PlusIcon />} aria-label={he.players.add}>
          {he.players.add}
        </Button>
      </form>
      <div className={styles.messages}>
        {error ? (
          <p id={errorId} className={styles.error} role="alert">
            {errorText(error)}
          </p>
        ) : null}
        <p className="sr-only" role="status" aria-live="polite">
          {announcement}
        </p>
      </div>

      {players.length === 0 ? (
        <p className={styles.empty}>{he.players.listEmpty}</p>
      ) : (
        <>
          {reorderable ? <p className={styles.reorderHint}>{he.players.reorderHint}</p> : null}
          <ol className={[styles.list, sort.activeIndex !== null ? styles.dragging : null].filter(Boolean).join(' ')} ref={listRef}>
            {players.map((player, index) => {
              const offset = sort.translateFor(index);
              const held = sort.activeIndex === index;
              return (
                <li
                  key={player.id}
                  className={[styles.row, held ? styles.held : null].filter(Boolean).join(' ')}
                  style={offset === 0 && !held ? undefined : { transform: `translateY(${offset}px)` }}
                >
                  {editingId === player.id ? (
                    <RenameForm
                      player={player}
                      players={players}
                      onSave={(name) => handleRename(player, name)}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <>
                      {reorderable ? (
                        <button
                          type="button"
                          className={styles.handle}
                          aria-label={he.players.reorderOf(player.name, index + 1, players.length)}
                          onKeyDown={(event) => handleMoveKey(event, player, index)}
                          {...sort.handleProps(index)}
                        >
                          <span className={styles.handleGlyph} aria-hidden="true">
                            <GripIcon size={22} />
                          </span>
                        </button>
                      ) : null}
                      <Avatar id={player.id} name={player.name} />
                      <bdi className={styles.name}>{player.name}</bdi>
                      <IconButton aria-label={he.players.renameOf(player.name)} onClick={() => setEditingId(player.id)}>
                        <PencilIcon />
                      </IconButton>
                      <IconButton aria-label={he.players.removeOf(player.name)} onClick={() => handleRemove(player)}>
                        <CloseIcon />
                      </IconButton>
                    </>
                  )}
                </li>
              );
            })}
          </ol>
        </>
      )}
      {players.length > 0 && players.length < MIN_PLAYERS ? <p className={styles.minHint}>{he.players.minHint}</p> : null}
    </Sheet>
  );
}

interface RenameFormProps {
  player: Player;
  players: readonly Player[];
  onSave: (name: string) => void;
  onCancel: () => void;
}

function RenameForm({ player, players, onSave, onCancel }: RenameFormProps) {
  const id = useId();
  const errorId = useId();
  const [value, setValue] = useState(player.name);
  const [error, setError] = useState<NameError | null>(null);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);

  const submit = (event?: { preventDefault(): void }) => {
    event?.preventDefault();
    const check = validateName(value, players, player.id);
    if (!check.ok) {
      setError(check.error);
      ref.current?.focus();
      return;
    }
    onSave(check.name);
  };

  return (
    <form className={styles.renameForm} onSubmit={submit} noValidate>
      <label htmlFor={id} className="sr-only">
        {he.players.editLabel}
      </label>
      <input
        id={id}
        ref={ref}
        className={styles.input}
        type="text"
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          if (error) setError(null);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            onCancel();
          } else if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
            event.preventDefault();
            submit();
          }
        }}
        autoComplete="off"
        maxLength={80}
        enterKeyHint="done"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
      />
      <IconButton aria-label={he.players.save} type="submit" tone="solid">
        <CheckIcon />
      </IconButton>
      <IconButton aria-label={he.players.cancel} onClick={onCancel}>
        <CloseIcon />
      </IconButton>
      {error ? (
        <p id={errorId} className={styles.error} role="alert">
          {errorText(error)}
        </p>
      ) : null}
    </form>
  );
}
