"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export type Message = {
  id: string;
  text: string;
  sender: "user" | "ai";
  type?: "confirmation" | "export";
  timestamp: Date;
};

export type UseChatLogicApiOptions = {
  mode: "collector" | "editor";
  sessionId: string;
  buildId?: string;
  /** When in collector mode, use this as the first AI message (e.g. from GET /api/chat/welcome). */
  initialWelcome?: string | null;
};

const COLLECTOR_FALLBACK_MESSAGE = "Welcome to Cardzzz ✦";

function chatMessageToMessage(m: { id: string; text: string; sender: "user" | "ai"; type?: "confirmation" | "export"; timestamp: string }): Message {
  return {
    id: m.id,
    text: m.text,
    sender: m.sender,
    type: m.type,
    timestamp: new Date(m.timestamp),
  };
}

export function useChatLogic(
  onPopTrigger?: () => void,
  apiOptions?: UseChatLogicApiOptions
) {
  const [messages, setMessages] = useState<Message[]>(() => {
    if (apiOptions?.mode === "editor") {
      return [
        {
          id: "1",
          text: "You've arrived at your digital experience. The receiver is the ultimate guide—what would you like to tweak?",
          sender: "ai" as const,
          timestamp: new Date(),
        },
      ];
    }
    if (apiOptions?.mode === "collector" && apiOptions?.initialWelcome) {
      return [
        {
          id: "1",
          text: apiOptions.initialWelcome,
          sender: "ai" as const,
          timestamp: new Date(),
        },
      ];
    }
    return [
      {
        id: "1",
        text: COLLECTOR_FALLBACK_MESSAGE,
        sender: "ai" as const,
        timestamp: new Date(),
      },
    ];
  });
  const [inputValue, setInputValue] = useState("");
  const [sending, setSending] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const welcomeAppliedRef = useRef(false);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (
      apiOptions?.mode === "collector" &&
      apiOptions?.initialWelcome &&
      !welcomeAppliedRef.current
    ) {
      welcomeAppliedRef.current = true;
      setMessages([
        {
          id: "1",
          text: apiOptions.initialWelcome,
          sender: "ai",
          timestamp: new Date(),
        },
      ]);
    }
  }, [apiOptions?.mode, apiOptions?.initialWelcome]);

  const sendMockResponse = useCallback((userMessageText: string) => {
    const trimmedText = userMessageText.toLowerCase().trim();
    if (trimmedText === "pop") {
      onPopTrigger?.();
      return;
    }
    setTimeout(() => {
      if (trimmedText.includes("confirmation")) {
        setMessages((prev) => [
          ...prev,
          {
            id: `confirmation-${Date.now()}`,
            text: "Here's a creative summary of our conversation. Would you like to proceed?",
            sender: "ai",
            type: "confirmation",
            timestamp: new Date(),
          },
        ]);
      } else if (trimmedText.includes("export")) {
        setMessages((prev) => [
          ...prev,
          {
            id: `export-${Date.now()}`,
            text: "Please confirm details below and hit export when ready",
            sender: "ai",
            type: "export",
            timestamp: new Date(),
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            text: "I received your message!",
            sender: "ai",
            timestamp: new Date(),
          },
        ]);
      }
    }, 500);
  }, [onPopTrigger]);

  const sendMessage = useCallback(async () => {
    const trimmedValue = inputValue.trim();
    if (!trimmedValue || sending) return;

    setInputValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = "49px";
    }

    if (apiOptions?.sessionId) {
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        text: trimmedValue,
        sender: "user",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setSending(true);
      try {
        if (apiOptions.mode === "collector") {
          const res = await fetch("/api/chat/send", {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-Stream": "true" },
            body: JSON.stringify({
              sessionId: apiOptions.sessionId,
              text: trimmedValue,
            }),
          });
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            setMessages((prev) => [
              ...prev,
              {
                id: `ai-${Date.now()}`,
                text: typeof data?.error === "string" ? data.error : "Something went wrong. Please try again.",
                sender: "ai",
                timestamp: new Date(),
              },
            ]);
          } else if (res.headers.get("content-type")?.includes("ndjson")) {
            const reader = res.body?.getReader();
            if (!reader) {
              setMessages((prev) => [
                ...prev,
                { id: `ai-${Date.now()}`, text: "Something went wrong.", sender: "ai", timestamp: new Date() },
              ]);
              return;
            }
            const decoder = new TextDecoder();
            let buffer = "";
            const aiId = `ai-${Date.now()}`;
            setMessages((prev) => [
              ...prev,
              { id: aiId, text: "", sender: "ai" as const, timestamp: new Date() },
            ]);
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() ?? "";
                for (const line of lines) {
                  if (!line.trim()) continue;
                  try {
                    const obj = JSON.parse(line) as { t: string; v?: string; messageId?: string; showConfirmation?: boolean; finalText?: string | null; message?: string };
                    if (obj.t === "chunk" && typeof obj.v === "string") {
                      setMessages((prev) => {
                        const last = prev[prev.length - 1];
                        if (last?.sender !== "ai") return prev;
                        return [...prev.slice(0, -1), { ...last, text: last.text + obj.v }];
                      });
                    } else if (obj.t === "done") {
                      setMessages((prev) => {
                        const last = prev[prev.length - 1];
                        if (last?.sender !== "ai") return prev;
                        return [
                          ...prev.slice(0, -1),
                          {
                            ...last,
                            id: obj.messageId ?? last.id,
                            text: obj.finalText ?? last.text,
                            type: obj.showConfirmation ? "confirmation" : undefined,
                          },
                        ];
                      });
                    } else if (obj.t === "error") {
                      setMessages((prev) => {
                        const last = prev[prev.length - 1];
                        if (last?.sender !== "ai") return prev;
                        return [...prev.slice(0, -1), { ...last, text: obj.message ?? "Something went wrong." }];
                      });
                    }
                  } catch {
                    // skip malformed line
                  }
                }
              }
            } finally {
              reader.releaseLock();
            }
          } else {
            const data = await res.json();
            if (data.popTrigger) onPopTrigger?.();
            else if (data.messages?.length) {
              const aiOnly = data.messages
                .map(chatMessageToMessage)
                .filter((m: Message) => m.sender === "ai");
              if (aiOnly.length) setMessages((prev) => [...prev, ...aiOnly]);
            }
          }
        } else if (apiOptions.mode === "editor" && apiOptions.buildId) {
          const recentMessages = messages.slice(-10).map((m) => ({
            id: m.id,
            text: m.text,
            sender: m.sender,
            type: m.type,
            timestamp:
              m.timestamp instanceof Date
                ? m.timestamp.toISOString()
                : new Date().toISOString(),
          }));
          const res = await fetch("/api/editor/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              buildId: apiOptions.buildId,
              sessionId: apiOptions.sessionId,
              text: trimmedValue,
              recentMessages,
            }),
          });
          const data = await res.json();
          if (data.limitReached) setLimitReached(true);
          if (data.popTrigger) onPopTrigger?.();
          if (data.messages?.length) {
            const aiOnly = data.messages
              .map(chatMessageToMessage)
              .filter((m: Message) => m.sender === "ai");
            if (aiOnly.length) setMessages((prev) => [...prev, ...aiOnly]);
          }
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            text: "Something went wrong. Please try again.",
            sender: "ai",
            timestamp: new Date(),
          },
        ]);
      } finally {
        setSending(false);
      }
    } else {
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        text: trimmedValue,
        sender: "user",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      sendMockResponse(trimmedValue);
    }
  }, [inputValue, sending, apiOptions, onPopTrigger, sendMockResponse]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInputValue(e.target.value);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        const scrollHeight = textareaRef.current.scrollHeight;
        const maxHeight = 200;
        textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
      }
    },
    []
  );

  return {
    messages,
    inputValue,
    setInputValue,
    sendMessage,
    handleKeyDown,
    handleInputChange,
    scrollContainerRef,
    textareaRef,
    sending,
    limitReached,
  };
}
