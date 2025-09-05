'use client';

import { useState } from "react";
import { MessageSquare, Trash2, Plus, X, User, LogOut, Settings, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
// import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
// Note: The LoginDialog is not a standard UI component, we will create it later.
// For now, this line will cause an error.
// import { LoginDialog } from "@/components/modals/LoginDialog";

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

interface ChatSidebarProps {
  chatSessions: ChatSession[];
  currentSessionId: string;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onNewChat: () => void;
  isMobile?: boolean;
  onClose?: () => void;
  isAuthenticated: boolean;
  userProfile: UserProfile;
  onLogout: () => void;
}

export function ChatSidebar({ 
  chatSessions, 
  currentSessionId,
  onSelectSession, 
  onDeleteSession,
  onNewChat,
  isMobile = false,
  onClose,
  isAuthenticated,
  userProfile,
  onLogout
}: ChatSidebarProps) {
  const [hoveredSession, setHoveredSession] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getPreviewText = (messages: Message[]) => {
    const previewMessage = messages[messages.length - 1];
    if (!previewMessage) return "No messages";
    return previewMessage.content.substring(0, 45) + (previewMessage.content.length > 45 ? "..." : "");
  };

  return (
    <div className="flex flex-col h-full bg-card/95 backdrop-blur-xl border-r border-border">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-foreground">Chat History</h2>
          {isMobile && onClose && (
            <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
        <Button onClick={onNewChat} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          New Chat
        </Button>
      </div>

      <ScrollArea className="flex-1 p-2">
        <div className="space-y-1">
          {chatSessions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-4" />
              <p>No chat history</p>
            </div>
          ) : (
            chatSessions.map((session) => (
              <div
                key={session.id}
                className={`p-3 rounded-lg cursor-pointer group relative ${
                  session.id === currentSessionId ? 'bg-accent' : 'hover:bg-accent/50'
                }`}
                onClick={() => onSelectSession(session.id)}
                onMouseEnter={() => setHoveredSession(session.id)}
                onMouseLeave={() => setHoveredSession(null)}
              >
                <h4 className="font-medium text-sm truncate">{session.title}</h4>
                <p className="text-xs text-muted-foreground truncate">{getPreviewText(session.messages)}</p>
                <span className="text-xs text-muted-foreground/50">{formatDate(session.lastActive)}</span>
                {(hoveredSession === session.id) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border">
        {isAuthenticated ? (
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={userProfile.avatar} alt={userProfile.name} />
              <AvatarFallback>{userProfile.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{userProfile.name}</p>
              <p className="text-xs text-muted-foreground truncate">{userProfile.email}</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground">
                  <Settings className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem>
                  <User className="w-4 h-4 mr-2" /> Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout} className="text-destructive">
                  <LogOut className="w-4 h-4 mr-2" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <Button variant="outline" className="w-full">
            <LogIn className="w-4 h-4 mr-2" /> Sign In
          </Button>
        )}
      </div>
    </div>
  );
}
