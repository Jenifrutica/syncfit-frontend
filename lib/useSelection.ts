"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * Row selection for a list panel. `visibleIds` are the ids currently shown
 * (after search/filters): "select all" acts on them, and ids that disappear
 * from the list are dropped from the selection automatically.
 */
export function useSelection(visibleIds: string[]) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const key = visibleIds.join("|");

  useEffect(() => {
    const visible = new Set(visibleIds);
    setSelected((current) => {
      const next = new Set([...current].filter((id) => visible.has(id)));
      return next.size === current.size ? current : next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const toggle = useCallback((id: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));

  return useMemo(
    () => ({
      selected,
      ids: [...selected],
      count: selected.size,
      has: (id: string) => selected.has(id),
      toggle,
      allSelected,
      selectAll: () => setSelected(new Set(visibleIds)),
      clear: () => setSelected(new Set()),
      toggleAll: () => setSelected(allSelected ? new Set() : new Set(visibleIds)),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selected, toggle, allSelected, key],
  );
}

export type Selection = ReturnType<typeof useSelection>;
