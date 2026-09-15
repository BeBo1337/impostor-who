import { useEffect, useState } from 'react';
import { CategoryIcon } from '../components/icons/CategoryIcon';
import { Button } from '../components/ui/Button';
import { CheckIcon } from '../components/ui/Icons';
import { Sheet } from '../components/ui/Sheet';
import { he } from '../copy/he';
import { CATEGORIES, CATEGORY_IDS } from '../data/categories';
import type { CategoryId } from '../data/types';
import styles from './CategoriesSheet.module.css';

export interface CategoriesSheetProps {
  open: boolean;
  onClose: () => void;
  selectedIds: readonly CategoryId[];
  onConfirm: (ids: CategoryId[]) => void;
}

/**
 * Category picker. Changes are a draft until "אישור"; closing or cancelling
 * keeps the previous selection untouched.
 */
export function CategoriesSheet({ open, onClose, selectedIds, onConfirm }: CategoriesSheetProps) {
  const [draft, setDraft] = useState<ReadonlySet<CategoryId>>(() => new Set(selectedIds));

  useEffect(() => {
    if (open) setDraft(new Set(selectedIds));
  }, [open, selectedIds]);

  const toggle = (id: CategoryId) => {
    setDraft((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const confirm = () => {
    if (draft.size === 0) return;
    onConfirm(CATEGORY_IDS.filter((id) => draft.has(id)));
  };

  const count = draft.size;
  const total = CATEGORIES.length;

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
            <button
              type="button"
              className={styles.link}
              onClick={() => setDraft(new Set(CATEGORY_IDS))}
              disabled={count === total}
            >
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
