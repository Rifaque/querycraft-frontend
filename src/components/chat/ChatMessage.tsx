'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Bot, User } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CodeCard } from './CodeCard';
import styles from './ChatMessage.module.css';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  timestamp: string;
}

type Segment =
  | { type: 'text'; content: string }
  | { type: 'code'; lang: string; content: string };

function parseMessageToSegments(message: string): Segment[] {
  const segments: Segment[] = [];
  const fenceRE = /```(?:([a-zA-Z0-9+-]*)\n)?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = fenceRE.exec(message)) !== null) {
    const index = match.index;
    if (index > lastIndex) {
      segments.push({ type: 'text', content: message.slice(lastIndex, index) });
    }

    const lang = match[1] || '';
    const codeContent = match[2];
    segments.push({ type: 'code', lang, content: codeContent });

    lastIndex = fenceRE.lastIndex;
  }

  if (lastIndex < message.length) {
    segments.push({ type: 'text', content: message.slice(lastIndex) });
  }

  return segments;
}

export function ChatMessage({ message, isUser, timestamp }: ChatMessageProps) {
  const segments = parseMessageToSegments(message);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.27 }}
      className={cn(styles.messageContainer, isUser && styles.userMessage)}
    >
      {!isUser && (
        <Avatar className={styles.avatar}>
          <AvatarFallback>
            <Bot />
          </AvatarFallback>
        </Avatar>
      )}

      <div className={styles.messageContent}>
        <div
          className={cn(
            styles.bubble,
            isUser ? styles.userBubble : styles.botBubble
          )}
        >
          <div className={styles.prose}>
            {segments.map((seg, i) => {
              if (seg.type === 'text') {
                return (
                  <p key={i} className={styles.textSegment}>
                    {seg.content}
                  </p>
                );
              }

              return (
                <div key={i} className={styles.codeSegment}>
                  <CodeCard code={seg.content} lang={seg.lang} />
                </div>
              );
            })}
          </div>
        </div>

        <div className={cn(
          styles.timestamp,
          isUser ? styles.userTimestamp : styles.botTimestamp
        )}>
          {timestamp}
        </div>
      </div>

      {isUser && (
        <Avatar className={styles.avatar}>
          <AvatarFallback>
            <User />
          </AvatarFallback>
        </Avatar>
      )}
    </motion.div>
  );
}

export default ChatMessage;
