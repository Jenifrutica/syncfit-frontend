"use client";

import { useEffect, type RefObject } from "react";

/**
 * Scroll choreography for the landing, with GSAP + ScrollTrigger loaded lazily
 * so the app never pays for it. Hooks into data attributes:
 * - [data-entra]   hero pieces that rise in on load, in DOM order
 * - [data-nube]    decorative clouds that drift with scroll (value = speed)
 * - [data-revela]  blocks that rise in when they enter the viewport
 * - [data-ruta]    the "two AIs" track: [data-ruta-relleno] fills and
 *                  [data-ruta-viajera] (Pulsi) travels as you scroll; stations
 *                  not reached yet get [data-espera]
 * With prefers-reduced-motion nothing moves and everything stays visible.
 */
export function useLandingMotion(root: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const scope = root.current;
    if (!scope) return;
    let revert: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);

      const mm = gsap.matchMedia(scope);
      // Entrances and parallax: once, regardless of width.
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-entra]", { y: 32, opacity: 0, duration: 0.7, ease: "power3.out", stagger: 0.09 });

        gsap.utils.toArray<HTMLElement>("[data-nube]").forEach((nube) => {
          const speed = Number(nube.dataset.nube) || 1;
          gsap.to(nube, { yPercent: -40 * speed, ease: "none", scrollTrigger: { trigger: nube, start: "top bottom", end: "bottom top", scrub: true } });
        });

        gsap.utils.toArray<HTMLElement>("[data-revela]").forEach((el) => {
          gsap.from(el, { y: 40, opacity: 0, duration: 0.6, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 85%", once: true } });
        });
      });

      // The track switches axis at the desktop breakpoint, so it rebuilds there.
      mm.add(
        { motion: "(prefers-reduced-motion: no-preference)", ancho: "(min-width: 1024px)" },
        (context) => {
          const { motion, ancho } = context.conditions as { motion: boolean; ancho: boolean };
          if (!motion) return;

          const ruta = scope.querySelector<HTMLElement>("[data-ruta]");
          const relleno = ruta?.querySelector<HTMLElement>("[data-ruta-relleno]");
          const viajera = ruta?.querySelector<HTMLElement>("[data-ruta-viajera]");
          if (ruta && relleno && viajera) {
            const scrub = { trigger: ruta, start: "top 70%", end: "bottom 55%", scrub: 0.6 };
            if (ancho) {
              gsap.fromTo(relleno, { scaleX: 0 }, { scaleX: 1, ease: "none", scrollTrigger: scrub });
              gsap.fromTo(viajera, { x: 0 }, { x: () => ruta.offsetWidth - viajera.offsetWidth, ease: "none", scrollTrigger: { ...scrub, invalidateOnRefresh: true } });
            } else {
              gsap.fromTo(relleno, { scaleY: 0 }, { scaleY: 1, ease: "none", scrollTrigger: scrub });
              gsap.fromTo(viajera, { y: 0 }, { y: () => ruta.offsetHeight - viajera.offsetHeight, ease: "none", scrollTrigger: { ...scrub, invalidateOnRefresh: true } });
            }
            const estaciones = gsap.utils.toArray<HTMLElement>("[data-estacion]", ruta);
            const marca = (progress: number) =>
              estaciones.forEach((estacion, i) => estacion.toggleAttribute("data-espera", i / Math.max(estaciones.length - 1, 1) > progress + 0.02));
            marca(0);
            ScrollTrigger.create({ ...scrub, onUpdate: (self) => marca(self.progress), onRefresh: (self) => marca(self.progress) });
            return () => estaciones.forEach((estacion) => estacion.removeAttribute("data-espera"));
          }
        },
      );
      revert = () => mm.revert();
    })();

    return () => {
      cancelled = true;
      revert?.();
    };
  }, [root]);
}
