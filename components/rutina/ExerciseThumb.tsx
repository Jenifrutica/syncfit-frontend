"use client";

import { Barbell } from "@phosphor-icons/react";

import { cx } from "@/lib/cx";
import { realImage } from "@/lib/routine";

/**
 * Exercise media: animation/video (media_url) > real image > an illustrated
 * tile. Catalog images are placeholders today, so the tile is the common case.
 */
export function ExerciseThumb({ name, imageUrl, mediaUrl, size = "sm", className }: { name: string; imageUrl?: string; mediaUrl?: string | null; size?: "sm" | "lg"; className?: string }) {
  const box = size === "sm" ? "size-16 shrink-0 rounded-ficha" : "aspect-[16/9] w-full rounded-nube";
  const image = realImage(imageUrl);

  if (mediaUrl && /\.(mp4|webm)(\?|$)/i.test(mediaUrl)) {
    return <video src={mediaUrl} muted loop playsInline autoPlay aria-label={name} className={cx(box, "bg-fase-suave object-cover motion-reduce:hidden", className)} />;
  }
  const src = mediaUrl ?? image;
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name} loading="lazy" width={size === "sm" ? 64 : 640} height={size === "sm" ? 64 : 360} className={cx(box, "bg-fase-suave object-cover", className)} />;
  }
  return (
    <div aria-hidden="true" className={cx(box, "grid place-items-center bg-fase-suave text-ink", className)}>
      <Barbell size={size === "sm" ? 28 : 64} weight="bold" />
    </div>
  );
}
