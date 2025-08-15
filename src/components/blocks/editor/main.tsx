"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extensions";
import HardBreak from "@tiptap/extension-hard-break";
import Underline from "@tiptap/extension-underline";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { marked } from "marked";

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
    ],
    content,
    editable: !readOnly,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none focus:outline-none p-4 h-full pb-28",
      },
      // Robust markdown paste: always try to treat plain text as markdown unless clipboard already supplies HTML tags.
      handlePaste(view, event) {
        const e = event as ClipboardEvent;
        const text = e.clipboardData?.getData("text/plain") ?? "";
        if (!text) return false;

        const htmlClipboard = e.clipboardData?.getData("text/html") ?? "";
        if (/<[a-z][\s\S]*>/i.test(htmlClipboard)) return false; // Let native rich HTML handling occur

        e.preventDefault();

        // Convert to HTML via marked (handles **bold**, *italic*, lists, etc.)
        // Use marked.parseInline for synchronous operation, or handle async properly
        const processMarkdown = async () => {
          let html: string;
          try {
            const result = await marked.parse(text);
            html = String(result);
          } catch (error) {
            // Fallback to plain text if markdown parsing fails
            view.dispatch(
              view.state.tr.insertText(
                text,
                view.state.selection.from,
                view.state.selection.to
              )
            );
            return;
          }

          // Improve spacing for pure text with blank lines but no markdown markers.
          const hasMarkdownSyntax = /[>*_`#~-]|\[(.+?)\]\((.+?)\)/.test(text);
          if (!hasMarkdownSyntax && /\n{2,}/.test(text)) {
            const paragraphs = text.replace(/\r\n?/g, "\n").split(/\n{2,}/);
            const escapeHtml = (s: string) =>
              s
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#39;");
            html = paragraphs
              .map((p) => {
                const lines = p.split(/\n/).map((l) => escapeHtml(l));
                const inner = lines.join("<br />");
                return `<p>${inner || "<br />"}</p>`;
              })
              .join("");
          }

          // Basic sanitization: strip script tags (ProseMirror further constrains schema)
          html = html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");

          const parser: any =
            view.someProp("clipboardParser") || view.someProp("domParser");
          if (parser) {
            const dom = new DOMParser().parseFromString(html, "text/html");
            let slice;
            if (typeof parser.parseSlice === "function") {
              slice = parser.parseSlice(dom.body, {
                preserveWhitespace: "full",
              });
            } else if (typeof parser.parse === "function") {
              const node = parser.parse(dom.body, {
                preserveWhitespace: "full",
              });
              slice = node.content;
            }
            if (slice) {
              const tr = view.state.tr.replaceSelection(slice).scrollIntoView();
              view.dispatch(tr);
              return;
            }
          }
          // Fallback plain text insertion
          view.dispatch(
            view.state.tr.insertText(
              text,
              view.state.selection.from,
              view.state.selection.to
            )
          );
        };

        // Execute the async markdown processing
        processMarkdown();
        return true;
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    immediatelyRender: false,
    onCreate: ({ editor }) => {
      onReady?.(editor as any);
    },
  });

  // If the initial content changes (different chapter), update editor.
  useEffect(() => {
    if (editor && content !== editor.getHTML() && content) {
      // Preprocess content to convert literal \n characters to <br> tags
      // This handles cases where newlines are stored as literal \n in HTML content
      let processedContent = content;

      // Convert literal newlines within paragraph tags to <br> tags
      processedContent = processedContent.replace(
        /(<p[^>]*>)([\s\S]*?)(<\/p>)/g,
        (match, openTag, innerContent, closeTag) => {
          const processedInner = innerContent.replace(/\n/g, "<br>");
          return openTag + processedInner + closeTag;
        }
      );

      // Also handle newlines that might be outside of paragraph tags
      processedContent = processedContent.replace(/\n/g, "<br>");

      editor.commands.setContent(processedContent || null, {
        emitUpdate: false,
      });
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
