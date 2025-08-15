"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extensions";
import HardBreak from "@tiptap/extension-hard-break";
import Underline from "@tiptap/extension-underline";
import Superscript from "@tiptap/extension-superscript";
import Subscript from "@tiptap/extension-subscript";
import { useEffect } from "react";
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
