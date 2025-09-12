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
          content: '',
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


  const currentSession = currentSessionId ? chatSessions.find((s) => s.id === currentSessionId) ?? null : null;
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
            // keep chats loaded but do NOT auto-open any chat — show Welcome screen instead
            setChatSessions(chats);
            // DO NOT set currentSessionId(chats[0].id) — leave it empty to show Welcome.
            setCurrentSessionId(''); // explicit about showing welcome
          } else {
            // no server chats: keep client empty => show Welcome
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When user clicks "New chat" — behave exactly like clicking the QueryCraft header:
  // show the Welcome screen (no local chat creation). The chat will be created only
  // when the user sends their first query from the welcome screen.
  const handleNewChat = () => {
    // Show welcome / no chat selected
    setCurrentSessionId('');

    // Clear typing indicator/state to avoid stale UI when switching to welcome
    setIsTyping(false);

    // Optional: If you have a mobile sidebar open, you can close it here if you
    // expose a handler / state. For now we leave that to the sidebar trigger.
  };

  // Put this inside ChatApp (replace the existing handleSelectSession)
  const handleSelectSession = async (sessionId: string) => {
    if (!sessionId) return;

    // Optional: track loading id so you can show a spinner in the sidebar / chat header if you want
    // setFetchingChatId(sessionId);

    try {
      const res = await fetch(`${API_BASE}/api/chat/${sessionId}`, {
        headers: authHeaders(),
      });

      if (!res.ok) {
        // If not found or unauthorized, fall back to selecting any locally-known session
        console.warn('[handleSelectSession] fetch failed', res.status, res.statusText);
        const local = chatSessions.find((s) => s.id === sessionId);
        if (local) {
          // open local version as fallback
          setCurrentSessionId(local.id);
        }
        return;
      }

      const body = await res.json();

      // The backend endpoint you showed returns { chat, queries }
      // But be defensive: handle a few possible shapes gracefully.
      const serverChat = (body && (body.chat || body)) as RawChatFromServer;
      const queries = Array.isArray(body?.queries) ? body.queries : (Array.isArray(body) ? body : []);

      // Build messages in the shape your UI expects.
      // We'll attempt to map common query fields: prompt, response, createdAt, role, text, output, etc.
      const mappedMessages: Message[] = [];

      if (Array.isArray(queries) && queries.length > 0) {
        queries.forEach((q: any, idx: number) => {
          const qId = q._id ?? q.id ?? `q-${sessionId}-${idx}`;

          // If the query doc stores a user prompt separately, add it as a user message.
          if (typeof q.prompt === 'string' && q.prompt.trim().length > 0) {
            mappedMessages.push({
              id: `${qId}-u`,
              content: q.prompt,
              isUser: true,
              timestamp: new Date(q.createdAt ?? q.created_at ?? q.createdAt ?? Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
          } else if (typeof q.input === 'string' && q.input.trim().length > 0) {
            mappedMessages.push({
              id: `${qId}-u`,
              content: q.input,
              isUser: true,
              timestamp: new Date(q.createdAt ?? q.created_at ?? Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
          }

          // Attempt to pick the response text from common fields
          const possibleResponses = [q.response, q.answer, q.output, q.result, q.text, q.content];
          const responseText = possibleResponses.find((v) => typeof v === 'string' && v.trim().length > 0) as string | undefined;

          if (responseText) {
            mappedMessages.push({
              id: `${qId}-a`,
              content: responseText,
              isUser: false,
              timestamp: new Date(q.updatedAt ?? q.createdAt ?? q.created_at ?? Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
          } else {
            // Some schemas store full exchange in a single field (e.g. 'message' or 'content')
            if (typeof q.message === 'string' && q.message.trim()) {
              mappedMessages.push({
                id: `${qId}-a2`,
                content: q.message,
                isUser: false,
                timestamp: new Date(q.updatedAt ?? Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              });
            }
          }
        });
      } else if (Array.isArray(serverChat?.messages) && serverChat.messages.length > 0) {
        // If the chat itself contains messages (older shape), map them directly
        (serverChat.messages as any[]).forEach((m, i) => {
          mappedMessages.push({
            id: String(m.id ?? m._id ?? `m-${serverChat._id ?? sessionId}-${i}`),
            content: (m.content ?? m.text ?? m.body ?? '').toString(),
            isUser: Boolean(m.isUser ?? m.role === 'user'),
            timestamp: new Date(m.timestamp ?? m.createdAt ?? Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          });
        });
      }

      // If we couldn't derive messages, fallback to serverChat.messages or an empty array
      const finalMessages = mappedMessages.length > 0
        ? mappedMessages
        : (Array.isArray(serverChat?.messages) ? (serverChat.messages as Message[]) : []);

      // Build the normalized session object
      const normalized: ChatSession = {
        id: serverChat._id ?? serverChat.id ?? sessionId,
        title: serverChat.title ?? 'Chat',
        messages: finalMessages,
        createdAt: serverChat.createdAt ?? new Date().toISOString(),
        lastActive: serverChat.updatedAt ?? serverChat.lastActive ?? new Date().toISOString()
      };

      // Prepend or update local sessions and open it
      prependOrUpdateSession(normalized);
      setCurrentSessionId(normalized.id);
    } catch (err) {
      console.error('[handleSelectSession] error fetching chat by id', err);
      // fallback: open a locally-known session if present
      const fallback = chatSessions.find((s) => s.id === sessionId);
      if (fallback) setCurrentSessionId(fallback.id);
    } finally {
      // setFetchingChatId(null); // if you used a fetching state
    }
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
    // Determine or create session: if no chat selected, create server chat first.
    let sessionId = currentSessionId;

    // Create the user message object (timestamp is generated when we append)
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      isUser: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // If no session selected, create a server chat (POST /api/chat).
    if (!sessionId) {
      try {
        const res = await fetch(`${API_BASE}/api/chat`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ title: content.slice(0, 50) || 'New Chat' })
        });

        if (res.ok) {
          const serverChat = (await res.json()) as RawChatFromServer;
          const normalized = normalizeChat(serverChat);
          // add server chat to state (no messages yet)
          prependOrUpdateSession({ id: normalized.id, title: normalized.title, messages: normalized.messages, createdAt: normalized.createdAt, lastActive: normalized.lastActive });
          setCurrentSessionId(normalized.id);
          sessionId = normalized.id;
        } else {
          console.warn('Failed to create server chat; falling back to local chat', res.status);
          sessionId = createLocalChat('New Chat');
        }
      } catch (err) {
        console.warn('Network error creating server chat, falling back to local chat', err);
        sessionId = createLocalChat('New Chat');
      }
    }

    // Ensure sessionId exists now (either server-provided or local fallback)
    if (!sessionId) {
      sessionId = createLocalChat('New Chat');
    }

    // Append the user message to the chosen session
    updateSessionMessages(sessionId, (prev) => [...prev, userMessage]);
    setIsTyping(true);

    // Now call the query endpoint (POST /api/query)
    try {
      const payload = { chatId: sessionId, prompt: content, model: selectedModel };
      const res = await fetch(`${API_BASE}/api/query`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });

      // try to parse body safely
      let data: QueryResponse | null = null;
      try {
        data = (await res.json()) as QueryResponse;
      } catch {
        data = null;
      }

      if (res.status === 202 || data?.status === 'pending') {
        // placeholder then poll
        const placeholderId = `ai-${data?.queryId || Date.now().toString()}`;
        const placeholderMsg: Message = {
          id: placeholderId,
          content: 'Thinking...',
          isUser: false,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        updateSessionMessages(sessionId, (prev) => [...prev, placeholderMsg]);

        // If server returned a chatId (maybe a different id), ensure we update local sessions and switch to it
        if (data?.chatId) {
          prependOrUpdateSession({ id: data.chatId, title: content.slice(0, 50), messages: [...(getSessionMessagesCopy(sessionId, '', '') || []), userMessage, placeholderMsg] });
          setCurrentSessionId(data.chatId);
          // ensure we poll for the server chat id
          pollQueryResult(data?.queryId || '', placeholderId, data?.chatId || sessionId);
        } else {
          pollQueryResult(data?.queryId || '', placeholderId, sessionId);
        }
        return;
      }

      if (res.ok && data) {
        const aiText = data.response || 'No response from LLM';
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: aiText,
          isUser: false,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        updateSessionMessages(sessionId, (prev) => [...prev, aiMessage]);

        if (data.chatId) {
          // Backend claims/created a chat id; ensure local session uses it
          prependOrUpdateSession({ id: data.chatId, title: content.slice(0, 50), messages: [...(getSessionMessagesCopy(sessionId, '', '') || []), userMessage, aiMessage] });
          setCurrentSessionId(data.chatId);
        }
        return;
      }

      // Non-ok response handling
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
      updateSessionMessages(sessionId, (prev) => [...prev, aiMessage]);
      console.error('Network or LLM error', err);
    } finally {
      setIsTyping(false);
    }
  };

  // Clear 
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
          onWelcomeClick={() => setCurrentSessionId('')}
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
        <ChatWindow messages={messages} isTyping={isTyping} showWelcome={!currentSessionId} />
        <ChatInput onSendMessage={handleSendMessage} disabled={isTyping} />
      </div>

      <DatabaseImportDialog open={showDatabaseDialog} onOpenChange={setShowDatabaseDialog} onImport={() => handleDatabaseImport()} />

      <SettingsDialog
        key={userProfile.email}
        open={showSettingsDialog}
        onOpenChange={setShowSettingsDialog}
        chatSessions={chatSessions}
        currentSessionId={currentSessionId}
        userProfile={userProfile}
        onDeleteSession={handleDeleteSession}
        onClearAllHistory={handleClearAllHistory}
      />
    </div>
  );
}
