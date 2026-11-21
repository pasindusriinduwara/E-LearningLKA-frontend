"use client";

import { useState, type ComponentProps } from "react";
import { downloadAssessmentFile, getLocalAssessmentFileUrl } from "@/lib/api";
import { getSafeResourceUrl } from "@/lib/videoUtils";

/** Download local attachments through the authenticated same-origin API proxy. */
export function AttachmentLink({ href, children, ...props }: ComponentProps<"a"> & { href: string }) {
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const safeHref = getSafeResourceUrl(href);
  return (
    <>
      <a {...props} href={safeHref || undefined} rel="noopener noreferrer" aria-disabled={!safeHref || downloading} aria-busy={downloading} onClick={async (event) => {
        if (!safeHref) {
          event.preventDefault();
          setError("This attachment link is invalid or unsafe.");
          return;
        }
        const url = getLocalAssessmentFileUrl(safeHref);
        if (!url) return;
        event.preventDefault();
        if (downloading) return;
        setDownloading(true);
        setError(null);
        try {
          await downloadAssessmentFile(url);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Could not download attachment");
        } finally {
          setDownloading(false);
        }
      }}>{children}</a>
      {error && <span role="alert" className="text-xs text-rose-600">{error}</span>}
    </>
  );
}
