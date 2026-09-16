import { useEffect, useId, useRef, useState } from 'react';
import { Button } from '../components/ui/Button';
import { IconButton } from '../components/ui/IconButton';
import { CheckIcon, CloseIcon, PencilIcon, PlusIcon } from '../components/ui/Icons';
import { Sheet } from '../components/ui/Sheet';
import { he } from '../copy/he';
import {
  MAX_CUSTOM_TEXT_LENGTH,
  MAX_CUSTOM_WORDS,
  validateCustomWord,
  type CustomWord,
  type CustomWordError,
} from '../game/customWords';
import styles from './CustomWordsSheet.module.css';

export interface CustomWordsSheetProps {
  open: boolean;
  onClose: () => void;
  words: readonly CustomWord[];
  onAdd: (word: string, hints: readonly string[]) => void;
  onUpdate: (id: string, word: string, hints: readonly string[]) => void;
  onRemove: (id: string) => void;
}

function errorText(error: CustomWordError): string {
  switch (error) {
    case 'emptyWord':
      return he.custom.errors.emptyWord;
    case 'wordTooLong':
      return he.custom.errors.wordTooLong(MAX_CUSTOM_TEXT_LENGTH);
    case 'duplicate':
      return he.custom.errors.duplicate;
    case 'noHints':
      return he.custom.errors.noHints;
    case 'hintTooLong':
      return he.custom.errors.hintTooLong(MAX_CUSTOM_TEXT_LENGTH);
    case 'hintIsWord':
      return he.custom.errors.hintIsWord;
    case 'tooMany':
      return he.custom.errors.tooMany(MAX_CUSTOM_WORDS);
    default:
      return '';
  }
}

const isEnter = (event: React.KeyboardEvent) => event.key === 'Enter' && !event.nativeEvent.isComposing;

