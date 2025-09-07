'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Bot, User } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CodeCard } from './CodeCard';


interface ChatMessageProps {
  message: string;
  isUser: boolean;
  timestamp: string;
}

type Segment =
  | { type: 'text'; content: string }
  | { type: 'code'; lang: string; content: string };

/**
 * Splits a message into plain-text and fenced-code segments.
 * Supports fences like: ``` or ```sql
 */
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
      className={`w-full flex gap-4 ${isUser ? 'justify-end' : ''}`}
    >
      {!isUser && (
        <Avatar className="flex-shrink-0">
          <AvatarFallback>
            <Bot />
          </AvatarFallback>
        </Avatar>
      )}

      <div className={`max-w-[80%] space-y-2`}>
        <div
          className={`px-4 py-3 rounded-lg ${
            isUser
              ? 'bg-primary text-primary-foreground rounded-br-none'
              : 'bg-secondary text-secondary-foreground rounded-bl-none'
          }`}
        >
          {/* Render mixed segments: text and code cards */}
          <div className="prose prose-sm max-w-none">
            {segments.map((seg, i) => {
              if (seg.type === 'text') {
                // Preserve newlines and spacing
                return (
                  <p key={i} className="whitespace-pre-wrap break-words">
                    {seg.content}
                  </p>
                );
              }

              return (
                <div key={i} className="mt-2">
                  <CodeCard code={seg.content} lang={seg.lang} />
                </div>
              );
            })}
          </div>
        </div>

        <div className={`text-xs text-muted-foreground ${isUser ? 'text-right' : 'text-left'}`}>
          {timestamp}
        </div>
      </div>

      {isUser && (
        <Avatar className="flex-shrink-0">
          <AvatarFallback>
            <User />
          </AvatarFallback>
        </Avatar>
      )}
    </motion.div>
  );
}

export default ChatMessage;