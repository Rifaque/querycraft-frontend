'use client';

import React, { useEffect, useState } from 'react';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { ChatInput } from '@/components/chat/ChatInput';
import { DatabaseImportDialog } from '@/components/modals/DatabaseImportDialog';
import { ChatSidebar } from '@/components/layout/ChatSidebar';
import { MobileSidebarTrigger } from '@/components/layout/MobileSidebarTrigger';
import { SettingsDialog } from '@/components/modals/SettingsDialog';

import styles from './ChatApp.module.css';

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

interface QueryResponse {
  queryId?: string;
  chatId?: string;
  model?: string;
  status?: 'pending' | 'done' | 'failed';
  createdAt?: string;
  updatedAt?: string;
  response?: string;
}

// Helpers
function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}
function getStringField(obj: unknown, ...keys: string[]): string | undefined {
  if (typeof obj !== 'object' || obj === null) return undefined;
  for (const k of keys) {
    const v = (obj as Record<string, unknown>)[k];
    if (isNonEmptyString(v)) return v;
  }
  return undefined;
}
function getBooleanField(obj: unknown, key: string): boolean | undefined {
  if (typeof obj !== 'object' || obj === null) return undefined;
  const v = (obj as Record<string, unknown>)[key];
  if (typeof v === 'boolean') return v;
  return undefined;
}
function getTimestampFrom(obj: unknown, ...keys: string[]): string {
  const s = getStringField(obj, ...keys);
  if (s) return new Date(s).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function isMessageArray(v: unknown): v is Message[] {
  return Array.isArray(v) && v.every((m) => {
    if (typeof m !== 'object' || m === null) return false;
    const mm = m as Record<string, unknown>;
    return typeof mm.id === 'string' && typeof mm.content === 'string' && typeof mm.isUser === 'boolean';
  });
}
function normalizeChat(raw: RawChatFromServer): ChatSession {
  const id = raw._id || raw.id || String(Date.now());
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
    lastActive: raw.updatedAt || raw.lastActive || new Date().toISOString(),
    isLocal: false
  };
}

