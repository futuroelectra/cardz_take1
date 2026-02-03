"use client";

import { useState, useEffect, useRef, useCallback } from "react";

/** Creative Summary from Collector (used when type is "confirmation"). */
export type CreativeSummary = {
  occasion: string;
  receiverPersonality: string;
  emotionalVibe: string;
  subjectIdea: string;
  subjectType: "avatar" | "inanimate";
  subjectSource: "upload" | "text" | null;
  interactionIdeas: string[];
  welcomeMessage: string;
};

export type Message = {
  id: string;
  text: string;
  sender: "user" | "ai";
  type?: "confirmation" | "export";
  /** Set when type is "confirmation" and Collector returned a Creative Summary. */
  creativeSummary?: CreativeSummary;
  timestamp: Date;
};

export function useChatLogic(onPopTrigger?: () => void) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hey I'm the creative assistant! How can I help you today?",
      sender: "ai",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const sendToCollector = useCallback(
    async (apiMessages: { role: "user" | "assistant"; content: string }[]) => {
      const res = await fetch("/api/chat/collector", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });
      const data = await res.json().catch(() => ({}));
      return data as { message?: string; creativeSummary?: CreativeSummary };
    },
    []
  );

  const sendMessage = useCallback(() => {
    const trimmedValue = inputValue.trim();
    if (!trimmedValue) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: trimmedValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = "49px";
    }

    const trimmedLower = trimmedValue.toLowerCase().trim();
    if (trimmedLower === "pop") {
      onPopTrigger?.();
      return;
    }

    setIsLoading(true);
    const conversationSoFar = [...messages, userMessage]
      .filter((m) => m.type !== "confirmation" && m.type !== "export")
      .map((m) => ({
        role: m.sender as "user" | "assistant",
        content: m.text,
      }));

    sendToCollector(conversationSoFar)
      .then(({ message, creativeSummary }) => {
        const assistantText = message ?? "I didn't get a response. Try again.";
        const aiMessage: Message = {
          id: `ai-${Date.now()}`,
          text: assistantText,
          sender: "ai",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
        if (creativeSummary) {
          const confirmationMessage: Message = {
            id: `confirmation-${Date.now()}`,
            text: "Here's your dream-card summary. Approve to create your card and open the editor.",
            sender: "ai",
            type: "confirmation",
            creativeSummary,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, confirmationMessage]);
        }
      })
      .catch(() => {
        const errorMessage: Message = {
          id: `ai-${Date.now()}`,
          text: "Something went wrong. Please try again.",
          sender: "ai",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      })
      .finally(() => setIsLoading(false));
  }, [inputValue, messages, onPopTrigger, sendToCollector]);

  // Handle Enter key (Shift+Enter for new line, Enter to send)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  // Auto-resize textarea
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInputValue(e.target.value);
      // Auto-resize
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        const scrollHeight = textareaRef.current.scrollHeight;
        const maxHeight = 200; // 200px max height
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
    isLoading,
  };
}
