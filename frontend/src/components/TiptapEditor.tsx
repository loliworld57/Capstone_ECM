"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Superscript from "@tiptap/extension-superscript";
import Subscript from "@tiptap/extension-subscript";

import { 
    Bold, 
    Italic, 
    Underline as UnderlineIcon, 
    List, 
    ListOrdered,
    Heading2, 
    Heading3,
    Highlighter, 
    Baseline, 
    Superscript as SuperIcon, 
    Subscript as SubIcon,
    RotateCcw
} from "lucide-react";
import { useEffect, useRef } from "react";

interface Props {
    content: string;
    onChange: (html: string) => void;
}

export default function TiptapEditor({
    content,
    onChange,
}: Props) {
    const textColorRef = useRef<HTMLInputElement>(null);
    const highlightColorRef = useRef<HTMLInputElement>(null);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                bulletList: { keepMarks: true, keepAttributes: false },
                orderedList: { keepMarks: true, keepAttributes: false },
            }),
            Underline,
            TextStyle,
            Color,
            Highlight.configure({ multicolor: true }),
            Superscript,
            Subscript,
        ],
        content,
        immediatelyRender: false,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content || "");
        }
    }, [content, editor]);

    if (!editor) return null;

    const currentTextColor = editor.getAttributes("textStyle").color || "#000000";
    const currentHighlightColor = editor.getAttributes("highlight").color || "#ffff00";

    const btnClass = (isActive: boolean) => 
        `p-2 rounded transition-colors duration-150 flex items-center justify-center ${
            isActive 
                ? "bg-sky-100 text-sky-700 hover:bg-sky-200" 
                : "text-slate-600 hover:bg-slate-200 hover:text-slate-800"
        }`;

    return (
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
            {/* Toolbar Panel */}
            <div className="flex flex-wrap items-center gap-1 p-2 border-b border-slate-100 bg-slate-50/80">
                
                {/* Structural Headings */}
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={btnClass(editor.isActive("heading", { level: 2 }))}
                    title="Heading 2"
                >
                    <Heading2 size={16} />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    className={btnClass(editor.isActive("heading", { level: 3 }))}
                    title="Heading 3"
                >
                    <Heading3 size={16} />
                </button>

                <div className="w-px h-5 bg-slate-200 mx-1" />

                {/* Inline Character Styles */}
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={btnClass(editor.isActive("bold"))}
                    title="Bold"
                >
                    <Bold size={16} />
                </button>

                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={btnClass(editor.isActive("italic"))}
                    title="Italic"
                >
                    <Italic size={16} />
                </button>

                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    className={btnClass(editor.isActive("underline"))}
                    title="Underline"
                >
                    <UnderlineIcon size={16} />
                </button>

                <div className="w-px h-5 bg-slate-200 mx-1" />

                {/* Lists */}
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={btnClass(editor.isActive("bulletList"))}
                    title="Bullet List"
                >
                    <List size={16} />
                </button>

                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={btnClass(editor.isActive("orderedList"))}
                    title="Numbered List"
                >
                    <ListOrdered size={16} />
                </button>

                <div className="w-px h-5 bg-slate-200 mx-1" />

                {/* Sub / Superscript */}
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleSuperscript().run()}
                    className={btnClass(editor.isActive("superscript"))}
                    title="Superscript"
                >
                    <SuperIcon size={16} />
                </button>

                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleSubscript().run()}
                    className={btnClass(editor.isActive("subscript"))}
                    title="Subscript"
                >
                    <SubIcon size={16} />
                </button>

                <div className="w-px h-5 bg-slate-200 mx-1" />

                {/* DYNAMIC TEXT COLOR PICKER */}
                <div className="relative flex items-center">
                    <input
                        type="color"
                        ref={textColorRef}
                        className="absolute inset-0 opacity-0 w-0 h-0 pointer-events-none"
                        value={currentTextColor}
                        onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
                    />
                    <button
                        type="button"
                        onClick={() => textColorRef.current?.click()}
                        className={btnClass(editor.isActive("textStyle"))}
                        title="Text Color"
                    >
                        <div className="flex flex-col items-center justify-center gap-0.5">
                            <Baseline size={16} />
                            <div 
                                className="w-4 h-0.5 rounded-full shadow-xs" 
                                style={{ backgroundColor: currentTextColor }} 
                            />
                        </div>
                    </button>
                </div>

                {/* DYNAMIC HIGHLIGHT COLOR PICKER */}
                <div className="relative flex items-center">
                    <input
                        type="color"
                        ref={highlightColorRef}
                        className="absolute inset-0 opacity-0 w-0 h-0 pointer-events-none"
                        value={currentHighlightColor}
                        onChange={(e) => editor.chain().focus().setHighlight({ color: e.target.value }).run()}
                    />
                    <button
                        type="button"
                        onClick={() => highlightColorRef.current?.click()}
                        className={btnClass(editor.isActive("highlight"))}
                        title="Highlight Color"
                    >
                        <div className="flex flex-col items-center justify-center gap-0.5">
                            <Highlighter size={16} />
                            <div 
                                className="w-4 h-0.5 rounded-full shadow-xs" 
                                style={{ backgroundColor: currentHighlightColor }} 
                            />
                        </div>
                    </button>
                </div>

                <div className="w-px h-5 bg-slate-200 mx-1" />

                {/* Clear Formatting Reset */}
                <button
                    type="button"
                    onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
                    className="p-2 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200"
                    title="Clear Formatting"
                >
                    <RotateCcw size={16} />
                </button>
            </div>

            {/* Content Workspace */}
            <EditorContent
                editor={editor}
                className="min-h-[350px] p-5 bg-white focus:outline-none max-w-none prose prose-slate
                           prose-headings:font-bold prose-h2:text-xl prose-h3:text-lg
                           prose-ul:list-disc prose-ol:list-decimal
                           [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:ml-2
                           [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:ml-2
                           [&_li]:list-item"
            />
        </div>
    );
}