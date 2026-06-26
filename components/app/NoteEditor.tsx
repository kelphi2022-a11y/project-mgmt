"use client";
// app/components/app/NoteEditor.tsx
import React, { useEffect } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Button } from '@/components/ui/button';

interface NoteEditorProps {
  initialContent?: string;
  onChange: (content: string) => void;
  onSubmit: () => void;
  loading?: boolean;
}

export default function NoteEditor({ initialContent = '', onChange, onSubmit, loading }: NoteEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: initialContent,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Keep editor in sync if initialContent changes
  useEffect(() => {
    if (editor && editor.getHTML() !== initialContent) {
      editor.commands.setContent(initialContent);
    }
  }, [initialContent, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="space-y-2">
      <EditorContent editor={editor} className="border rounded p-2 min-h-[150px]" />
      <Button onClick={onSubmit} disabled={loading}>
        {loading ? 'Saving...' : 'Save'}
      </Button>
    </div>
  );
}
