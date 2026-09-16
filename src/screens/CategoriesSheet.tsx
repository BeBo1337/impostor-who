import { useEffect, useState } from 'react';
import { CategoryIcon } from '../components/icons/CategoryIcon';
import { Button } from '../components/ui/Button';
import { CheckIcon } from '../components/ui/Icons';
import { Sheet } from '../components/ui/Sheet';
import { he } from '../copy/he';
import { CATEGORIES, CATEGORY_IDS, CUSTOM_CATEGORY } from '../data/categories';
import type { CategoryId } from '../data/types';
import styles from './CategoriesSheet.module.css';

export interface CategoriesSheetProps {
  open: boolean;
  onClose: () => void;
  selectedIds: readonly CategoryId[];
  /** How many words the players have typed in; the custom tile is only selectable with at least one. */
  customWordCount: number;
  onConfirm: (ids: CategoryId[]) => void;
}

/**
 * Category picker. Changes are a draft until "אישור"; closing or cancelling
 * keeps the previous selection untouched.
 */
export function CategoriesSheet({ open, onClose, selectedIds, customWordCount, onConfirm }: CategoriesSheetProps) {
  const customAvailable = customWordCount > 0;
  const [draft, setDraft] = useState<ReadonlySet<CategoryId>>(() => new Set(selectedIds));

  useEffect(() => {
    if (open) setDraft(new Set(selectedIds.filter((id) => id !== 'custom' || customAvailable)));
  }, [open, selectedIds, customAvailable]);

  const toggle = (id: CategoryId) => {
    setDraft((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setDraft(new Set([...CATEGORY_IDS, ...(customAvailable ? (['custom'] as const) : [])]));

  const confirm = () => {
    if (draft.size === 0) return;
    const ordered: CategoryId[] = [...(draft.has('custom') ? (['custom'] as const) : []), ...CATEGORY_IDS.filter((id) => draft.has(id))];
    onConfirm(ordered);
  };

  const count = draft.size;
  const total = CATEGORIES.length + (customAvailable ? 1 : 0);
  const customSelected = draft.has('custom');

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={he.categories.title}
      toolbar={
        <div className={styles.toolbar}>
          <span className={styles.countBadge} aria-live="polite" aria-atomic="true">
            <span aria-hidden="true">{count}</span>
            <span className="sr-only">{he.categories.selectedOf(count, total)}</span>
          </span>
          <div className={styles.links}>
            <button type="button" className={styles.link} onClick={selectAll} disabled={count === total}>
              {he.categories.selectAll}
            </button>
            <span className={styles.divider} aria-hidden="true">
              /
            </span>
            <button type="button" className={styles.link} onClick={() => setDraft(new Set())} disabled={count === 0}>
              {he.categories.clear}
            </button>
          </div>
        </div>
      }
      footer={
        <div className={styles.footer}>
          <p className={styles.summary} data-error={count === 0 ? 'true' : 'false'} role="status">
            {count === 0 ? he.categories.needOne : he.categories.countSelected(count)}
          </p>
          <div className={styles.actions}>
            <Button variant="primary" icon={<CheckIcon />} aria-disabled={count === 0} onClick={confirm}>
              {he.categories.confirm}
            </Button>
            <Button variant="paper" onClick={onClose}>
              {he.categories.cancel}
            </Button>
          </div>
        </div>
      }
    >
      <ul className={styles.grid}>
        <li className={styles.customCell}>
          <button
            type="button"
            className={[styles.tile, styles.customTile].join(' ')}
            data-tone={CUSTOM_CATEGORY.tone}
            data-selected={customSelected ? 'true' : 'false'}
            aria-pressed={customSelected}
            aria-disabled={!customAvailable}
            onClick={() => {
              if (customAvailable) toggle('custom');
            }}
          >
            <span className={styles.check} aria-hidden="true">
              {customSelected ? <CheckIcon size={15} strokeWidth={3.2} /> : null}
            </span>
            <span className={styles.badge}>
              <CategoryIcon id="custom" size={30} />
            </span>
            <span className={styles.customText}>
              <span className={styles.label}>{CUSTOM_CATEGORY.label}</span>
              <span className={styles.subLabel}>
                {customAvailable ? he.counts.words(customWordCount) : he.custom.tileEmpty}
              </span>
            </span>
          </button>
        </li>
        {CATEGORIES.map((category) => {
          const selected = draft.has(category.id);
          return (
            <li key={category.id}>
              <button
                type="button"
                className={styles.tile}
                data-tone={category.tone}
                data-selected={selected ? 'true' : 'false'}
                aria-pressed={selected}
                onClick={() => toggle(category.id)}
              >
                <span className={styles.check} aria-hidden="true">
                  {selected ? <CheckIcon size={15} strokeWidth={3.2} /> : null}
                </span>
                <span className={styles.badge}>
                  <CategoryIcon id={category.id} size={30} />
                </span>
                <span className={styles.label}>{category.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}
