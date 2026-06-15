import React, { useState, useRef } from "react";
import { Send, FileText, X, Copy, Download, Eye, Terminal, Loader2 } from "lucide-react";

export default function MobileDevChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("Idle"); // Idle, Running Code, Searching Web, Thinking...
  const [dailyRemaining, setDailyRemaining] = useState(250);
  const fileInputRef = useRef(null);

  // Handle local mobile file processing
  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setFile({
        name: uploadedFile.name,
        content: event.target.result,
      });
    };
    reader.readAsText(uploadedFile);
  };

  const sendMessage = async () => {
    if (!input.trim() && !file) return;

    const userMessage = {
      role: "user",
      text: input,
      fileName: file?.name || null,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setStatus("Running Code..."); // Compound default action fallback hint

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          fileContent: file?.content || null,
          fileName: file?.name || null,
        }),
      });

      const data = await res.json();
      
      if (data.error) throw new Error(data.error);

      setMessages((prev) => [...prev, { role: "assistant", text: data.text }]);
      if (data.remaining) setDailyRemaining(data.remaining);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", text: `Error: ${err.message}` }]);
    } finally {
      setLoading(false);
      setStatus("Idle");
      setFile(null); // Clear active upload
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-neutral-950 text-neutral-100 font-sans border-x border-neutral-800">
      
      {/* Dynamic Header */}
      <header className="p-4 bg-neutral-900 border-b border-neutral-800 flex justify-between items-center sticky top-0 z-50">
        <div>
          <h1 className="text-base font-bold text-emerald-400 flex items-center gap-1.5">
            ⚡ groq/compound
          </h1>
          <p className="text-xs text-neutral-400">⚡ Code Interpreter Active</p>
        </div>
        <div className="text-right">
          <span className="text-[10px] uppercase tracking-wider bg-neutral-800 px-2 py-0.5 rounded text-neutral-400">
            {dailyRemaining} / 250 left
          </span>
        </div>
      </header>

      {/* Live Tool Execution Ticker */}
      {loading && (
        <div className="bg-emerald-950/40 border-b border-emerald-900/50 text-emerald-400 text-xs px-4 py-2 flex items-center gap-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
          <Terminal className="w-3.5 h-3.5" />
          <span>{status}</span>
        </div>
      )}

      {/* Chat Messages Section */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-none">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
            
            {/* User Message Capsule */}
            {msg.role === "user" ? (
              <div className="bg-neutral-800 text-white px-3.5 py-2.5 rounded-2xl rounded-tr-none text-sm max-w-[85%] shadow-md">
                {msg.fileName && (
                  <div className="flex items-center gap-1.5 text-xs bg-neutral-900 text-neutral-300 p-1.5 rounded-md mb-1.5 border border-neutral-700">
                    <FileText className="w-3 h-3 text-emerald-400" />
                    <span className="truncate max-w-[120px]">{msg.fileName}</span>
                  </div>
                )}
                <p className="whitespace-pre-wrap">{msg.text}</p>
              </div>
            ) : (
              /* Assistant Response Component */
              <div className="w-full text-sm text-neutral-200 bg-neutral-900/50 p-3 rounded-2xl border border-neutral-800 space-y-3">
                <CodeBlockHandler content={msg.text} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Mobile Input Tray */}
      <footer className="p-3 bg-neutral-900/80 backdrop-blur-md border-t border-neutral-800 space-y-2 sticky bottom-0">
        
        {/* Attachment Pill View */}
        {file && (
          <div className="flex items-center justify-between bg-neutral-800 text-xs text-neutral-200 px-3 py-1.5 rounded-lg border border-neutral-700 animate-fade-in">
            <div className="flex items-center gap-1.5 truncate">
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span className="truncate font-mono">{file.name}</span>
            </div>
            <button onClick={() => setFile(null)} className="p-0.5 hover:bg-neutral-700 rounded">
              <X className="w-3.5 h-3.5 text-neutral-400" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* File Picker Trigger */}
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-3 bg-neutral-800 hover:bg-neutral-700 rounded-xl border border-neutral-700 transition"
          >
            <FileText className="w-5 h-5 text-neutral-300" />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            accept=".js,.jsx,.ts,.tsx,.css,.html,.py,.json"
          />

          {/* Core Input Field */}
          <div className="flex-1 flex items-center bg-neutral-800 rounded-xl px-3 border border-neutral-700 focus-within:border-emerald-500 transition">
            <input
              type="text"
              placeholder="Ask compound to debug or code..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              className="w-full py-3 bg-transparent text-sm text-white focus:outline-none placeholder-neutral-500"
            />
          </div>

          {/* Execution Send Trigger */}
          <button 
            onClick={sendMessage}
            disabled={loading}
            className="p-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 rounded-xl transition shadow-lg shadow-emerald-950"
          >
            <Send className="w-5 h-5 text-neutral-950" />
          </button>
        </div>
      </footer>
    </div>
  );
}

/* 🗜️ Shrink Code Component 
  Handles inline code parsing, forces tight border sizing, prevents full-screen page scroll overflows,
  and packages instant Copy, Download, and Preview handlers directly above code text.
*/
function CodeBlockHandler({ content }) {
  // Simple regex to grab markdown blocks safely
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-2">
      {parts.map((part, index) => {
        if (part.startsWith("```")) {
          const match = part.match(/```(\w*)\n([\s\S]*?)```/);
          const lang = match ? match[1] : "code";
          const rawCode = match ? match[2] : part;

          const copyToClipboard = () => navigator.clipboard.writeText(rawCode);
          const downloadCode = () => {
            const blob = new Blob([rawCode], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `output.${lang === "javascript" ? "js" : lang || "txt"}`;
            a.click();
          };

          return (
            <div key={index} className="border border-neutral-800 bg-black rounded-lg overflow-hidden my-2">
              {/* Context Code Toolbar */}
              <div className="flex justify-between items-center bg-neutral-900 px-3 py-1.5 border-b border-neutral-800 text-[11px] font-mono text-neutral-400">
                <span>{lang || "code"}</span>
                <div className="flex items-center gap-3">
                  <button onClick={copyToClipboard} className="flex items-center gap-1 hover:text-white transition">
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                  <button onClick={downloadCode} className="flex items-center gap-1 hover:text-white transition">
                    <Download className="w-3 h-3" /> Save
                  </button>
                  <button onClick={() => alert("Previewing is restricted to HTML/CSS snippets locally.")} className="flex items-center gap-1 hover:text-white transition">
                    <Eye className="w-3 h-3" /> Live
                  </button>
                </div>
              </div>
              {/* Shrunk code box with independent x/y axes scroll wrapper */}
              <div className="max-h-48 overflow-auto p-3 font-mono text-xs text-emerald-400 bg-neutral-950 scrollbar-thin">
                <pre className="whitespace-pre">{rawCode}</pre>
              </div>
            </div>
          );
        }
        return <p key={index} className="whitespace-pre-wrap leading-relaxed">{part}</p>;
      })}
    </div>
  );
}
