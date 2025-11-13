'use client';

import React, { useEffect, useRef, useState } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-sql';
import 'prismjs/themes/prism-tomorrow.css';

import { Copy, Check, Play } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://apiquerycraft.hubzero.in';

type SourceInfo = {
  sourceType?: 'file' | 'connection';
  fileId?: string;
  connectionKey?: string; // localStorage key for connection string
  connectionString?: string; // optional direct string override
};

type QueryResult = {
  source?: string;
  rows?: Record<string, unknown>[];
  columns?: string[];
  rowCount?: number;
  error?: string;
};

function tryParseJsonLike(objStr: string): Record<string, unknown> | unknown[] | null {
  // Heuristic attempt to convert JS-like object literals to JSON and parse.
  if (!objStr || typeof objStr !== 'string') return null;
  let s = objStr.trim();

  // Remove trailing semicolon
  if (s.endsWith(';')) s = s.slice(0, -1);

  // Some people paste surrounding parentheses: ( { ... } )
  if (s.startsWith('(') && s.endsWith(')')) s = s.slice(1, -1).trim();

  // If it already looks like JSON (starts with { or [ or "), try direct parse first
  try {
    if (s.startsWith('{') || s.startsWith('[') || s.startsWith('"') || s.startsWith("'")) {
      return JSON.parse(s);
    }
  } catch {
    // continue to heuristic transform
  }

  // Replace single-quoted strings with double-quoted strings (naive)
  s = s.replace(/'([^']*)'/g, (_m, p1) => {
    const escaped = p1.replace(/"/g, '\\"');
    return `"${escaped}"`;
  });

  // Quote unquoted keys: { a: 1, $or: [...] } -> { "a": 1, "$or": [...] }
  s = s.replace(/([{,]\s*)([A-Za-z0-9_$@-]+)\s*:/g, (_m, prefix, key) => {
    return `${prefix}"${key}":`;
  });

  // Try parse
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

/**
 * Extract collection name and filter string from common patterns such as:
 * - db.students.find({...})
 * - students.find({...})
 * - students.find({ ... }, { projection })
 *
 * Returns { collection?: string, filterStr?: string }
 */
function extractCollectionAndFilter(code: string): { collection?: string; filterStr?: string } {
  const trimmed = code.trim();

  // Pattern: db.COLLECTION.find(...)
  const dbFind = trimmed.match(/db\.([A-Za-z0-9_$]+)\.find\s*\(\s*([\s\S]*)\)\s*;?$/m);
  if (dbFind) {
    const col = dbFind[1];
    const inner = dbFind[2].trim();
    const firstObj = extractFirstObject(inner);
    if (firstObj) return { collection: col, filterStr: firstObj };
    return { collection: col, filterStr: inner.split(/\s*,\s*/)[0] };
  }

  // Pattern: COLLECTION.find(...)
  const simpleFind = trimmed.match(/^([A-Za-z0-9_$]+)\.find\s*\(\s*([\s\S]*)\)\s*;?$/m);
  if (simpleFind) {
    const col = simpleFind[1];
    const inner = simpleFind[2].trim();
    const firstObj = extractFirstObject(inner);
    if (firstObj) return { collection: col, filterStr: firstObj };
    return { collection: col, filterStr: inner.split(/\s*,\s*/)[0] };
  }

  // If user provided just an object literal or JSON, treat it as filter only (no collection)
  const maybeObj = trimmed;
  if (maybeObj.startsWith('{') || maybeObj.startsWith('[') || maybeObj.startsWith('(')) {
    const obj = extractFirstObject(maybeObj) || maybeObj;
    return { filterStr: obj };
  }

  return {};
}

/** Find the first balanced {...} substring and return it (including braces). */
function extractFirstObject(s: string): string | null {
  const start = s.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < s.length; i++) {
    const ch = s[i];
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    if (depth === 0) {
      return s.slice(start, i + 1);
    }
  }
  return null;
}

function extractErrorMessage(err: unknown): string {
  if (!err) return 'Unknown error';
  if (err instanceof Error) return err.message;
  try {
    return String(err);
  } catch {
    return 'Unknown error';
  }
}

