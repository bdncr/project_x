"use client";

import { useEffect, useRef } from "react";
import { Icon } from "../../Icon";

type TextBlockEditorProps = { html: string; onChange: (html: string) => void };

/** A lightweight contentEditable rich-text block — Bold/Italic/Underline/alignment,
 * matching the core of the reference editor's text toolbar without pulling in a full
 * WYSIWYG library. Content is sanitized on save (see lib/project-editor.ts).
 *
 * The div's content is set imperatively exactly once on mount and never fed back in
 * via React afterwards — contentEditable driven by a React-controlled value (e.g.
 * dangerouslySetInnerHTML tied to state) resets the cursor to the start of the node on
 * every keystroke once the fiber re-renders, which scrambles fast typing into reversed
 * fragments. Typing out through onInput and up to parent state is one-way only. */
export function TextBlockEditor({ html, onChange }: TextBlockEditorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);

  useEffect(() => {
    if (mounted.current || !ref.current) return;
    mounted.current = true;
    ref.current.innerHTML = html;
  }, [html]);

  function exec(command: string) {
    ref.current?.focus();
    document.execCommand(command);
    onChange(ref.current?.innerHTML ?? "");
  }

  return <div className="text-block-editor">
    <div className="text-block-toolbar">
      <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("bold")} aria-label="Тод"><b>B</b></button>
      <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("italic")} aria-label="Налуу"><i>I</i></button>
      <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("underline")} aria-label="Доогуур зураас"><u>U</u></button>
      <span className="text-block-divider" />
      <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("justifyLeft")} aria-label="Зүүн тийш"><Icon name="alignLeft" /></button>
      <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("justifyCenter")} aria-label="Голлуулах"><Icon name="alignCenter" /></button>
      <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("justifyRight")} aria-label="Баруун тийш"><Icon name="alignRight" /></button>
    </div>
    <div
      ref={ref}
      className="text-block-content"
      contentEditable
      suppressContentEditableWarning
      onInput={(event) => onChange((event.target as HTMLDivElement).innerHTML)}
      data-placeholder="Текстээ энд бичнэ үү…"
    />
  </div>;
}
