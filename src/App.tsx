import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { ConfirmDialog } from './components/ui/ConfirmDialog';
import { Toast } from './components/ui/Toast';
import { he } from './copy/he';
import type { CategoryId } from './data/types';
import { ARM_DELAY_MS, INITIAL_DEAL_STATE, dealReducer } from './game/dealReducer';
import { newId } from './game/ids';
import { checkCanStart, clampImpostorCount } from './game/rules';
import { createRound } from './game/round';
import { setupReducer } from './game/setupReducer';
import { EMPTY_WORD_SESSION, type WordSession } from './game/words';
import { useBackGuard } from './hooks/useBackGuard';
import { useConcealOnHide } from './hooks/useConcealOnHide';
import { useToast } from './hooks/useToast';
import { CategoriesSheet } from './screens/CategoriesSheet';
import { DealFlow } from './screens/DealFlow';
import { HowToSheet } from './screens/HowToSheet';
import { PlayersSheet } from './screens/PlayersSheet';
import { SetupScreen } from './screens/SetupScreen';
import { getSafeStorage, loadSetup, saveSetup, type StorageLike } from './storage/setupStorage';

type SheetName = 'none' | 'players' | 'categories' | 'howTo';

export function App() {
  const storageRef = useRef<StorageLike | null | undefined>(undefined);
  if (storageRef.current === undefined) storageRef.current = getSafeStorage();
  const storage = storageRef.current;

  const [setup, dispatchSetup] = useReducer(setupReducer, storage, loadSetup);
  const [deal, dispatchDeal] = useReducer(dealReducer, INITIAL_DEAL_STATE);
  const wordSession = useRef<WordSession>(EMPTY_WORD_SESSION);
  const [sheet, setSheet] = useState<SheetName>('none');
  const [exitOpen, setExitOpen] = useState(false);
  const [toast, showToast] = useToast();

  // Only the roster and preferences persist. Rounds live in memory alone.
  useEffect(() => {
    saveSetup(setup, storage);
  }, [setup, storage]);

  const startCheck = checkCanStart(setup);

  const startRound = useCallback(() => {
    if (!checkCanStart(setup).ok) return;
    const created = createRound(setup, wordSession.current);
    wordSession.current = created.session;
    dispatchDeal({ type: 'START_ROUND', round: created.round });
  }, [setup]);

  // A freshly shown handoff or reveal screen ignores its primary tap briefly.
  useEffect(() => {
    if ((deal.status === 'handoff' || deal.status === 'revealed') && !deal.armed) {
      const timer = window.setTimeout(() => dispatchDeal({ type: 'ARM' }), ARM_DELAY_MS);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [deal]);

  const conceal = useCallback(() => dispatchDeal({ type: 'CONCEAL' }), []);
  useConcealOnHide(deal.status === 'revealed', conceal);

  const dealStatus = deal.status;
  const onBack = useCallback(() => {
    if (dealStatus === 'complete') {
      dispatchDeal({ type: 'BACK_TO_SETUP' });
      return;
    }
    dispatchDeal({ type: 'CONCEAL' });
    setExitOpen(true);
  }, [dealStatus]);
  useBackGuard(deal.status !== 'setup', onBack);

  const requestExit = () => {
    dispatchDeal({ type: 'CONCEAL' });
    setExitOpen(true);
  };

  const confirmExit = () => {
    setExitOpen(false);
    dispatchDeal({ type: 'ABANDON' });
  };

  const addPlayer = (name: string) => dispatchSetup({ type: 'ADD_PLAYER', player: { id: newId('player'), name } });
  const renamePlayer = (id: string, name: string) => dispatchSetup({ type: 'RENAME_PLAYER', id, name });
  const removePlayer = (id: string) => {
    const remaining = setup.players.length - 1;
    const nextCount = clampImpostorCount(setup.impostorCount, remaining);
    if (nextCount < setup.impostorCount) showToast(he.setup.impostorsClamped(nextCount));
    dispatchSetup({ type: 'REMOVE_PLAYER', id });
  };
  const setCategories = (categoryIds: CategoryId[]) => {
    dispatchSetup({ type: 'SET_CATEGORIES', categoryIds });
    setSheet('none');
  };

  return (
    <>
      {deal.status === 'setup' ? (
        <>
          <SetupScreen
            setup={setup}
            startCheck={startCheck}
            storageAvailable={storage !== null}
            onOpenPlayers={() => setSheet('players')}
            onOpenCategories={() => setSheet('categories')}
            onOpenHowTo={() => setSheet('howTo')}
            onImpostorCountChange={(count) => dispatchSetup({ type: 'SET_IMPOSTOR_COUNT', count })}
            onStart={startRound}
          />
          <HowToSheet open={sheet === 'howTo'} onClose={() => setSheet('none')} />
          <PlayersSheet
            open={sheet === 'players'}
            onClose={() => setSheet('none')}
            players={setup.players}
            onAdd={addPlayer}
            onRename={renamePlayer}
            onRemove={removePlayer}
          />
          <CategoriesSheet
            open={sheet === 'categories'}
            onClose={() => setSheet('none')}
            selectedIds={setup.categoryIds}
            onConfirm={setCategories}
          />
        </>
      ) : (
        <>
          <DealFlow
            state={deal}
            dispatch={dispatchDeal}
            onExitRequest={requestExit}
            onNewRound={startRound}
            onBackToSetup={() => dispatchDeal({ type: 'BACK_TO_SETUP' })}
          />
          <ConfirmDialog
            open={exitOpen}
            title={he.deal.exitTitle}
            body={he.deal.exitBody}
            confirmLabel={he.deal.exitConfirm}
            cancelLabel={he.deal.exitCancel}
            onConfirm={confirmExit}
            onCancel={() => setExitOpen(false)}
          />
        </>
      )}
      <Toast message={toast} />
    </>
  );
}
