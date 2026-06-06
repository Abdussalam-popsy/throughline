import { useCallback, useEffect, useState } from "react";
import { addEntry, getEntries } from "../services/storage";
import type { Entry } from "../lib/types";

export function useEntries() {
  const [entries, setEntries] = useState<Entry[]>([]);

  const reload = useCallback(() => setEntries(getEntries()), []);

  useEffect(() => {
    reload();
  }, [reload]);

  const add = useCallback(
    (e: Entry) => {
      addEntry(e);
      reload();
    },
    [reload]
  );

  return { entries, add, reload };
}
