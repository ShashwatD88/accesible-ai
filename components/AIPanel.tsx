"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";

export default function AIPanel() {
  const { showAIPanel, setShowAIPanel, chatMessages, addChatMessage, setIntent } = useAppStore();
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages, showAIPanel]);

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMsg = { role: "user" as const, text: inputText };
    addChatMessage(userMsg);
    setInputText("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...chatMessages, userMsg] })
      });
      const data = await res.json();
      
      if (data.text) {
        addChatMessage({ role: "model", text: data.text });
      }
      
      if (data.action) {
        // Trigger map intent silently behind the scenes
        console.log("🤖 Chat triggered action:", data.action);
        setIntent(data.action);
      }
    } catch (err) {
      addChatMessage({ role: "model", text: "Oops, something went wrong!" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {showAIPanel && (
        <motion.div
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed top-0 right-0 h-full w-[400px] z-50 p-4 shadow-2xl flex flex-col glass border-l border-white/20 bg-black/40 backdrop-blur-xl"
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-2xl">🤖</span> AI Assistant
            </h2>
            <button 
              onClick={() => setShowAIPanel(false)}
              className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Chat Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar pb-4">
            {chatMessages.map((msg, i) => (
              <div 
                key={i} 
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div 
                  className={`max-w-[85%] rounded-2xl p-3 text-sm ${
                    msg.role === "user" 
                      ? "bg-blue-600 text-white rounded-br-sm" 
                      : "bg-white/10 text-gray-200 rounded-bl-sm border border-white/10"
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/10 text-gray-200 rounded-2xl rounded-bl-sm p-3 px-4 border border-white/10">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="pt-4 border-t border-white/10 flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask me anything or plan a trip..."
              className="flex-1 bg-white/10 text-white border border-white/20 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:bg-white/20 transition-all placeholder:text-gray-400"
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !inputText.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 rounded-xl font-bold transition-all flex items-center justify-center min-w-[50px]"
            >
              ➤
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
