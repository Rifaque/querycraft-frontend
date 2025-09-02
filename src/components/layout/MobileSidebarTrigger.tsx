'use client';

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ChatSidebar } from "./ChatSidebar";

// Define structures - repeated for component self-containment
interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  lastActive: string;
}

interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
}

interface MobileSidebarTriggerProps {
  chatSessions: ChatSession[];
  currentSessionId: string;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onNewChat: () => void;
  isAuthenticated: boolean;
  userProfile: UserProfile;
  onLogout: () => void;
}

export function MobileSidebarTrigger({
  chatSessions,
  currentSessionId,
  onSelectSession,
  onDeleteSession,
  onNewChat,
  isAuthenticated,
  userProfile,
  onLogout
}: MobileSidebarTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-muted-foreground"
        >
          <Menu className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-80">
        <ChatSidebar
          chatSessions={chatSessions}
          currentSessionId={currentSessionId}
          onSelectSession={onSelectSession}
          onDeleteSession={onDeleteSession}
          onNewChat={onNewChat}
          isMobile={true}
          onClose={() => setIsOpen(false)}
          isAuthenticated={isAuthenticated}
          userProfile={userProfile}
          onLogout={onLogout}
        />
      </SheetContent>
    </Sheet>
  );
}
