import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Code2, Play, CheckCircle2, Terminal } from 'lucide-react';

interface CodeEditorBlockProps {
    data: {
        instructions?: string;
        initialCode?: string;
        expectedOutput?: string;
        compact?: boolean;
    };
    onComplete?: (isCorrect: boolean) => void;
    isAdmin?: boolean;
}

const CodeEditorBlock: React.FC<CodeEditorBlockProps> = ({ data, onComplete, isAdmin }) => {
    const defaultLogic = data.initialCode || 'function greet(name) {\n  return "Hello, " + name;\n}\n\nconsole.log(greet("World"));';
    const [code, setCode] = useState(defaultLogic);
    const [output, setOutput] = useState<string | null>(null);
    const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');

    const runCode = () => {
        setStatus('running');
        setOutput(null);

        // Simulate network delay / compiling time
        setTimeout(() => {
            try {
                // VERY BASIC SANDBOX: Capture console.log
                // In a real app, do NOT use raw eval without WebWorkers or a secure iframe/backend execution environment.
                const mockOutput: string[] = [];
                const originalLog = console.log;
                console.log = (...args) => {
                    mockOutput.push(args.join(' '));
                };

                // eslint-disable-next-line no-eval
                eval(code);

                console.log = originalLog;
                const finalOutput = mockOutput.length > 0 ? mockOutput.join('\n') : 'Execution finished (no output)';
                setOutput(finalOutput);

                // Simple validation - let's say we expect "Hello, World!"
                const expected = data.expectedOutput || 'Hello, World';
                if (finalOutput.includes(expected)) {
                    setStatus('success');
                    onComplete?.(true);
                } else {
                    setStatus('error');
                }
            } catch (err: any) {
                setOutput(`Error: ${err.message}`);
                setStatus('error');
            }
        }, 600);
    };

    return (
        <div className={`w-full h-full flex flex-col overflow-hidden ${data.compact ? 'p-2 gap-2' : 'p-4 gap-4'} bg-[#1e1e1e] border-2 border-[#333333] rounded-2xl font-mono`}>

            {/* Header */}
            <div className="flex items-center justify-between text-[#858585] border-b border-[#333333] pb-2">
                <div className="flex items-center gap-2">
                    <Code2 size={16} className="text-[#569cd6]" />
                    <span className="text-xs font-bold uppercase tracking-widest text-[#cccccc]">Code Editor</span>
                </div>
                {isAdmin && <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded">Admin Eval Enabled</span>}
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col min-h-0 relative">

                {/* Instructions */}
                <div className="bg-[#252526] p-3 text-[#cccccc] text-xs border-l-2 border-[#569cd6] mb-2 rounded-r">
                    {data.instructions || "Write a function that outputs 'Hello, World' to the console in JavaScript."}
                </div>

                {/* Editor Area */}
                <textarea
                    value={code}
                    onChange={(e) => { setCode(e.target.value); setStatus('idle'); }}
                    spellCheck="false"
                    className="flex-1 w-full bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm leading-relaxed p-2 resize-none outline-none custom-scrollbar"
                    style={{ tabSize: 2 }}
                />

                {/* Run Button overlay */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={runCode}
                    disabled={status === 'running'}
                    className="absolute bottom-4 right-4 bg-[#0e639c] hover:bg-[#1177bb] text-white px-4 py-2 rounded shadow-lg transition-colors flex items-center gap-2 font-sans font-bold text-sm"
                >
                    {status === 'running' ? <Terminal className="animate-pulse" size={16} /> : <Play size={16} />}
                    {status === 'running' ? 'Running...' : 'Run Code'}
                </motion.button>
            </div>

            {/* Output / Console area */}
            {output !== null && (
                <div className={`mt-auto shrink-0 border-t-2 bg-[#1e1e1e] p-3 max-h-32 overflow-y-auto custom-scrollbar 
                    ${status === 'success' ? 'border-[#4CAF50]' : status === 'error' ? 'border-[#F44336]' : 'border-[#333]'}
                `}>
                    <div className="flex items-center gap-2 mb-1">
                        {status === 'success' ? <CheckCircle2 size={12} className="text-[#4CAF50]" /> : <Terminal size={12} className="text-[#858585]" />}
                        <span className={`text-[10px] uppercase font-bold tracking-wider ${status === 'success' ? 'text-[#4CAF50]' : 'text-[#858585]'}`}>
                            {status === 'success' ? 'Tests Passed' : 'Console Output'}
                        </span>
                    </div>
                    <pre className={`text-xs whitespace-pre-wrap font-mono ${status === 'error' ? 'text-[#F44336]' : 'text-[#d4d4d4]'}`}>
                        {output}
                    </pre>
                </div>
            )}
        </div>
    );
};

export default CodeEditorBlock;
