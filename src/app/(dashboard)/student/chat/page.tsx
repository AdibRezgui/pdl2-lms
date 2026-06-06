'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Brain, Sparkles, BookOpen, Code, HelpCircle, RefreshCcw } from 'lucide-react';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

const quickPrompts = [
  { icon: <Brain size={14} />, text: 'Explique le Machine Learning' },
  { icon: <Code size={14} />, text: 'Comment utiliser Pandas ?' },
  { icon: <BookOpen size={14} />, text: 'Résume le cours Docker' },
  { icon: <HelpCircle size={14} />, text: 'Quels cours me recommandes-tu ?' },
];

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isLoading?: boolean;
}

function MessageBubble({ message, initials }: { message: ChatMessage; initials: string }) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
        isUser
          ? 'bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold'
          : 'bg-gradient-to-br from-indigo-600 to-purple-600'
      }`}>
        {isUser ? initials : <Brain size={16} className="text-white" />}
      </div>

      {/* Bubble */}
      <div className={`max-w-[75%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-indigo-600 text-white rounded-tr-sm'
            : 'bg-white/[0.06] border border-white/[0.08] text-slate-200 rounded-tl-sm'
        }`}>
          {message.isLoading ? (
            <div className="flex gap-1.5 py-1 px-1">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="typing-dot w-2 h-2 rounded-full bg-slate-400"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          ) : (
            <div
              className="whitespace-pre-wrap"
              dangerouslySetInnerHTML={{
                __html: message.content
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\n/g, '<br />'),
              }}
            />
          )}
        </div>
        <p className="text-xs text-slate-600 px-1">
          {new Date(message.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </motion.div>
  );
}

interface ApiChatMessage { id: string; role: string; content: string; createdAt: string; }

export default function ChatPage() {
  const user = useAuthStore(s => s.user);
  const initials = (user?.name ?? 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get<ApiChatMessage[]>('/chat/history').then(history => {
      setMessages(history.map(m => ({
        id: m.id, role: m.role as 'user' | 'assistant',
        content: m.content, timestamp: m.createdAt,
      })));
    }).catch(() => null);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const msgText = text || input.trim();
    if (!msgText || isTyping) return;

    setInput('');

    const userMsg: ChatMessage = {
      id: `tmp-user-${Date.now()}`,
      role: 'user',
      content: msgText,
      timestamp: new Date().toISOString(),
    };

    const loadingMsg: ChatMessage = {
      id: `tmp-loading-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      isLoading: true,
    };

    setMessages(prev => [...prev, userMsg, loadingMsg]);
    setIsTyping(true);

    try {
      const reply = await api.post<ApiChatMessage>('/chat', { message: msgText });
      setMessages(prev => [
        ...prev.filter(m => !m.isLoading),
        {
          id: reply.id,
          role: 'assistant' as const,
          content: reply.content,
          timestamp: reply.createdAt,
        },
      ]);
    } catch {
      setMessages(prev => prev.filter(m => !m.isLoading));
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = () => setMessages([]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role="student" userName={user?.name ?? 'Stagiaire'} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="Assistant IA — EduBot"
          subtitle="Posez vos questions pédagogiques, je suis là pour vous aider"
        />

        <div className="flex flex-1 overflow-hidden">
          {/* Chat area */}
          <div className="flex-1 flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <AnimatePresence>
                {messages.map(msg => (
                  <MessageBubble key={msg.id} message={msg} initials={initials} />
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Quick prompts */}
            <div className="px-6 pb-3">
              <div className="flex flex-wrap gap-2">
                {quickPrompts.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(p.text)}
                    disabled={isTyping}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/[0.04] border border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.08] hover:border-white/[0.15] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span className="text-indigo-400">{p.icon}</span>
                    {p.text}
                  </button>
                ))}
              </div>
            </div>

            {/* Input bar */}
            <div className="px-6 pb-6">
              <div className="relative flex items-end gap-3 p-3 rounded-2xl bg-white/[0.04] border border-white/[0.10] focus-within:border-indigo-500/40 transition-all">
                <div className="flex-1">
                  <textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Posez votre question... (Entrée pour envoyer, Maj+Entrée pour saut de ligne)"
                    rows={1}
                    disabled={isTyping}
                    className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 resize-none focus:outline-none min-h-[24px] max-h-32"
                    style={{ height: 'auto' }}
                  />
                </div>
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isTyping}
                  className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                >
                  <Send size={16} />
                </button>
              </div>
              <p className="text-xs text-slate-600 mt-2 text-center">
                EduBot peut faire des erreurs. Vérifiez les informations importantes.
              </p>
            </div>
          </div>

          {/* Right sidebar — context */}
          <div className="hidden lg:flex w-72 flex-col border-l border-white/[0.06] p-5 gap-5">
            {/* AI info */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                  <Brain size={16} className="text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">EduBot</p>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-xs text-emerald-400">En ligne</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Assistant pédagogique IA spécialisé dans vos cours. Je peux expliquer des concepts, résoudre des exercices et vous guider.
              </p>
            </div>

            {/* Capabilities */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Ce que je peux faire</p>
              <div className="space-y-2">
                {[
                  { icon: <BookOpen size={13} />, text: 'Expliquer les concepts du cours' },
                  { icon: <Code size={13} />, text: 'Déboguer votre code' },
                  { icon: <Sparkles size={13} />, text: 'Générer des exemples' },
                  { icon: <HelpCircle size={13} />, text: 'Répondre à vos questions' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-xs text-slate-400">
                    <span className="text-indigo-400">{item.icon}</span>
                    {item.text}
                  </div>
                ))}
              </div>
            </div>

            {/* Clear button */}
            <button
              onClick={clearChat}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.06] text-xs transition-all mt-auto"
            >
              <RefreshCcw size={13} />
              Nouvelle conversation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
