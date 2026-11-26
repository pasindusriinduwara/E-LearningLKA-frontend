"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";

const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useSidebarDrawer(mobileQuery: string) {
  const pathname = usePathname();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const returnFocusFrame = useRef<number | null>(null);
  const close = useCallback(() => setOpenPath(null), []);

  const subscribe = useCallback((onChange: () => void) => {
    const media = window.matchMedia(mobileQuery);
    function handleChange() {
      if (!media.matches) close();
      onChange();
    }
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [mobileQuery, close]);
  const getSnapshot = useCallback(() => window.matchMedia(mobileQuery).matches, [mobileQuery]);
  const isMobile = useSyncExternalStore(subscribe, getSnapshot, () => false);
  // Discard the previous opening so browser history cannot reopen it later.
  if (openPath !== null && openPath !== pathname) setOpenPath(null);
  const isOpen = isMobile && openPath === pathname;
  const open = useCallback(() => setOpenPath(pathname), [pathname]);

  useEffect(() => {
    if (!isOpen) return;
    if (returnFocusFrame.current !== null) cancelAnimationFrame(returnFocusFrame.current);
    const sidebar = sidebarRef.current;
    const trigger = triggerRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Let the browser apply visibility and remove inertness before focusing.
    const openingFrame = requestAnimationFrame(() => closeButtonRef.current?.focus({ preventScroll: true }));

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        close();
        return;
      }
      if (event.key !== "Tab" || !sidebar) return;
      const controls = Array.from(sidebar.querySelectorAll<HTMLElement>(focusableSelector))
        .filter((control) => control.getClientRects().length > 0 && !control.closest("[inert]"));
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (!first || !last) { event.preventDefault(); return; }
      if (!sidebar.contains(document.activeElement)) {
        event.preventDefault(); first.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      cancelAnimationFrame(openingFrame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      // Wait until React removes background inertness before restoring focus.
      returnFocusFrame.current = requestAnimationFrame(() => {
        if (trigger?.isConnected && trigger.getClientRects().length > 0) trigger.focus({ preventScroll: true });
      });
    };
  }, [isOpen, close]);

  return { isOpen, isMobile, open, close, sidebarRef, triggerRef, closeButtonRef };
}
