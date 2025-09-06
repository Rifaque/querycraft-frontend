'use client';

import React, { useEffect, useState } from 'react';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { ChatInput } from '@/components/chat/ChatInput';
import { DatabaseImportDialog } from '@/components/modals/DatabaseImportDialog';
import { ChatSidebar } from '@/components/layout/ChatSidebar';
import { MobileSidebarTrigger } from '@/components/layout/MobileSidebarTrigger';
import { SettingsDialog } from '@/components/modals/SettingsDialog';

// --- Types ---
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
  isLocal?: boolean;
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

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://apiquerycraft.hubzero.in';

function authHeaders(): HeadersInit {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('qc_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
}

// --- Response shapes from backend (narrowly typed) ---
interface RawChatFromServer {
  _id?: string;
  id?: string;
  title?: string;
  messages?: unknown;
  createdAt?: string;
  updatedAt?: string;
  lastActive?: string;
}

// --- Backend minimal response shape ---
interface QueryResponse {
  queryId?: string;
  chatId?: string;
  model?: string;
  status?: 'pending' | 'done' | 'failed';
  createdAt?: string;
  updatedAt?: string;
  response?: string; // the actual generated string
}


// --- Helpers: safe parsing utilities ---
function isMessageArray(v: unknown): v is Message[] {
  return Array.isArray(v) && v.every((m) => {
    const mm = m as unknown as Record<string, unknown>;
    return typeof mm.id === 'string' && typeof mm.content === 'string';
  });
}

function normalizeChat(raw: RawChatFromServer): ChatSession {
  const id = raw._id || raw.id || String(Date.now()) ;
  const title = raw.title || 'Chat';
  const messages: Message[] = isMessageArray(raw.messages)
    ? raw.messages
    : [
        {
          id: Date.now().toString(),
          content: 'This chat has no structured messages (server returned unexpected shape).',
          isUser: false,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ];

  return {
    id,
    title,
    messages,
    createdAt: raw.createdAt || new Date().toISOString(),
    lastActive: raw.updatedAt || raw.lastActive || new Date().toISOString()
    , isLocal: false
  };
}

export function ChatApp({ userProfile, onUpdateProfile, onLogout }: ChatAppProps) {
  const [currentSessionId, setCurrentSessionId] = useState<string>(''); // start empty
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);

  const [isTyping, setIsTyping] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>(userProfile.preferences.defaultModel);
  const [showDatabaseDialog, setShowDatabaseDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);

  const isMountedRef = React.useRef(true);
  useEffect(() => {
    return () => { isMountedRef.current = false; };
  }, []);

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


  const prependOrUpdateSession = (chat: Partial<ChatSession> & { id: string }) => {
    setChatSessions((prev) => {
      const exists = prev.find((p) => p.id === chat.id);
      if (exists) {
        return prev.map((p) => (p.id === chat.id ? { ...p, ...chat } : p));
      }
      return [
        {
          id: chat.id,
          title: chat.title || 'New Chat',
          messages: chat.messages || [],
          createdAt: chat.createdAt || new Date().toISOString(),
          lastActive: chat.lastActive || new Date().toISOString()
        },
        ...prev
      ];
    });
  };

  // --- Load user's chats on mount ---
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/chat`, { headers: authHeaders() });
        if (res.ok) {
          const data = (await res.json()) as unknown;
          if (Array.isArray(data) && data.length > 0) {
            const chats = data.map((c) => normalizeChat(c as RawChatFromServer));
            setChatSessions(chats);
            setCurrentSessionId(chats[0].id);
          } else {
            // no server chats: keep client empty => show NewChatScreen
            setChatSessions([]);
            setCurrentSessionId('');
          }
        } else if (res.status === 401) {
          console.warn('Unauthorized when loading chats (401).');
        } else {
          console.warn('Failed to fetch chats', res.status, res.statusText);
        }
      } catch (err: unknown) {
        console.error('Load chats error', err);
      }
    })();
  }, []);


  // When user clicks "New chat", only create a local chat. Server chat will be created
  // only when the user sends the first message in that chat.
  const handleNewChat = () => {
    createLocalChat('New Chat');
  };

  const handleSelectSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/chat/${sessionId}`, { method: 'DELETE', headers: authHeaders() });
      if (res.ok) {
        setChatSessions((prev) => prev.filter((s) => s.id !== sessionId));
        if (currentSessionId === sessionId && chatSessions.length > 1) setCurrentSessionId(chatSessions[0].id);
      } else {
        // if backend doesn't support, remove locally
        setChatSessions((prev) => prev.filter((s) => s.id !== sessionId));
        console.warn('Delete session backend returned', res.status);
      }
    } catch (err: unknown) {
      setChatSessions((prev) => prev.filter((s) => s.id !== sessionId));
      console.error('Delete session error', err);
    }
  };

  // --- Send message: POST /api/query ---
  const handleSendMessage = async (content: string) => {
    // ensure we have a chat id - create a local chat immediately for UX if none exists
    let sessionId = currentSessionId || createLocalChat('New Chat');

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      isUser: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // append user msg locally first (use the sessionId defined above)
    updateSessionMessages(sessionId, (prev) => [...prev, userMessage]);
    setIsTyping(true);

    // If this is a local-only chat (no server chat yet), create server chat now and migrate messages.
    const sessionObj = chatSessions.find((s) => s.id === sessionId);
    if (sessionObj?.isLocal) {
      try {
        const res = await fetch(`${API_BASE}/api/chat`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ title: sessionObj.title || content.slice(0, 50) })
        });

        if (res.ok) {
          const serverChat = (await res.json()) as RawChatFromServer;
          // Merge local messages into server chat and switch to server id
          mergeLocalToServer(sessionId, serverChat);
          // ensure we use server id from normalizeChat
          sessionId = (serverChat._id || serverChat.id) ?? sessionId;
        } else {
          console.warn('Failed to create server chat; continuing with local chat', res.status);
        }
      } catch (err) {
        console.warn('Network error creating server chat, continuing with local chat', err);
      }
    }

    try {
      const payload = { chatId: sessionId, prompt: content, model: selectedModel };
      const res = await fetch(`${API_BASE}/api/query`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });

      // extract body if present (safe)
      let data: QueryResponse | null = null;
      try {
        data = res.ok || res.status === 202 ? (await res.json()) as QueryResponse : (await res.json()) as QueryResponse;
      } catch {
        data = null;
      }

      // When server returns pending (202) or minimal with status pending:
      if (res.status === 202 || data?.status === 'pending') {
        // Create placeholder AI message and start polling
        const placeholderId = `ai-${data?.queryId || Date.now().toString()}`;
        const placeholderMsg: Message = {
          id: placeholderId,
          content: 'Thinking...',
          isUser: false,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        updateSessionMessages(sessionId, (prev) => [...prev, placeholderMsg]);

        // if backend returned a new chatId (server created chat), ensure we update local sessions
        if (data?.chatId) {
          prependOrUpdateSession({ id: data.chatId, title: content.slice(0, 50), messages: [...(messages || []), userMessage, placeholderMsg] });
          // switch to new chat id
          // Note: server might have created a different chat id than client session; update sessionId for polling
          setCurrentSessionId(data.chatId);
        }

        // Poll in background (no await here)
        pollQueryResult(data?.queryId || '', placeholderId, data?.chatId || sessionId);
        return;
      }

      // If sync response (done)
      if (res.ok && data) {
        const aiText = data.response || 'No response from LLM';
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: aiText,
          isUser: false,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        updateSessionMessages(sessionId, (prev) => [...prev, aiMessage]);

        // If backend returned a chatId (created new chat), ensure local session uses it
        if (data.chatId) {
          prependOrUpdateSession({ id: data.chatId, title: content.slice(0, 50), messages: [...(messages || []), userMessage, aiMessage] });
          setCurrentSessionId(data.chatId);
        }

        return;
      }

      // Non-ok response handling (use your existing flow)
      let errBody: unknown = null;
      try {
        errBody = await res.json();
      } catch {
        errBody = { message: res.statusText };
      }
      const errMsgFromBody =
        typeof errBody === 'object' && errBody !== null
          ? String((errBody as Record<string, unknown>).error ?? (errBody as Record<string, unknown>).message ?? '')
          : '';
      const serverMessage =
        res.status === 404
          ? 'Endpoint not found (404). Check NEXT_PUBLIC_API_BASE and that your backend exposes POST /api/query.'
          : (errMsgFromBody || res.statusText);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: serverMessage,
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      updateSessionMessages(sessionId, (prev) => [...prev, aiMessage]);
      console.warn('Query failed', res.status, res.statusText, errBody);
    } catch (err: unknown) {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Network or LLM error: ${err instanceof Error ? err.message : String(err)}`,
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      updateSessionMessages(currentSessionId || Date.now().toString(), (prev) => [...prev, aiMessage]);
      console.error('Network or LLM error', err);
    } finally {
      setIsTyping(false);
    }
  };


  // --- Export / Import / Clear (client-friendly implementations) ---
  const handleExportSessions = () => {
    const blob = new Blob([JSON.stringify(chatSessions, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'querycraft-chats.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSessions = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const text = String(e.target?.result || '[]');
        const json = JSON.parse(text) as unknown;
        const imported = Array.isArray(json)
          ? (json as unknown[]).map((c) => normalizeChat(c as RawChatFromServer))
          : [];
        setChatSessions((prev) => [...imported, ...prev]);
      } catch (err: unknown) {
        console.error('Invalid import file', err);
      }
    };
    reader.readAsText(file);
  };

  const handleClearAllHistory = async () => {
    try {
      // Attempt backend clear first (if backend supports DELETE /api/chat)
      await fetch(`${API_BASE}/api/chat`, { method: 'DELETE', headers: authHeaders() }).catch(() => null);
    } catch (e: unknown) {
      console.error('Clear history network error', e);
    }
    // Always clear client state
    setChatSessions([]);
    setCurrentSessionId('');
  };

  const handleDatabaseImport = () => {
    setShowDatabaseDialog(true);
  };

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

      <DatabaseImportDialog open={showDatabaseDialog} onOpenChange={setShowDatabaseDialog} onImport={() => handleDatabaseImport()} />

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
