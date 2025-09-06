'use client';

import { motion } from "framer-motion";
import { Bot, User } from "lucide-react";
import { Avatar, AvatarFallback} from "@/components/ui/avatar";

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  timestamp: string;
}

export function ChatMessage({ message, isUser, timestamp }: ChatMessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`w-full flex gap-4 ${isUser ? "justify-end" : ""}`}
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
          <p className="leading-relaxed whitespace-pre-wrap">
            {message}
          </p>
        </div>
        <div className={`text-xs text-muted-foreground ${isUser ? "text-right" : "text-left"}`}>
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

