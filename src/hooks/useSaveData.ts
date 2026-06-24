import { useCallback, useEffect, useState } from 'react';
import type { SaveData } from '../types/save';
import { loadSave, resetSave, writeSave } from '../utils/localStorage';

// Loads the save once on mount and persists any changes back to LocalStorage.
export function useSaveData() {
  const [save, setSave] = useState<SaveData>(() => loadSave());

  // Persist whenever the save changes.
  useEffect(() => {
    writeSave(save);
  }, [save]);

  // Shallow-merge a partial update into the save.
  const updateSave = useCallback((patch: Partial<SaveData>) => {
    setSave((prev) => ({ ...prev, ...patch }));
  }, []);

  const reset = useCallback(() => {
    setSave(resetSave());
  }, []);

  return { save, setSave, updateSave, reset };
}
