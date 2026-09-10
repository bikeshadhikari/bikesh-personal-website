'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Small formatting editor for post bodies. It writes plain HTML into a hidden
 * textarea, and every value is re-sanitised on the server before it is stored.
 */
export default function Editor({
  name, initialHtml, label,
}: { name: string; initialHtml: string; label: string }) {
  const surface = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState(initialHtml);
  const [showSource, setShowSource] = useState(false);

  useEffect(() => {
    if (surface.current && surface.current.innerHTML !== initialHtml) {
      surface.current.innerHTML = initialHtml;
    }
    // Only on mount: after that the element owns its own content.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sync = () => {
    if (surface.current) setHtml(surface.current.innerHTML);
  };

  const exec = (command: string, value?: string) => {
    surface.current?.focus();
    document.execCommand(command, false, value);
    sync();
  };

  const toggleSource = () => {
    if (!showSource) {
      sync();
    } else if (surface.current) {
      surface.current.innerHTML = html;
    }
    setShowSource((v) => !v);
  };

  /** Strip Word and Google Docs markup on paste. */
  const onPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text/html');
    if (!pasted) return;
    e.preventDefault();
    const clean = pasted
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
      .replace(/\sstyle="[^"]*"/gi, '')
      .replace(/\sclass="[^"]*"/gi, '')
      .replace(/<\/?(span|font|o:p|meta|link)[^>]*>/gi, '');
    document.execCommand('insertHTML', false, clean);
    sync();
  };

  return (
    <div className="editor">
      <div className="editor-toolbar" role="toolbar" aria-label="Formatting">
        <button type="button" onClick={() => exec('bold')} title="Bold"><strong>B</strong></button>
        <button type="button" onClick={() => exec('italic')} title="Italic"><em>I</em></button>
        <button type="button" onClick={() => exec('formatBlock', 'h2')} title="Heading">H2</button>
        <button type="button" onClick={() => exec('formatBlock', 'h3')} title="Sub-heading">H3</button>
        <button type="button" onClick={() => exec('formatBlock', 'p')} title="Normal text">Text</button>
        <button type="button" onClick={() => exec('insertUnorderedList')} title="Bullet list">• List</button>
        <button type="button" onClick={() => exec('insertOrderedList')} title="Numbered list">1. List</button>
        <button type="button" onClick={() => exec('formatBlock', 'blockquote')} title="Quote">&ldquo;</button>
        <button
          type="button"
          title="Link"
          onClick={() => {
            const href = window.prompt('Link address (include https://)', 'https://');
            if (href) exec('createLink', href);
          }}
        >
          Link
        </button>
        <button type="button" onClick={() => exec('unlink')} title="Remove link">Unlink</button>
        <button
          type="button"
          className={showSource ? 'is-active' : undefined}
          onClick={toggleSource}
          title="Edit the HTML directly"
        >
          HTML
        </button>
      </div>

      <div
        ref={surface}
        className="editor-surface prose"
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label={label}
        hidden={showSource}
        onInput={sync}
        onBlur={sync}
        onPaste={onPaste}
      />

      {showSource && (
        <textarea
          className="editor-source"
          value={html}
          onChange={(e) => setHtml(e.target.value)}
          aria-label={`${label} HTML`}
        />
      )}

      <textarea name={name} value={html} readOnly hidden />
    </div>
  );
}