/** Lets the group add, edit and remove their own words and hints. */
export function CustomWordsSheet({ open, onClose, words, onAdd, onUpdate, onRemove }: CustomWordsSheetProps) {
  const wordId = useId();
  const hintsId = useId();
  const errorId = useId();
  const wordRef = useRef<HTMLInputElement>(null);
  const hintsRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const [word, setWord] = useState('');
  const [hints, setHints] = useState('');
  const [error, setError] = useState<CustomWordError | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const pendingScroll = useRef(false);

  useEffect(() => {
    if (!open) {
      setWord('');
      setHints('');
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
  }, [words.length]);

  const handleAdd = () => {
    const check = validateCustomWord(word, hints, words);
    if (!check.ok) {
      setError(check.error);
      (check.error === 'noHints' || check.error === 'hintIsWord' || check.error === 'hintTooLong'
        ? hintsRef
        : wordRef
      ).current?.focus();
      return;
    }
    onAdd(check.word, check.hints);
    setWord('');
    setHints('');
    setError(null);
    setAnnouncement(he.custom.added(check.word));
    pendingScroll.current = true;
    wordRef.current?.focus();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={he.custom.title}
      subtitle={words.length > 0 ? he.counts.words(words.length) : undefined}
      footer={
        <Button variant="ink" block onClick={onClose}>
          {he.custom.done}
        </Button>
      }
    >
      <p className={styles.intro}>{he.custom.intro}</p>

      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault();
          handleAdd();
        }}
        noValidate
      >
        <label htmlFor={wordId} className={styles.label}>
          {he.custom.wordLabel}
        </label>
        <input
          id={wordId}
          ref={wordRef}
          data-autofocus
          className={styles.input}
          type="text"
          value={word}
          onChange={(event) => {
            setWord(event.target.value);
            if (error) setError(null);
          }}
          onKeyDown={(event) => {
            if (isEnter(event)) {
              event.preventDefault();
              hintsRef.current?.focus();
            }
          }}
          placeholder={he.custom.wordPlaceholder}
          autoComplete="off"
          maxLength={80}
          enterKeyHint="next"
          aria-invalid={error && error !== 'noHints' && error !== 'hintIsWord' && error !== 'hintTooLong' ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        />
        <label htmlFor={hintsId} className={styles.label}>
          {he.custom.hintsLabel}
        </label>
        <input
          id={hintsId}
          ref={hintsRef}
          className={styles.input}
          type="text"
          value={hints}
          onChange={(event) => {
            setHints(event.target.value);
            if (error) setError(null);
          }}
          onKeyDown={(event) => {
            if (isEnter(event)) {
              event.preventDefault();
              handleAdd();
            }
          }}
          placeholder={he.custom.hintsPlaceholder}
          autoComplete="off"
          maxLength={240}
          enterKeyHint="done"
          aria-invalid={error === 'noHints' || error === 'hintIsWord' || error === 'hintTooLong' ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        />
        <p className={styles.help}>{he.custom.hintsHelp}</p>
        <Button type="submit" variant="primary" block icon={<PlusIcon />}>
          {he.custom.add}
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

      {words.length === 0 ? (
        <p className={styles.empty}>{he.custom.listEmpty}</p>
      ) : (
        <ol className={styles.list} ref={listRef}>
          {words.map((entry) => (
            <li key={entry.id} className={styles.row}>
              {editingId === entry.id ? (
                <EditForm
                  entry={entry}
                  words={words}
                  onSave={(nextWord, nextHints) => {
                    onUpdate(entry.id, nextWord, nextHints);
                    setEditingId(null);
                    setAnnouncement(he.custom.updated(nextWord));
                  }}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <>
                  <div className={styles.rowText}>
                    <span className={styles.word}>
                      <bdi>{entry.word}</bdi>
                    </span>
                    <span className={styles.hints}>
                      {entry.hints.map((hint, index) => (
                        <span key={hint} className={styles.hint}>
                          {index > 0 ? <span aria-hidden="true"> · </span> : null}
                          <bdi>{hint}</bdi>
                        </span>
                      ))}
                    </span>
                  </div>
                  <IconButton aria-label={he.custom.editOf(entry.word)} onClick={() => setEditingId(entry.id)}>
                    <PencilIcon />
                  </IconButton>
                  <IconButton
                    aria-label={he.custom.removeOf(entry.word)}
                    onClick={() => {
                      onRemove(entry.id);
                      setAnnouncement(he.custom.removed(entry.word));
                    }}
                  >
                    <CloseIcon />
                  </IconButton>
                </>
              )}
            </li>
          ))}
        </ol>
      )}
    </Sheet>
  );
}

interface EditFormProps {
  entry: CustomWord;
  words: readonly CustomWord[];
  onSave: (word: string, hints: readonly string[]) => void;
  onCancel: () => void;
}

function EditForm({ entry, words, onSave, onCancel }: EditFormProps) {
  const wordId = useId();
  const hintsId = useId();
  const errorId = useId();
  const [word, setWord] = useState(entry.word);
  const [hints, setHints] = useState(entry.hints.join(', '));
  const [error, setError] = useState<CustomWordError | null>(null);
  const wordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    wordRef.current?.focus();
    wordRef.current?.select();
  }, []);

  const submit = () => {
    const check = validateCustomWord(word, hints, words, entry.id);
    if (!check.ok) {
      setError(check.error);
      return;
    }
    onSave(check.word, check.hints);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onCancel();
    } else if (isEnter(event)) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <form
      className={styles.editForm}
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      noValidate
    >
      <label htmlFor={wordId} className="sr-only">
        {he.custom.wordLabel}
      </label>
      <input
        id={wordId}
        ref={wordRef}
        className={styles.input}
        type="text"
        value={word}
        onChange={(event) => {
          setWord(event.target.value);
          if (error) setError(null);
        }}
        onKeyDown={onKeyDown}
        autoComplete="off"
        maxLength={80}
        aria-describedby={error ? errorId : undefined}
      />
      <label htmlFor={hintsId} className="sr-only">
        {he.custom.hintsLabel}
      </label>
      <input
        id={hintsId}
        className={styles.input}
        type="text"
        value={hints}
        onChange={(event) => {
          setHints(event.target.value);
          if (error) setError(null);
        }}
        onKeyDown={onKeyDown}
        autoComplete="off"
        maxLength={240}
        placeholder={he.custom.hintsPlaceholder}
        aria-describedby={error ? errorId : undefined}
      />
      <div className={styles.editActions}>
        <IconButton aria-label={he.custom.save} type="submit" tone="solid">
          <CheckIcon />
        </IconButton>
        <IconButton aria-label={he.custom.cancel} onClick={onCancel}>
          <CloseIcon />
        </IconButton>
      </div>
      {error ? (
        <p id={errorId} className={styles.error} role="alert">
          {errorText(error)}
        </p>
      ) : null}
    </form>
  );
}
