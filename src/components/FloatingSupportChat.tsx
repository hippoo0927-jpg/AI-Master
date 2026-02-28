import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Loader2, User, Cpu, Headset, ArrowRight } from 'lucide-react';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp, 
  doc, 
  updateDoc,
  Timestamp,
  limit
} from 'firebase/firestore';
import { db } from '../firebase';
import { ChatMessage, SupportChat } from '../types';
import { useChat } from '../contexts/ChatContext';

interface FloatingSupportChatProps {
  user: any;
}

export default function FloatingSupportChat({ user }: FloatingSupportChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { activeChat, unreadCount } = useChat();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Mark as read when opened
  useEffect(() => {
    if (isOpen && activeChat?.unreadByUser) {
      updateDoc(doc(db, 'support_chats', activeChat.id), {
        unreadByUser: false
      });
    }
  }, [isOpen, activeChat]);

  // Context-aware greeting
  useEffect(() => {
    if (isOpen && user && (!activeChat || activeChat.messages.length === 0)) {
      const pageTitle = document.title;
      const initialGreeting: ChatMessage = {
        role: 'model',
        content: `안녕하세요! 현재 [${pageTitle}] 페이지를 보고 계시네요. 도움이 필요하신가요?`,
        timestamp: Timestamp.now()
      };
      
      const startChat = async () => {
        await addDoc(collection(db, 'support_chats'), {
          userId: user.uid,
          userEmail: user.email,
          messages: [initialGreeting],
          status: 'ai',
          lastMessageAt: serverTimestamp(),
          unreadByAdmin: false,
          unreadByUser: true
        });
      };
      
      startChat();
    }
  }, [isOpen, user, activeChat]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeChat?.messages]);

  const handleSend = async () => {
    if (!input.trim() || !user || !activeChat) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input,
      timestamp: Timestamp.now()
    };

    const newMessages = [...activeChat.messages, userMessage];
    setInput('');
    setIsLoading(true);

    try {
      await updateDoc(doc(db, 'support_chats', activeChat.id), {
        messages: newMessages,
        lastMessageAt: serverTimestamp(),
        unreadByAdmin: true
      });

      // AI 응답 로직 (상담원 연결 상태가 아닐 때만)
      if (activeChat.status === 'ai') {
        // 간단한 키워드 감지
        if (input.includes('상담원') || input.includes('연결') || input.includes('사람')) {
          const aiMessage: ChatMessage = {
            role: 'model',
            content: "상담원 연결을 요청하셨습니다. 관리자가 확인 후 곧 답변을 드릴 예정입니다. 잠시만 기다려주세요.",
            timestamp: Timestamp.now()
          };
          await updateDoc(doc(db, 'support_chats', activeChat.id), {
            messages: [...newMessages, aiMessage],
            status: 'request_admin',
            lastMessageAt: serverTimestamp(),
            unreadByAdmin: true
          });
        } else {
          // 기본 AI 응답
          setTimeout(async () => {
            const aiMessage: ChatMessage = {
              role: 'model',
              content: "무엇을 도와드릴까요? 결제, 쿠폰, 전문가 상담 등 궁금하신 점을 말씀해주세요.",
              timestamp: Timestamp.now()
            };
            await updateDoc(doc(db, 'support_chats', activeChat.id), {
              messages: [...newMessages, aiMessage],
              lastMessageAt: serverTimestamp(),
              unreadByUser: true
            });
          }, 1000);
        }
      }
    } catch (error) {
      console.error("Support chat error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const requestAgent = async () => {
    if (!activeChat) return;
    const systemMessage: ChatMessage = {
      role: 'model',
      content: "상담원 연결을 요청했습니다. 잠시만 기다려주세요.",
      timestamp: Timestamp.now()
    };
    await updateDoc(doc(db, 'support_chats', activeChat.id), {
      messages: [...activeChat.messages, systemMessage],
      status: 'request_admin',
      lastMessageAt: serverTimestamp(),
      unreadByAdmin: true
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-[300]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 100, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute bottom-20 right-0 w-[380px] h-[580px] bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-6 bg-indigo-600 text-white">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Headset className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold">CS 센터</h3>
                    <p className="text-[10px] opacity-60 uppercase tracking-widest font-bold">24/7 AI Support</p>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex items-center gap-2 text-xs bg-black/10 p-2 rounded-lg">
                <div className={`w-2 h-2 rounded-full ${activeChat?.status === 'request_admin' ? 'bg-amber-400 animate-pulse' : activeChat?.status === 'manual' ? 'bg-blue-400' : 'bg-emerald-400'}`} />
                {activeChat?.status === 'request_admin' ? '상담원 연결 대기 중' : activeChat?.status === 'manual' ? '상담원과 대화 중' : 'AI 아키텍트가 응대 중입니다'}
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50 custom-scrollbar">
              {(!activeChat || activeChat.messages.length === 0) && (
                <div className="text-center py-10 opacity-40">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4" />
                  <p className="text-sm">궁금하신 점을 남겨주시면<br/>AI 아키텍트가 즉시 답변해드립니다.</p>
                </div>
              )}
              
              {activeChat?.messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role !== 'user' && (
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                      {msg.role === 'admin' ? <Headset className="w-4 h-4 text-indigo-600" /> : <Cpu className="w-4 h-4 text-indigo-600" />}
                    </div>
                  )}
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-tr-none' 
                      : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                  </div>
                  <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-none shadow-sm">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-white border-t border-slate-100">
              {activeChat?.status === 'ai' && activeChat.messages.length > 2 && (
                <button 
                  onClick={requestAgent}
                  className="w-full mb-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  상담원 연결 요청하기
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="메시지를 입력하세요..."
                  className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 transition-all text-sm"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-indigo-600 text-white rounded-xl flex items-center justify-center disabled:opacity-50 transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all ${
          isOpen ? 'bg-slate-900 text-white' : 'bg-indigo-600 text-white'
        }`}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
        {!isOpen && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white animate-bounce">
            {unreadCount}
          </span>
        )}
      </motion.button>
    </div>
  );
}
