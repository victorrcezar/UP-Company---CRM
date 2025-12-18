import React, { useRef, useState, useEffect } from 'react';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, List, Type, Heading1, Heading2, Eraser, ChevronDown, Palette } from 'lucide-react';

interface RichTextEditorProps {
    initialValue: string;
    onChange: (html: string) => void;
    onEnter?: () => void;
    placeholder?: string;
    className?: string;
    autoFocus?: boolean;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ initialValue, onChange, onEnter, placeholder, className, autoFocus }) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const [isEmpty, setIsEmpty] = useState(!initialValue);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [showFontPicker, setShowFontPicker] = useState(false);

    useEffect(() => {
        if (editorRef.current) {
            if (editorRef.current.innerHTML !== initialValue) {
                editorRef.current.innerHTML = initialValue;
            }
            setIsEmpty(!editorRef.current.textContent?.trim());
            
            if (autoFocus) {
                setTimeout(() => {
                    if (editorRef.current) {
                        editorRef.current.focus();
                        const range = document.createRange();
                        range.selectNodeContents(editorRef.current);
                        range.collapse(false);
                        const sel = window.getSelection();
                        sel?.removeAllRanges();
                        sel?.addRange(range);
                    }
                }, 50);
            }
        }
    }, []);

    const handleInput = () => {
        if (editorRef.current) {
            const html = editorRef.current.innerHTML;
            const text = editorRef.current.textContent || '';
            setIsEmpty(!text.trim());
            onChange(html);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey && onEnter) {
            e.preventDefault();
            onEnter();
        }
    };

    const execCommand = (command: string, value: string | undefined = undefined) => {
        document.execCommand(command, false, value);
        editorRef.current?.focus();
        setShowColorPicker(false);
        setShowFontPicker(false);
        handleInput();
    };

    const PRESET_COLORS = [
        '#000000', '#EF4444', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#6B7280'
    ];

    const PRESET_FONTS = [
        { name: 'Padrão', value: 'Inter, sans-serif' },
        { name: 'Serif', value: 'Georgia, serif' },
        { name: 'Monospace', value: 'monospace' },
        { name: 'Cursive', value: 'cursive' }
    ];

    const ToolbarButton = ({ onClick, icon: Icon, title, active = false }: any) => (
        <button 
            onClick={(e) => { e.preventDefault(); onClick(e); }}
            className={`p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${active ? 'bg-gray-200 dark:bg-gray-600 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
            title={title}
        >
            <Icon size={16} strokeWidth={2.5} />
        </button>
    );

    return (
        <div className={`flex flex-col border border-gray-200 dark:border-gray-600 rounded-xl overflow-visible bg-white dark:bg-up-deep focus-within:border-up-accent focus-within:ring-1 focus-within:ring-up-accent/20 transition-all ${className}`}>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-up-dark/30">
                
                <div className="flex items-center gap-0.5 border-r border-gray-300 dark:border-gray-600 pr-2 mr-1">
                     <ToolbarButton onClick={() => execCommand('formatBlock', 'H1')} icon={Heading1} title="Título 1" />
                     <ToolbarButton onClick={() => execCommand('formatBlock', 'H2')} icon={Heading2} title="Título 2" />
                </div>

                <div className="flex items-center gap-0.5 border-r border-gray-300 dark:border-gray-600 pr-2 mr-1">
                    <ToolbarButton onClick={() => execCommand('bold')} icon={Bold} title="Negrito (Ctrl+B)" />
                    <ToolbarButton onClick={() => execCommand('italic')} icon={Italic} title="Itálico (Ctrl+I)" />
                    <ToolbarButton onClick={() => execCommand('underline')} icon={Underline} title="Sublinhado (Ctrl+U)" />
                </div>
                
                <div className="flex items-center gap-0.5 border-r border-gray-300 dark:border-gray-600 pr-2 mr-1 hidden sm:flex">
                    <ToolbarButton onClick={() => execCommand('justifyLeft')} icon={AlignLeft} title="Alinhar à Esquerda" />
                    <ToolbarButton onClick={() => execCommand('justifyCenter')} icon={AlignCenter} title="Centralizar" />
                    <ToolbarButton onClick={() => execCommand('justifyRight')} icon={AlignRight} title="Alinhar à Direita" />
                </div>

                <div className="flex items-center gap-1 relative">
                    {/* Font Family Dropdown */}
                    <div className="relative">
                        <button 
                            onClick={() => setShowFontPicker(!showFontPicker)}
                            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 flex items-center gap-1 text-xs font-medium w-20 justify-between border border-transparent hover:border-gray-200"
                            title="Fonte"
                        >
                            <Type size={16} />
                            <ChevronDown size={10} />
                        </button>
                        {showFontPicker && (
                            <div className="absolute top-full left-0 mt-1 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-30 p-1">
                                {PRESET_FONTS.map((font) => (
                                    <button
                                        key={font.name}
                                        onClick={() => execCommand('fontName', font.value)}
                                        className="w-full text-left px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-xs text-gray-700 dark:text-gray-200"
                                        style={{ fontFamily: font.value }}
                                    >
                                        {font.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Color Picker Dropdown */}
                    <div className="relative">
                         <ToolbarButton onClick={() => setShowColorPicker(!showColorPicker)} icon={Palette} title="Cor do Texto" />
                         {showColorPicker && (
                             <div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-30 grid grid-cols-4 gap-2 w-32">
                                 {PRESET_COLORS.map(color => (
                                     <button
                                         key={color}
                                         onClick={() => execCommand('foreColor', color)}
                                         className="w-6 h-6 rounded-full border border-gray-200 shadow-sm hover:scale-110 transition-transform"
                                         style={{ backgroundColor: color }}
                                     />
                                 ))}
                                 <label className="w-6 h-6 rounded-full border border-gray-200 shadow-sm hover:scale-110 transition-transform bg-gradient-to-br from-red-500 via-green-500 to-blue-500 cursor-pointer flex items-center justify-center relative overflow-hidden">
                                     <input 
                                        type="color" 
                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                                        onChange={(e) => execCommand('foreColor', e.target.value)}
                                     />
                                 </label>
                             </div>
                         )}
                    </div>
                </div>

                <div className="flex-1"></div>

                {/* Utils */}
                <div className="flex items-center gap-0.5 pl-2 border-l border-gray-300 dark:border-gray-600">
                    <ToolbarButton onClick={() => execCommand('insertUnorderedList')} icon={List} title="Lista" />
                    <ToolbarButton onClick={() => execCommand('removeFormat')} icon={Eraser} title="Limpar Formatação" />
                </div>
            </div>
            
            {/* Editor Area */}
            <div className="relative flex-1">
                {isEmpty && (
                    <div className="absolute top-3 left-3 text-gray-400 pointer-events-none text-sm font-light italic">
                        {placeholder || 'Digite aqui...'}
                    </div>
                )}
                <div
                    ref={editorRef}
                    contentEditable
                    onInput={handleInput}
                    onKeyDown={handleKeyDown}
                    className="w-full h-full min-h-[100px] p-4 text-sm outline-none text-gray-700 dark:text-gray-200 overflow-y-auto max-h-[300px] prose prose-sm dark:prose-invert max-w-none leading-relaxed"
                    style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                />
            </div>
        </div>
    );
};

export default RichTextEditor;