export function CodeCard({
  code,
  lang,
  sourceInfo,
  authToken
}: {
  code: string;
  lang?: string;
  sourceInfo?: SourceInfo;
  authToken?: string | null;
}) {
  const [copied, setCopied] = useState<boolean>(false);
  const [running, setRunning] = useState<boolean>(false);
  const [results, setResults] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [maxRows] = useState<number>(200);
  const codeRef = useRef<HTMLElement | null>(null);

  const displayLang = lang && lang.trim() ? lang.trim() : 'bash';
  const languageClass = `language-${displayLang}`;

  useEffect(() => {
    if (codeRef.current) {
      try {
        Prism.highlightElement(codeRef.current);
      } catch {
        // ignore
      }
    }
  }, [code, displayLang]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } finally {
        textarea.remove();
      }
    }
  };

  const handleExecute = async () => {
    setResults(null);
    setError(null);

    const trimmed = code.trim();
    if (!trimmed) {
      setError('Query is empty');
      return;
    }

    // Simple destructive guard for SQL-like queries
    const blocked = /\b(drop|truncate|alter|delete|update|insert)\b/i;
    if (blocked.test(trimmed) && !(sourceInfo?.sourceType === 'file')) {
      setError('Query contains potentially destructive statements. Use a read-only connection or confirm in server settings.');
      return;
    }

    setRunning(true);
    try {
      const payload: Record<string, unknown> = {
        sourceType: sourceInfo?.sourceType || 'connection',
        maxRows
      };

      // File flow
      if (sourceInfo?.sourceType === 'file' && sourceInfo.fileId) {
        payload.fileId = sourceInfo.fileId;
        payload.query = code;
      } else {
        // Connection flow: get connection string
        const key = sourceInfo?.connectionKey || 'qc_conn_default';
        const cs = typeof window !== 'undefined'
          ? (sourceInfo?.connectionString || localStorage.getItem(key) || undefined)
          : sourceInfo?.connectionString;

        if (!cs || typeof cs !== 'string') {
          throw new Error('No data source available. Upload a file or save a connection string first.');
        }
        payload.connectionString = cs;

        // If Mongo connection -> construct structured mongo object
        if (cs.startsWith('mongodb://') || cs.startsWith('mongodb+srv://')) {
          const extracted = extractCollectionAndFilter(trimmed);
          let collection = extracted.collection;
          let filter: Record<string, unknown> = {};

          if (extracted.filterStr) {
            const parsed = tryParseJsonLike(extracted.filterStr);
            if (parsed !== null && (typeof parsed === 'object')) {
              // parsed can be array or object; for filter we expect object
              if (!Array.isArray(parsed)) filter = parsed as Record<string, unknown>;
            } else {
              try {
                const parsed2 = JSON.parse(extracted.filterStr);
                if (typeof parsed2 === 'object' && parsed2 !== null && !Array.isArray(parsed2)) {
                  filter = parsed2 as Record<string, unknown>;
                }
              } catch {
                // fallback empty filter
                filter = {};
              }
            }
          } else {
            const parsed = tryParseJsonLike(trimmed);
            if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
              filter = parsed as Record<string, unknown>;
            }
          }

          if (!collection) {
            const fallback = trimmed.match(/([A-Za-z0-9_$]+)\.find\s*\(/);
            if (fallback) collection = fallback[1];
          }

          payload.mongo = {
            collection: collection || 'default',
            filter,
            projection: undefined,
            limit: maxRows
          };
        } else {
          // SQL flow: send raw query string
          payload.query = code;
        }
      }

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const resp = await fetch(`${API_BASE}/api/db/execute`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      const j = await resp.json();
      if (!resp.ok) throw new Error(j?.error || j?.message || `Server responded with ${resp.status}`);
      setResults(j as QueryResult);
    } catch (err: unknown) {
      setError(extractErrorMessage(err));
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="relative rounded-lg overflow-hidden my-2 shadow-sm border" style={{ background: '#0b1220' }}>
      <div className="px-3 py-2 text-[13px] font-medium border-b" style={{ color: '#c9d1d9', background: 'rgba(255,255,255,0.02)' }}>
        {displayLang}
      </div>

      <div className="absolute top-2 right-2 z-20 flex gap-2">
        <button
          onClick={handleCopy}
          aria-label="Copy code"
          title={copied ? 'Copied' : 'Copy code'}
          className="inline-flex items-center gap-2 px-2 py-1 text-xs font-medium rounded-md hover:bg-white/5"
          style={{ color: '#c9d1d9', background: 'rgba(255,255,255,0.02)' }}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          <span className="sr-only">{copied ? 'Copied' : 'Copy code'}</span>
        </button>

        <button
          onClick={handleExecute}
          disabled={running}
          aria-label="Execute query"
          title="Execute query"
          className="inline-flex items-center gap-2 px-2 py-1 text-xs font-medium rounded-md hover:bg-white/5"
          style={{ color: '#c9d1d9', background: 'rgba(255,255,255,0.02)' }}
        >
          <Play className="h-4 w-4" />
          <span className="sr-only">{running ? 'Running...' : 'Execute'}</span>
        </button>
      </div>

      <pre className="p-4 m-0 overflow-x-auto text-sm" style={{ background: 'transparent' }}>
        <code
          ref={codeRef as React.RefObject<HTMLElement>}
          className={languageClass + ' font-mono text-sm'}
        >
          {code.replace(/\n$/, '')}
        </code>
      </pre>

      {/* Results / Errors */}
      <div className="p-3 border-t bg-white/3 text-sm">
        {running && <div className="text-xs text-muted-foreground">Executing query…</div>}
        {error && <div className="text-sm text-red-400">Error: {error}</div>}

        {results && !results.error && (
          <div>
            <div className="mb-2 text-xs text-muted-foreground">Source: {results.source || 'unknown'} — Rows: {results.rowCount ?? (results.rows?.length ?? 0)}</div>

            <div style={{ maxHeight: 320, overflow: 'auto' }}>
              <table className="w-full text-xs table-fixed">
                <thead>
                  <tr>
                    {(results.columns || (results.rows && results.rows[0] ? Object.keys(results.rows[0]) : [])).map((col: string) => (
                      <th key={col} className="text-left pr-2 pb-1 sticky top-0 bg-white/3" style={{ fontWeight: 600 }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(results.rows || []).map((row: Record<string, unknown>, i: number) => (
                    <tr key={i} className={i % 2 ? 'bg-white/2' : ''}>
                      {(results.columns || (row ? Object.keys(row) : [])).map((col: string) => (
                        <td key={col} className="pr-2 align-top break-words" style={{ maxWidth: 300 }}>
                          {row && row[col] !== undefined && row[col] !== null ? String(row[col]) : ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {results && results.error && <div className="text-sm text-red-400">Error: {results.error}</div>}
      </div>
    </div>
  );
}
