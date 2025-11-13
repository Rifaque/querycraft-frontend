'use client';

import { useState, useRef, useEffect } from "react";
import { Send, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSendMessage, disabled = false }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  return (
    <div className="sticky bottom-0 bg-background/95 backdrop-blur-lg border-border px-4 py-3 sm:px-6 sm:py-4">
      <div className="max-w-3xl mx-auto">
        <div className={`flex items-end space-x-2 bg-[#020817] rounded-xl border p-4 transition-all duration-200 ${
          isFocused 
            ? 'ring-2 ring-primary/50' 
            : 'hover:border-primary/50'
        }`}>
          {/* <Button 
            variant="ghost" 
            size="icon" 
            className="text-muted-foreground shrink-0 h-8 w-8"
          >
            <Paperclip className="w-4 h-4" />
          </Button> */}
          
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Message QueryCraft..."
            className="border-0 resize-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent max-h-24 placeholder:text-muted-foreground text-foreground p-0 text-sm"
            disabled={disabled}
            rows={1}
          />
          
          <Button
            onClick={handleSend}
            disabled={!message.trim() || disabled}
            size="icon"
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg shrink-0 h-8 w-8"
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground text-center mt-2 hidden sm:block">
          Press Enter to send, Shift + Enter for new line
        </p>
      </div>
    </div>
  );
}

