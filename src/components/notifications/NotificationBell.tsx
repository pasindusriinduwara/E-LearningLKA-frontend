"use client";

import { Bell, CheckCheck, ChevronRight, LoaderCircle, RefreshCw, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useEffectEvent, useId, useRef, useState } from "react";
import type { PortalNotification } from "@/lib/types/notification";
import { notificationService, safeNotificationLink } from "@/services/notificationService";
import styles from "./NotificationBell.module.css";

interface NotificationBellProps {
  enabled?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
}

export function NotificationBell({ enabled = true, open: controlledOpen, onOpenChange }: NotificationBellProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const [unreadCount, setUnreadCount] = useState<number | null>(null);
  const [items, setItems] = useState<PortalNotification[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [mutationError, setMutationError] = useState("");
  const [busy, setBusy] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);
  const mutationVersion = useRef(0);
  const mutationRunning = useRef(false);
  const countRequest = useRef<AbortController | null>(null);
  const listRequest = useRef<AbortController | null>(null);
  const failedPage = useRef(0);
  const panelId = useId();
  const pathname = usePathname();
  const router = useRouter();

  function changeOpen(next: boolean) {
    if (controlledOpen === undefined) setInternalOpen(next);
    onOpenChange?.(next);
  }

  const refreshCount = useCallback(async () => {
    if (!enabled || !mounted.current || countRequest.current || listRequest.current || mutationRunning.current || document.visibilityState === "hidden") return;
    const controller = new AbortController();
    countRequest.current = controller;
    const version = mutationVersion.current;
    try {
      const response = await notificationService.unreadCount(controller.signal);
      if (mounted.current && !controller.signal.aborted && version === mutationVersion.current) setUnreadCount(response.unreadCount);
    } catch {
      // The inbox exposes a retryable error; a background refresh must not interrupt the page.
    } finally {
      if (countRequest.current === controller) countRequest.current = null;
    }
  }, [enabled]);

  const loadPage = useCallback(async (nextPage = 0) => {
    if (!enabled || !mounted.current || mutationRunning.current) return;
    countRequest.current?.abort();
    countRequest.current = null;
    listRequest.current?.abort();
    const controller = new AbortController();
    listRequest.current = controller;
    const version = mutationVersion.current;
    failedPage.current = nextPage;
    setLoading(true);
    setError("");
    try {
      const response = await notificationService.list(nextPage, 20, controller.signal);
      if (!mounted.current || controller.signal.aborted || version !== mutationVersion.current) return;
      setItems((previous) => nextPage === 0 ? response.items : [...previous, ...response.items.filter((item) => !previous.some((current) => current.id === item.id))]);
      setPage(response.page);
      setTotalPages(response.totalPages);
      setUnreadCount(response.unreadCount);
      setLoaded(true);
    } catch {
      if (mounted.current && !controller.signal.aborted) setError("Could not load notifications. Please try again.");
    } finally {
      if (listRequest.current === controller) {
        listRequest.current = null;
        if (mounted.current) setLoading(false);
      }
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    mounted.current = true;
    const refresh = () => { void refreshCount(); };
    const refreshVisible = () => { if (document.visibilityState !== "hidden") refresh(); };
    refresh();
    const interval = window.setInterval(refresh, 60_000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refreshVisible);
    return () => {
      mounted.current = false;
      countRequest.current?.abort();
      listRequest.current?.abort();
      countRequest.current = null;
      listRequest.current = null;
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refreshVisible);
    };
  }, [enabled, refreshCount]);

  const closeForNavigation = useEffectEvent(() => changeOpen(false));
  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => { if (active) closeForNavigation(); });
    return () => { active = false; };
  }, [pathname]);

  useEffect(() => {
    if (!open || !enabled) return;
    let active = true;
    void Promise.resolve().then(() => { if (active) void loadPage(); });
    panelRef.current?.focus();
    const closeOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) closeForNavigation();
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeForNavigation();
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      active = false;
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, enabled, loadPage]);

  async function markRead(item: PortalNotification) {
    if (mutationRunning.current) return;
    const link = safeNotificationLink(item.link);
    if (!item.read) {
      mutationRunning.current = true;
      mutationVersion.current++;
      countRequest.current?.abort();
      listRequest.current?.abort();
      countRequest.current = null;
      listRequest.current = null;
      setBusy(true);
      setMutationError("");
      try {
        const updated = await notificationService.markRead(item.id);
        if (!mounted.current) return;
        setItems((previous) => previous.map((current) => current.id === item.id ? updated : current));
        setUnreadCount((count) => count === null ? null : Math.max(0, count - 1));
      } catch {
        if (mounted.current) setMutationError("Could not mark this notification as read. Please try again.");
        return;
      } finally {
        mutationRunning.current = false;
        if (mounted.current) {
          setBusy(false);
          setLoading(false);
          void refreshCount();
        }
      }
    }
    if (mounted.current && link) {
      changeOpen(false);
      router.push(link);
    }
  }

  async function markAllRead() {
    if (mutationRunning.current) return;
    mutationRunning.current = true;
    mutationVersion.current++;
    countRequest.current?.abort();
    listRequest.current?.abort();
    countRequest.current = null;
    listRequest.current = null;
    setBusy(true);
    setMutationError("");
    try {
      const response = await notificationService.markAllRead();
      if (!mounted.current) return;
      setItems((previous) => previous.map((item) => ({ ...item, read: true })));
      setUnreadCount(response.unreadCount);
    } catch {
      if (mounted.current) setMutationError("Could not mark all notifications as read. Please try again.");
    } finally {
      mutationRunning.current = false;
      if (mounted.current) {
        setBusy(false);
        setLoading(false);
        void refreshCount();
      }
    }
  }

  return (
    <div ref={rootRef} className={styles.root} onBlur={(event) => {
      if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget as Node)) changeOpen(false);
    }}>
      <button ref={buttonRef} type="button" className={`${styles.trigger} ${open ? styles.active : ""}`}
        disabled={!enabled} aria-label={`Notifications${unreadCount !== null ? `, ${unreadCount} unread` : ""}`}
        aria-haspopup="dialog" aria-expanded={open && enabled} aria-controls={open ? panelId : undefined}
        title="Notifications" onClick={() => changeOpen(!open)}>
        <Bell size={19} aria-hidden="true" />
        {unreadCount !== null && unreadCount > 0 && <span className={styles.badge} aria-hidden="true">{unreadCount > 99 ? "99+" : unreadCount}</span>}
      </button>
      {open && enabled && (
        <div ref={panelRef} id={panelId} role="dialog" aria-label="Notifications" tabIndex={-1} className={styles.panel}>
          <div className={styles.heading}>
            <div><strong>Notifications</strong><p aria-live="polite">{unreadCount === null ? "Your latest updates" : `${unreadCount} unread ${unreadCount === 1 ? "update" : "updates"}`}</p></div>
            <button className={styles.iconButton} type="button" title="Close notifications" aria-label="Close notifications" onClick={() => { changeOpen(false); buttonRef.current?.focus(); }}><X size={17} /></button>
          </div>
          <div className={styles.toolbar}>
            <button type="button" disabled={busy || loading || !unreadCount} onClick={() => void markAllRead()}><CheckCheck size={15} />{busy ? "Updating…" : "Mark all as read"}</button>
            <button type="button" disabled={busy || loading} onClick={() => void loadPage()} aria-label="Refresh notifications" title="Refresh notifications"><RefreshCw size={15} /></button>
          </div>
          {mutationError && <p className={styles.error} role="alert">{mutationError}</p>}
          <div className={styles.list} aria-busy={loading || busy || !loaded}>
            {items.length > 0 && <ul>{items.map((item) => (
              <li key={item.id}>
                <button type="button" disabled={busy || loading} className={`${styles.item} ${item.read ? "" : styles.unread}`} onClick={() => void markRead(item)} aria-label={`${item.read ? "" : "Unread: "}${item.title}`}>
                  <span className={styles.itemIcon}><Bell size={16} aria-hidden="true" /></span>
                  <span className={styles.content}><strong>{item.title}</strong><span>{item.message}</span><time dateTime={item.createdAt}>{formatDate(item.createdAt)}</time></span>
                  {safeNotificationLink(item.link) && <ChevronRight size={15} className={styles.chevron} aria-hidden="true" />}
                </button>
              </li>
            ))}</ul>}
            {(loading || (!loaded && !error)) && <p className={styles.state} role="status"><LoaderCircle size={17} className={styles.spinner} />Loading notifications…</p>}
            {error && <div className={styles.state} role="alert"><p>{error}</p><button type="button" onClick={() => void loadPage(failedPage.current)}>Try again</button></div>}
            {!loading && !error && loaded && items.length === 0 && <div className={styles.state}><Bell size={25} /><strong>You&apos;re all caught up</strong><p>New updates from your classes will appear here.</p></div>}
          </div>
          {!loading && !error && page + 1 < totalPages && <button className={styles.more} disabled={busy} type="button" onClick={() => void loadPage(page + 1)}>Load more notifications</button>}
        </div>
      )}
    </div>
  );
}
