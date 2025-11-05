'use client';

import { useEffect, useRef } from "react";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { ScrollArea } from "@/components/ui/scroll-area";
import styles from "./ChatWindow.module.css";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: string;
}

interface ChatWindowProps {
  messages: Message[];
  isTyping?: boolean;
  showWelcome?: boolean;
}

export function ChatWindow({ messages, isTyping = false, showWelcome = false }: ChatWindowProps) {
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
      }
    } catch (e) {
      console.warn('[ChatWindow] scroll error', e);
    }
  }, [messages, isTyping]);

  const shouldShowWelcome = showWelcome && !isTyping || (messages.length === 0 && !isTyping);

  return (
    <div className={styles.container}>
      <ScrollArea className={styles.scrollArea} ref={scrollAreaRef}>
        <div className={styles.contentWrapper}>
          {shouldShowWelcome ? (
            <div className={styles.welcomeContainer}>
              <div className={styles.welcomeLogo}>
                <p className={styles.welcomeEmoji}>🤖</p>
              </div>
              <h2 className={styles.welcomeTitle}>
                Welcome to QueryCraft
              </h2>
              <p className={styles.welcomeText}>
                Your intelligent database assistant. Start by asking questions about your data.
              </p>
            </div>
          ) : (
            <div className={styles.messagesContainer}>
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
