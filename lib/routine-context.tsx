"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { todayISO } from "@/lib/dates";
import type { RoutineItem, RoutinePlan } from "@/lib/routine";

type RoutineValue = {
  plan: RoutinePlan | null;
  setPlan: (plan: RoutinePlan | null) => void;
  updateItem: (key: string, update: (item: RoutineItem) => RoutineItem) => void;
  removeItem: (key: string) => void;
};

const RoutineContext = createContext<RoutineValue | null>(null);
const STORAGE_KEY = "syncfit-rutina";

/**
 * Today's captured routine, shared by /app/rutina and /app/entreno.
 * Mirrored in sessionStorage so a reload mid-workout doesn't lose it;
 * a plan from another day is discarded.
 */
export function RoutineProvider({ children }: { children: ReactNode }) {
  const [plan, setPlanState] = useState<RoutinePlan | null>(null);

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      const stored = raw ? (JSON.parse(raw) as RoutinePlan) : null;
      if (stored?.date === todayISO()) setPlanState(stored);
    } catch {
      // Unreadable or blocked storage: start without a plan.
    }
  }, []);

  const setPlan = useCallback((next: RoutinePlan | null) => {
    setPlanState(next);
    try {
      if (next) window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      else window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Not persisted; the plan still lives in memory.
    }
  }, []);

  const updateItem = useCallback(
    (key: string, update: (item: RoutineItem) => RoutineItem) => {
      setPlanState((current) => {
        if (!current) return current;
        const map = (list: RoutineItem[]) => list.map((item) => (item.key === key ? update(item) : item));
        const next = { ...current, warmup: map(current.warmup), items: map(current.items) };
        try {
          window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    },
    [],
  );

  const removeItem = useCallback((key: string) => {
    setPlanState((current) => {
      if (!current) return current;
      const next = { ...current, warmup: current.warmup.filter((i) => i.key !== key), items: current.items.filter((i) => i.key !== key) };
      try {
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const value = useMemo(() => ({ plan, setPlan, updateItem, removeItem }), [plan, setPlan, updateItem, removeItem]);
  return <RoutineContext.Provider value={value}>{children}</RoutineContext.Provider>;
}

export function useRoutine(): RoutineValue {
  const value = useContext(RoutineContext);
  if (!value) throw new Error("useRoutine must be used inside <RoutineProvider>");
  return value;
}