export function ChatApp({ userProfile, onLogout }: ChatAppProps) {
  const [currentSessionId, setCurrentSessionId] = useState<string>(''); // start empty (welcome)
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedModel, setSelectedModel] = useState("qwen:4b");
  const [showDatabaseDialog, setShowDatabaseDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);

  const isMountedRef = React.useRef(true);
  useEffect(() => { return () => { isMountedRef.current = false; }; }, []);

  function sleep(ms: number) { return new Promise((resolve) => setTimeout(resolve, ms)); }

  function createLocalChat(title = 'New Chat') {
    const id = Date.now().toString();
    const newChat: ChatSession = {
      id,
      title,
      messages: [],
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      isLocal: true
    };
    setChatSessions((prev) => [newChat, ...prev]);
    setCurrentSessionId(id);
    return id;
  }

  async function pollQueryResult(queryId: string, placeholderMessageId: string, sessionId: string) {
    const maxAttempts = 10;
    let attempt = 0;
    let delay = 800;
    while (attempt < maxAttempts && isMountedRef.current) {
      try {
        const res = await fetch(`${API_BASE}/api/query/${queryId}`, { headers: authHeaders() });
        if (!res.ok) {
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
            updateSessionMessages(sessionId, (prevMessages) =>
              prevMessages.map((m) => (m.id === placeholderMessageId ? { ...m, content: finalText } : m))
            );
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
        console.warn('[pollQueryResult] attempt', attempt, 'error', err);
      }
      await sleep(delay);
      attempt += 1;
      delay = Math.min(5000, delay * 1.8);
    }
    updateSessionMessages(sessionId, (prevMessages) =>
      prevMessages.map((m) => (m.id === placeholderMessageId ? { ...m, content: 'Request timed out. Try again.' } : m))
    );
  }

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

  // Load chats on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/chat`, { headers: authHeaders() });
        if (res.ok) {
          const data = (await res.json()) as unknown;
          if (Array.isArray(data) && data.length > 0) {
            const chats = data.map((c) => normalizeChat(c as RawChatFromServer));
            setChatSessions(chats);
            setCurrentSessionId('');
          } else {
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

  const handleNewChat = () => {
    setCurrentSessionId('');
    setIsTyping(false);
  };

  const handleSelectSession = async (sessionId: string) => {
    if (!sessionId) return;
    try {
      const res = await fetch(`${API_BASE}/api/chat/${sessionId}`, { headers: authHeaders() });
      if (!res.ok) {
        console.warn('[handleSelectSession] fetch failed', res.status, res.statusText);
        const local = chatSessions.find((s) => s.id === sessionId);
        if (local) setCurrentSessionId(local.id);
        return;
      }
      const body = (await res.json()) as unknown;
      const serverChat = (body && ((body as Record<string, unknown>).chat || body)) as RawChatFromServer;
      const queries = Array.isArray((body as Record<string, unknown>)?.queries)
        ? ((body as Record<string, unknown>).queries as unknown[])
        : (Array.isArray(body) ? (body as unknown[]) : []);

      const mappedMessages: Message[] = [];
      if (Array.isArray(queries) && queries.length > 0) {
        queries.forEach((q: unknown, idx: number) => {
          const qId = getStringField(q, '_id', 'id') ?? `q-${sessionId}-${idx}`;
          const userPrompt = getStringField(q, 'prompt', 'input');
          if (userPrompt) {
            mappedMessages.push({
              id: `${qId}-u`,
              content: userPrompt,
              isUser: true,
              timestamp: getTimestampFrom(q, 'createdAt', 'created_at')
            });
          }
          const responseText = getStringField(q, 'response', 'answer', 'output', 'result', 'text', 'content', 'message');
          if (responseText) {
            mappedMessages.push({
              id: `${qId}-a`,
              content: responseText,
              isUser: false,
              timestamp: getTimestampFrom(q, 'updatedAt', 'createdAt', 'created_at')
            });
          }
        });
      } else if (Array.isArray(serverChat?.messages) && (serverChat.messages as unknown[]).length > 0) {
        (serverChat.messages as unknown[]).forEach((m: unknown, i: number) => {
          const id = getStringField(m, 'id', '_id') ?? `m-${serverChat._id ?? sessionId}-${i}`;
          const content = getStringField(m, 'content', 'text', 'body') ?? '';
          const isUser = getBooleanField(m, 'isUser') ?? ((getStringField(m, 'role') === 'user') ? true : false);
          const timestamp = getTimestampFrom(m, 'timestamp', 'createdAt');
          mappedMessages.push({ id, content, isUser, timestamp });
        });
      }

      const finalMessages = mappedMessages.length > 0
        ? mappedMessages
        : (isMessageArray(serverChat?.messages) ? serverChat.messages : []);

      const normalized: ChatSession = {
        id: getStringField(serverChat, '_id', 'id') ?? sessionId,
        title: serverChat?.title ?? 'Chat',
        messages: finalMessages,
        createdAt: serverChat?.createdAt ?? new Date().toISOString(),
        lastActive: serverChat?.updatedAt ?? serverChat?.lastActive ?? new Date().toISOString()
      };

      prependOrUpdateSession(normalized);
      setCurrentSessionId(normalized.id);
    } catch (err) {
      console.error('[handleSelectSession] error fetching chat by id', err);
      const fallback = chatSessions.find((s) => s.id === sessionId);
      if (fallback) setCurrentSessionId(fallback.id);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/chat/${sessionId}`, { method: 'DELETE', headers: authHeaders() });
      if (res.ok) {
        setChatSessions((prev) => prev.filter((s) => s.id !== sessionId));
        if (currentSessionId === sessionId && chatSessions.length > 1) setCurrentSessionId(chatSessions[0].id);
      } else {
        setChatSessions((prev) => prev.filter((s) => s.id !== sessionId));
        console.warn('Delete session backend returned', res.status);
      }
    } catch (err: unknown) {
      setChatSessions((prev) => prev.filter((s) => s.id !== sessionId));
      console.error('Delete session error', err);
    }
  };

  const handleSendMessage = async (content: string) => {
    let sessionId = currentSessionId;
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      isUser: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

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

    if (!sessionId) {
      sessionId = createLocalChat('New Chat');
    }

    updateSessionMessages(sessionId, (prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const payload = { chatId: sessionId, prompt: content, model: selectedModel };
      const res = await fetch(`${API_BASE}/api/query`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });

      let data: QueryResponse | null = null;
      try { data = (await res.json()) as QueryResponse; } catch { data = null; }

      if (res.status === 202 || data?.status === 'pending') {
        const placeholderId = `ai-${data?.queryId || Date.now().toString()}`;
        const placeholderMsg: Message = {
          id: placeholderId,
          content: 'Thinking...',
          isUser: false,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        updateSessionMessages(sessionId, (prev) => [...prev, placeholderMsg]);

        if (data?.chatId) {
          prependOrUpdateSession({ id: data.chatId, title: content.slice(0, 50), messages: [...(getSessionMessagesCopy(sessionId, '', '') || []), userMessage, placeholderMsg] });
          setCurrentSessionId(data.chatId);
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
          prependOrUpdateSession({ id: data.chatId, title: content.slice(0, 50), messages: [...(getSessionMessagesCopy(sessionId, '', '') || []), userMessage, aiMessage] });
          setCurrentSessionId(data.chatId);
        }
        return;
      }

      let errBody: unknown = null;
      try { errBody = await res.json(); } catch { errBody = { message: res.statusText }; }
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

  const handleClearAllHistory = async () => {
    try {
      await fetch(`${API_BASE}/api/chat`, { method: 'DELETE', headers: authHeaders() }).catch(() => null);
    } catch (e: unknown) {
      console.error('Clear history network error', e);
    }
    setChatSessions([]);
    setCurrentSessionId('');
  };

  const handleDatabaseImport = () => setShowDatabaseDialog(true);

  return (
    <div className={styles.root}>
      <div className={styles.sidebar}>
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

      <div className={styles.mainColumn}>
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
