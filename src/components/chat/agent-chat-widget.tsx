"use client";

import { useState, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { AgentChat, createAgentChat } from "@21st-sdk/react";
import "@21st-sdk/react/styles.css";

const AGENT_SLUG = "viking-market";

export function AgentChatWidget() {
  const [open, setOpen] = useState(false);

  const chat = useMemo(
    () =>
      createAgentChat({
        agent: AGENT_SLUG,
        tokenUrl: "/api/an-token",
      }),
    []
  );

  const { messages, sendMessage, status, stop, error } = useChat({ chat });

  return (
    <>
      {/* Floating trigger button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close chat" : "Open chat"}
        className="fixed bottom-5 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-viking)] text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-20 right-5 z-50 flex h-[500px] w-[380px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm font-semibold">Viking Market AI</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <AgentChat
              messages={messages}
              onSend={(message) =>
                sendMessage({
                  role: "user",
                  parts: [{ type: "text", text: message.content }],
                })
              }
              status={status}
              onStop={stop}
              error={error ?? undefined}
              theme={{
                theme: {
                  "--an-font-family": "var(--font-sans), ui-sans-serif, system-ui, sans-serif",
                },
                light: {
                  "--an-bg": "#ffffff",
                  "--an-fg": "#0a0a0a",
                  "--an-border": "#e5e5e5",
                  "--an-input-bg": "#f5f5f5",
                  "--an-accent": "#c8102e",
                  "--an-accent-fg": "#ffffff",
                },
                dark: {
                  "--an-bg": "#111113",
                  "--an-fg": "#fafafa",
                  "--an-border": "#1e1e22",
                  "--an-input-bg": "#1a1a1e",
                  "--an-accent": "#e63946",
                  "--an-accent-fg": "#ffffff",
                },
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
