'use client';

import { useState } from "react";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { ChatInput } from "@/components/chat/ChatInput";
import { DatabaseImportDialog } from "@/components/modals/DatabaseImportDialog";
import { ChatSidebar } from "@/components/layout/ChatSidebar";
import { MobileSidebarTrigger } from "@/components/layout/MobileSidebarTrigger";
import { SettingsDialog } from "@/components/modals/SettingsDialog";
//import { toast } from "@/components/ui/sonner";

// Define the structure for messages, sessions, and user profiles
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
  preferences: {
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
    autoSave: boolean;
    defaultModel: string;
  };
}

interface ChatAppProps {
  userProfile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  onLogout: () => void;
}

export function ChatApp({ userProfile, onUpdateProfile, onLogout }: ChatAppProps) {
  const [currentSessionId, setCurrentSessionId] = useState<string>("1");
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([
    {
      id: "1",
      title: "Welcome Chat",
      messages: [
        {
          id: "1",
          content: "Hello! I'm QueryCraft, your intelligent database assistant. I can help you with SQL queries, data analysis, and database management. How can I assist you today?",
          isUser: false,
          timestamp: "10:30 AM",
        },
      ],
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
    },
  ]);

  const [isTyping, setIsTyping] = useState(false);
  const [selectedModel, setSelectedModel] = useState(userProfile.preferences.defaultModel);
  const [showDatabaseDialog, setShowDatabaseDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);

  const currentSession = chatSessions.find(session => session.id === currentSessionId);
  const messages = currentSession?.messages || [];

  const updateSessionMessages = (sessionId: string, newMessages: Message[]) => {
    setChatSessions(prev => prev.map(session => 
      session.id === sessionId 
        ? { ...session, messages: newMessages, lastActive: new Date().toISOString() }
        : session
    ));
  };

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      isUser: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMessage];
    updateSessionMessages(currentSessionId, newMessages);
    setIsTyping(true);

    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `This is a mock response from ${selectedModel === "merlin" ? "Merlin AI" : "QWEN AI"}.`,
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      updateSessionMessages(currentSessionId, [...newMessages, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };
  
  // Placeholder functions from original file
  const handleSelectSession = (sessionId: string) => setCurrentSessionId(sessionId);
  const handleDeleteSession = (sessionId: string) => { console.log("Delete session:", sessionId); };
  const handleNewChat = () => { console.log("New Chat"); };
  const handleDatabaseImport = () => { console.log("Import DB"); };
  const handleExportSessions = () => { console.log("Exporting"); };
  const handleImportSessions = (file: File) => { console.log("Importing file:", file.name); };
  const handleClearAllHistory = () => { console.log("Clearing history"); };

  return (
    <div className="h-screen flex bg-background">
      <div className="hidden lg:block w-80 flex-shrink-0">
        <ChatSidebar
          chatSessions={chatSessions}
          currentSessionId={currentSessionId}
          onSelectSession={handleSelectSession}
          onDeleteSession={handleDeleteSession}
          onNewChat={handleNewChat}
          isAuthenticated={true}
          userProfile={userProfile}
          onLogout={onLogout}
        />
      </div>
      
      <div className="flex-1 flex flex-col min-w-0">
        <ChatHeader 
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          onDatabaseImport={() => setShowDatabaseDialog(true)}
          onSettingsClick={() => setShowSettingsDialog(true)}
          sidebarTrigger={
            <MobileSidebarTrigger
              chatSessions={chatSessions}
              currentSessionId={currentSessionId}
              onSelectSession={handleSelectSession}
              onDeleteSession={handleDeleteSession}
              onNewChat={handleNewChat}
              isAuthenticated={true}
              userProfile={userProfile}
              onLogout={onLogout}
            />
          }
        />
        <ChatWindow messages={messages} isTyping={isTyping} />
        <ChatInput onSendMessage={handleSendMessage} disabled={isTyping} />
      </div>
      
      <DatabaseImportDialog
        open={showDatabaseDialog}
        onOpenChange={setShowDatabaseDialog}
        onImport={handleDatabaseImport}
      />

      <SettingsDialog
        open={showSettingsDialog}
        onOpenChange={setShowSettingsDialog}
        chatSessions={chatSessions}
        currentSessionId={currentSessionId}
        userProfile={userProfile}
        onUpdateProfile={onUpdateProfile}
        onDeleteSession={handleDeleteSession}
        onExportSessions={handleExportSessions}
        onImportSessions={handleImportSessions}
        onClearAllHistory={handleClearAllHistory}
      />
    </div>
  );
}
