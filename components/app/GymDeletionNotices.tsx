"use client";

import { useEffect, useState } from "react";
import { Buildings } from "@phosphor-icons/react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { dismissGymDeletionNotice, getGymDeletionNotices, type GymDeletionNotice } from "@/lib/api";
import { t, tf, type Language } from "@/lib/i18n";

export function GymDeletionNotices({ language }: { language: Language }) {
  const [notices, setNotices] = useState<GymDeletionNotice[]>([]);
  const [dismissing, setDismissing] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    getGymDeletionNotices(controller.signal)
      .then((items) => { if (!controller.signal.aborted) setNotices(items); })
      .catch(() => {
        // An unavailable notice endpoint does not block the athlete shell.
      });
    return () => controller.abort();
  }, []);

  async function dismiss(id: string) {
    setDismissing(id);
    setFailed(null);
    try {
      await dismissGymDeletionNotice(id);
      setNotices((current) => current.filter((notice) => notice.id !== id));
    } catch {
      setFailed(id);
    } finally {
      setDismissing(null);
    }
  }

  if (!notices.length) return null;
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 pt-4 sm:px-8" aria-live="polite">
      {notices.map((notice) => (
        <Card key={notice.id} tone="rosa-claro" className="flex items-start gap-3">
          <Buildings size={22} weight="bold" aria-hidden="true" className="mt-1 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="break-words font-bold">{tf(language, "gym.deletedNotice", { gym: notice.gym_name })}</p>
            {failed === notice.id && <p role="alert" className="text-small text-peligro">{t(language, "error.conexion")}</p>}
          </div>
          <Button type="button" variant="secundario" size="sm" loading={dismissing === notice.id}
            disabled={dismissing !== null} onClick={() => void dismiss(notice.id)}>
            {t(language, failed === notice.id ? "comun.reintentar" : "comun.cerrar")}
          </Button>
        </Card>
      ))}
    </div>
  );
}

