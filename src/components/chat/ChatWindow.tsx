'use client';

import { useEffect, useRef } from "react";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { ScrollArea } from "@/components/ui/scroll-area";
// import queryCraftLogo from "@/assets/querycraft-logo.png";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: string;
}

interface ChatWindowProps {
  messages: Message[];
  isTyping?: boolean;
  /**
   * When true, show the Welcome to QueryCraft screen regardless of messages.
   * Useful when user hasn't selected a chat yet but there are previous chats loaded.
   */
  showWelcome?: boolean;
}

export function ChatWindow({ messages, isTyping = false, showWelcome = false }: ChatWindowProps) {
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll when messages or typing state changes.
  useEffect(() => {
    try {
      if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
      }
    } catch (e) {
      // defensive: don't break the UI if scroll fails for any reason
      console.warn('[ChatWindow] scroll error', e);
    }
  }, [messages, isTyping]);

  const shouldShowWelcome = showWelcome && !isTyping || (messages.length === 0 && !isTyping);

  return (
    <div className="flex-1 bg-transparent overflow-hidden">
      <ScrollArea className="h-full" ref={scrollAreaRef}>
        <div className="max-w-4xl mx-auto px-6 py-4">
          {shouldShowWelcome ? (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center">
              <div className="w-20 h-20 mb-6 rounded-2xl bg-card border flex items-center justify-center">
                {/* <img src={queryCraftLogo.src} alt="QueryCraft AI" className="w-16 h-16 object-contain" /> */}
                <p className="text-3xl">🤖</p>
              </div>
              <h2 className="text-2xl font-semibold text-foreground mb-3">
                Welcome to QueryCraft
              </h2>
              <p className="text-muted-foreground max-w-md leading-relaxed">
                Your intelligent database assistant. Start by asking questions about your data.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message.content}
                  isUser={message.isUser}
                  timestamp={message.timestamp}
                />
              ))}
              {isTyping && <TypingIndicator />}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
