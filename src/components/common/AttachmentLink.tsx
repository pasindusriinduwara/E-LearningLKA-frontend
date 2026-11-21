"use client";

import { useState, type ComponentProps } from "react";
import { downloadAssessmentFile, getLocalAssessmentFileUrl } from "@/lib/api";

/** Local attachments need the API origin and the same bearer token as API requests. */
export function AttachmentLink({ href, children, ...props }: ComponentProps<"a"> & { href: string }) {
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  return (
    <>
      <a {...props} href={href} aria-busy={downloading} onClick={async (event) => {
        const url = getLocalAssessmentFileUrl(href);
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
