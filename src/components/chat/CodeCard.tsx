'use client';

import React, { useEffect, useRef, useState } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-sql';
// import other languages you need...
import 'prismjs/themes/prism-tomorrow.css'; // or use a custom theme file

import { Copy, Check } from 'lucide-react';

export function CodeCard({ code, lang }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLElement | null>(null);

  const displayLang = lang && lang.trim() ? lang.trim() : 'bash';
  const languageClass = `language-${displayLang}`;

  useEffect(() => {
    // highlight the <code> element using Prism after render
    if (codeRef.current) {
      try {
        Prism.highlightElement(codeRef.current);
      } catch {
        // Prism might not know the language; still safe.
      }
    }
  }, [code, displayLang]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // fallback
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

  return (
    <div className="relative rounded-lg overflow-hidden my-2 shadow-sm border" style={{ background: '#0b1220' }}>
      {/* language header */}
      <div className="px-3 py-2 text-[13px] font-medium border-b" style={{ color: '#c9d1d9', background: 'rgba(255,255,255,0.02)' }}>
        {displayLang}
      </div>

      {/* copy button */}
      <div className="absolute top-2 right-2 z-20">
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
      </div>

      {/* code block */}
      <pre className="p-4 m-0 overflow-x-auto text-sm" style={{ background: 'transparent' }}>
        <code
          ref={codeRef as React.RefObject<HTMLElement>}
          className={languageClass + ' font-mono text-sm'}
          // Prism will inject <span class="token ..."> elements into this node
        >
          {code.replace(/\n$/, '')}
        </code>
      </pre>
    </div>
  );
}
