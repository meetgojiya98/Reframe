"use client";

import { useEffect } from "react";

/**
 * Catches errors in the root layout. Renders a minimal fallback (no dependency on other app components).
 */
export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "2rem", background: "#fdfcfb", color: "#1c1917" }}>
        <div style={{ maxWidth: "28rem", margin: "0 auto", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.5rem" }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#78716c", marginBottom: "1.5rem" }}>
            We hit an unexpected error. Please try again.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              padding: "0.5rem 1rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              background: "#2d8a6e",
              color: "#fff",
              border: "none",
              borderRadius: "0.5rem",
              cursor: "pointer"
            }}
          >
            Try again
          </button>
          <p style={{ marginTop: "1.5rem" }}>
            <a href="/" style={{ fontSize: "0.875rem", color: "#2d8a6e" }}>
              Go to home
            </a>
          </p>
        </div>
      </body>
    </html>
  );
}
