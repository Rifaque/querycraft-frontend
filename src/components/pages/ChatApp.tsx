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

  const isMountedRef = React.useRef(true);
  useEffect(() => {
    return () => { isMountedRef.current = false; };
  }, []);

  // Keep selectedModel in sync if the user's default model preference changes
  useEffect(() => {
    if (userProfile?.preferences?.defaultModel) {
      setSelectedModel(userProfile.preferences.defaultModel);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile?.preferences?.defaultModel]);

  // Polling helper
  function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function createLocalChat(title = 'New Chat') {
    const id = Date.now().toString();
    const newChat: ChatSession = {
      id,
      title,
      messages: [],
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString()
      , isLocal: true
    };
    // prepend locally
    setChatSessions((prev) => [newChat, ...prev]);
    setCurrentSessionId(id);
    return id;
  }

  // Merge a local chat (identified by localId) into a server chat returned by the backend.
  // Preserves local messages and replaces the local placeholder with the server chat.
  function mergeLocalToServer(localId: string, rawServerChat: RawChatFromServer) {
    const serverNormalized = normalizeChat(rawServerChat);

    setChatSessions((prev) => {
      const local = prev.find((c) => c.id === localId);
      // remove any existing item having serverNormalized.id (avoid duplicates), also remove local placeholder
      const filtered = prev.filter((c) => c.id !== localId && c.id !== serverNormalized.id);

      const merged = {
        ...serverNormalized,
        messages: local?.messages?.length ? local!.messages : serverNormalized.messages,
        isLocal: false
      };

      return [merged, ...filtered];
    });

    setCurrentSessionId(serverNormalized.id);
  }

  /**
   * Poll server for query result until status === 'done' or attempts exhausted.
   * Replaces the placeholder message with final AI text when ready.
   */
  async function pollQueryResult(queryId: string, placeholderMessageId: string, sessionId: string) {
    const maxAttempts = 10;
    let attempt = 0;
    let delay = 800; // starting delay

    while (attempt < maxAttempts && isMountedRef.current) {
      try {
        const res = await fetch(`${API_BASE}/api/query/${queryId}`, { headers: authHeaders() });
        if (!res.ok) {
          // If 404/403 etc, stop polling and show error in placeholder
          if (res.status === 404 || res.status === 403) {
            const errText = `Server returned ${res.status}`;
            updateSessionMessages(sessionId, messages => 
              messages.map(m => (m.id === placeholderMessageId ? { ...m, content: errText } : m))
            );
            return;
          }
        } else {
          const data = (await res.json()) as QueryResponse;
          if (data?.status === 'done') {
            const finalText = data.response || 'No response';
            // Replace placeholder with real AI message
            updateSessionMessages(sessionId, (prevMessages) =>
              prevMessages.map((m) => (m.id === placeholderMessageId ? { ...m, content: finalText } : m))
            );
            // Ensure chat session exists / is updated
            if (data.chatId) {
              const title = (prevTitleFromMessage() || '').slice(0, 50) || 'Chat';
              prependOrUpdateSession({ id: data.chatId, title, messages: getSessionMessagesCopy(sessionId, placeholderMessageId, finalText) });
              setCurrentSessionId(data.chatId);
            }
            return;
          } else if (data?.status === 'failed') {
            updateSessionMessages(sessionId, (prevMessages) =>
              prevMessages.map((m) => (m.id === placeholderMessageId ? { ...m, content: 'LLM failed to produce an answer.' } : m))
            );
            return;
          }
        }
      } catch (err) {
        // network error — continue to retry silently
        console.warn('[pollQueryResult] attempt', attempt, 'error', err);
      }

      // backoff
      await sleep(delay);
      attempt += 1;
      delay = Math.min(5000, delay * 1.8);
    }

    // If exhausted attempts, show timed out message
    updateSessionMessages(sessionId, (prevMessages) =>
      prevMessages.map((m) => (m.id === placeholderMessageId ? { ...m, content: 'Request timed out. Try again.' } : m))
    );
  }

  /** Helpers used above — small utility wrappers to keep state updates safe */
  function updateSessionMessages(sessionId: string, updater: (prev: Message[]) => Message[]) {
    setChatSessions((prev) =>
      prev.map((session) =>
        session.id === sessionId ? { ...session, messages: updater(session.messages), lastActive: new Date().toISOString() } : session
      )
    );
  }
  function getSessionMessagesCopy(sessionId: string, placeholderId: string, finalText: string) {
    const session = chatSessions.find((s) => s.id === sessionId);
    if (!session) return [{ id: placeholderId, content: finalText, isUser: false, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }];
    return session.messages.map((m) => (m.id === placeholderId ? { ...m, content: finalText } : m));
  }
  function prevTitleFromMessage() {
    // pick something intelligent for new chat titles; fallback to current session first message
    const s = chatSessions.find((s) => s.id === currentSessionId);
    return s?.messages?.[0]?.content?.slice?.(0, 50) || '';
  }


  const currentSession = chatSessions.find((s) => s.id === currentSessionId) || chatSessions[0] || null;
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
          key={userProfile.email}
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
        key={userProfile.email}
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
