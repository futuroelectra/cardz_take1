"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export type Message = {
  id: string;
  text: string;
  sender: "user" | "ai";
  type?: "confirmation";
  timestamp: Date;
};

export function useChatLogic() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hey I'm the creative assistant! How can I help you today?",
      sender: "ai",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Mock response function
  const sendMockResponse = useCallback((userMessageText: string) => {
    setTimeout(() => {
      // Check if user message contains "confirmation" (case-insensitive)
      if (userMessageText.toLowerCase().includes("confirmation")) {
        const confirmationMessage: Message = {
          id: `confirmation-${Date.now()}`,
          text: "Here's a creative summary of our conversation. Would you like to proceed?",
          sender: "ai",
          type: "confirmation",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, confirmationMessage]);
      } else {
        const aiMessage: Message = {
          id: `ai-${Date.now()}`,
          text: "I received your message!",
          sender: "ai",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      }
    }, 500);
  }, []);

  // Send message function
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
    
    // Reset textarea height after sending
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = "49px"; // Reset to min height
    }
    
    sendMockResponse(trimmedValue);
  }, [inputValue, sendMockResponse]);

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
  };
}
