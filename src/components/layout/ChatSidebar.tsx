'use client';

import { useState, useEffect } from "react";
import { MessageSquare, Trash2, Plus, X, User, LogOut, Settings, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

import styles from "./ChatSidebar.module.css";

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
  const user = localStorage.getItem("qc_user");

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getPreviewText = (messages: Message[]) => {
    const previewMessage = messages[messages.length - 1];
    if (!previewMessage) return "No messages";
    return previewMessage.content.substring(0, 45) + (previewMessage.content.length > 45 ? "..." : "");
  };

  const getInitials = (profile?: { name?: string; email?: string }) => {
    const source = (profile?.name ?? profile?.email ?? "").trim();
    if (!source) return "?";
    const parts = source.split(/\s+/);
    if (parts.length >= 2) {
      const a = parts[0][0] ?? "";
      const b = parts[1][0] ?? "";
      return (a + b).toUpperCase();
    }
    return source.charAt(0).toUpperCase();
  };

  useEffect(() => {
    console.log('ChatSidebar userProfile changed', userProfile);
  }, [userProfile]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <h2 className={styles.title}>Chat History</h2>
          {isMobile && onClose && (
            <Button variant="ghost" size="icon" className={styles.closeBtn} onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
        <Button
          onClick={onNewChat}
          className={styles.newChatBtn}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Chat
        </Button>
      </div>

      <ScrollArea className={styles.scrollArea}>
        <div className={styles.sessionList}>
          {chatSessions.length === 0 ? (
            <div className={styles.emptyState}>
              <MessageSquare className="w-12 h-12 mx-auto mb-4" />
              <p>No chat history</p>
            </div>
          ) : (
            chatSessions.map((session) => {
              const isActive = session.id === currentSessionId;
              const itemClass = isActive ? `${styles.sessionItem} ${styles.active}` : styles.sessionItem;

              return (
                <div
                  key={session.id}
                  className={itemClass}
                  onClick={() => onSelectSession(session.id)}
                  onMouseEnter={() => setHoveredSession(session.id)}
                  onMouseLeave={() => setHoveredSession(null)}
                >
                  <h4 className={styles.sessionTitle}>{session.title}</h4>
                  <p className={styles.preview}>{getPreviewText(session.messages)}</p>
                  <span className={styles.timestamp}>{formatDate(session.lastActive)}</span>

                  {hoveredSession === session.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className={styles.deleteButton}
                      onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      <div className={styles.footer}>
        {isAuthenticated ? (
          <div className={styles.profileRow}>
            <Avatar>
              {userProfile?.avatar ? (
                <AvatarImage src={userProfile.avatar} alt={userProfile?.name ?? userProfile?.email ?? "User"} />
              ) : null}
              <AvatarFallback>{getInitials(userProfile)}</AvatarFallback>
            </Avatar>

            <div className={styles.userInfo}>
              <p className={styles.userName}>{user ? JSON.parse(user).name : userProfile?.name}</p>
              <p className={styles.userEmail}>{user ? JSON.parse(user).email : userProfile?.email}</p>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className={styles.settingsBtn}>
                  <Settings className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className={styles.dropdownContent}>
                <DropdownMenuItem>
                  <User className="w-4 h-4 mr-2" /> Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout} className={styles.signOutItem}>
                  <LogOut className="w-4 h-4 mr-2" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <Button variant="outline" className={styles.signInBtn}>
            <LogIn className="w-4 h-4 mr-2" /> Sign In
          </Button>
        )}
      </div>
    </div>
  );
}
