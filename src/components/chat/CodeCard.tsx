'use client';

import React, { useEffect, useRef, useState } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-sql';
import 'prismjs/themes/prism-tomorrow.css';

import { Copy, Check } from 'lucide-react';
import styles from './CodeCard.module.css';
import { cn } from '@/lib/utils';

export function CodeCard({ code, lang }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLElement | null>(null);

  const displayLang = lang && lang.trim() ? lang.trim() : 'bash';
  const languageClass = `language-${displayLang}`;

  useEffect(() => {
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
    <div className={styles.card}>
      <div className={styles.header}>
        {displayLang}
      </div>

      <div className={styles.copyButton}>
        <button
          onClick={handleCopy}
          aria-label="Copy code"
          title={copied ? 'Copied' : 'Copy code'}
          className={styles.copyButton}
        >
          {copied ? <Check className={styles.icon} /> : <Copy className={styles.icon} />}
          <span className={styles.srOnly}>{copied ? 'Copied' : 'Copy code'}</span>
        </button>
      </div>

      <pre className={styles.pre}>
        <code
          ref={codeRef as React.RefObject<HTMLElement>}
          className={cn(languageClass, styles.code)}
        >
          {code.replace(/\n$/, '')}
        </code>
      </pre>
    </div>
  );
}
