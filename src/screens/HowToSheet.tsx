import { Button } from '../components/ui/Button';
import { CheckIcon } from '../components/ui/Icons';
import { Sheet } from '../components/ui/Sheet';
import { he } from '../copy/he';
import styles from './HowToSheet.module.css';

export interface HowToSheetProps {
  open: boolean;
  onClose: () => void;
}

/** Three-step explanation of the game, shown as a bottom sheet from the setup screen. */
export function HowToSheet({ open, onClose }: HowToSheetProps) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={he.howTo.title}
      footer={
        <Button variant="primary" size="lg" block icon={<CheckIcon />} onClick={onClose} data-autofocus>
          {he.howTo.done}
        </Button>
      }
    >
      <ol className={styles.steps}>
        {he.howTo.steps.map((step, index) => (
          <li key={step.title} className={styles.step}>
            <span className={styles.badge} data-step={index + 1} aria-hidden="true">
              {index + 1}
            </span>
            <div className={styles.text}>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepBody}>{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </Sheet>
  );
}
