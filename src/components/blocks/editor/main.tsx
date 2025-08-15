"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extensions";
import HardBreak from "@tiptap/extension-hard-break";
import Underline from "@tiptap/extension-underline";
import Superscript from "@tiptap/extension-superscript";
import Subscript from "@tiptap/extension-subscript";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface MDEditorProps {
  content?: string;
  onChange?: (html: string) => void;
  className?: string;
  onReady?: (editor: ReturnType<typeof useEditor>) => void;
  readOnly?: boolean;
}
const MDEditor = ({
  content = undefined,
  onChange,
  className,
  onReady,
  readOnly = false,
}: MDEditorProps) => {
  // Stable ref to editor instance for handlers declared in editorProps
  const editorRef = useRef<any>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
      }),
      Underline,
      Placeholder.configure({
        placeholder: "Start writing your chapter...",
      }),
      HardBreak,
      Superscript,
      Subscript,
    ],
    content,
    editable: !readOnly,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none focus:outline-none p-4 h-full pb-28",
      },
      // Custom paste handler: treat single newlines as hard breaks, double+ as paragraph breaks.
      handlePaste(view, event) {
        const plain = event.clipboardData?.getData("text/plain");
        const html = event.clipboardData?.getData("text/html");
        if (!plain || html || !/\n/.test(plain)) return false; // let default behavior handle

        const inst = editorRef.current || (view as any).props?.editor;
        if (!inst) return false; // editor not ready; fallback to default

        event.preventDefault();
        const escape = (s: string) =>
          s
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");

        const paragraphs = plain.replace(/\r/g, "").split(/\n{2,}/);
        const htmlToInsert = paragraphs
          .map((para) => {
            const lines = para.split(/\n/).map((l) => escape(l));
            return `<p>${lines.join("<br />")}</p>`;
          })
          .join("");
        inst.chain().focus().insertContent(htmlToInsert).run();
        return true;
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    immediatelyRender: false,
    onCreate: ({ editor }) => {
      editorRef.current = editor; // store for paste handler
      onReady?.(editor as any);
    },
  });

  // If the initial content changes (different chapter), update editor.
  useEffect(() => {
    if (editor && content !== undefined && content !== editor.getHTML()) {
      editor.commands.setContent(content || null, { emitUpdate: false });
    }
  }, [content, editor]);

  // Toggle editable state when readOnly changes
  useEffect(() => {
    if (editor) editor.setEditable(!readOnly);
  }, [readOnly, editor]);

  useEffect(() => {
    if (editor && onReady) onReady(editor as any);
  }, [editor, onReady]);

  return (
    <EditorContent editor={editor} className={cn(className, "md-editor")} />
  );
};

export default MDEditor;
