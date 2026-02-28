import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Sparkles, 
  ArrowLeft, 
  Loader2, 
  Copy, 
  Check, 
  User, 
  Cpu,
  Eraser,
  MessageSquare,
  Plus,
  Trash2,
  Calendar,
  Menu,
  Crown,
  X as CloseIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Markdown from 'react-markdown';
import { auth, db } from '../firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  collection, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  deleteDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { generateExpertChatStream, generateChatTitle } from '../services/geminiService';
import { 
  LoginRequiredModal, 
  PremiumRequiredModal, 
  ApiKeyConfigModal,
  CreditsExhaustedModal
} from '../components/AccessModals';
import SubscriptionModal from '../components/SubscriptionModal';
import dayjs from 'dayjs';
import { useChat } from '../contexts/ChatContext';

interface Message {
  role: 'user' | 'model';
  content: string;
}

interface ExpertChatHistory {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Timestamp;
}

const ExpertChat: React.FC = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // User State
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userGrade, setUserGrade] = useState<string>('free');
  const [freeCredits, setFreeCredits] = useState<number>(0);
  const [customApiKey, setCustomApiKey] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // History State
  const [history, setHistory] = useState<ExpertChatHistory[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Modal State
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);
  const { playUserSound } = useChat();

  useEffect(() => {
    let unsubHistory: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // Clean up previous history listener if it exists
      if (unsubHistory) {
        unsubHistory();
        unsubHistory = null;
      }

      setUser(currentUser);
      
      if (currentUser) {
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserGrade(data.grade || 'free');
            setFreeCredits(data.free_credits || 0);
            setCustomApiKey(data.customApiKey || null);
          }

          // Real-time user data for credits
          const unsubUser = onSnapshot(userRef, (doc) => {
            if (doc.exists()) {
              const data = doc.data();
              setUserGrade(data.grade || 'free');
              setFreeCredits(data.free_credits || 0);
              setCustomApiKey(data.customApiKey || null);
            }
          });

          // Fetch History
          const isAdmin = currentUser.email === 'hippoo0927@gmail.com';
          const historyQuery = query(
            collection(db, 'expert_chats'),
            where('userId', '==', currentUser.uid),
            orderBy('createdAt', 'desc'),
            limit(isAdmin ? 100 : 10)
          );

          unsubHistory = onSnapshot(historyQuery, (snapshot) => {
            const items = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as ExpertChatHistory[];
            setHistory(items);
            setIsAuthLoading(false);
          }, (error) => {
            console.error("History fetch error:", error);
            setIsAuthLoading(false);
          });
        } catch (error) {
          console.error("Auth state processing error:", error);
          setIsAuthLoading(false);
        }
      } else {
        setHistory([]);
        setIsAuthLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubHistory) unsubHistory();
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingText]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    // --- Access Control Logic ---
    const isAdmin = user?.email === 'hippoo0927@gmail.com';
    const hasCredits = freeCredits > 0;
    
    if (!isAdmin) {
      if (!user) {
        setShowLoginModal(true);
        return;
      }
      
      // Allow access if user has free credits, even if not premium and no API key
      if (userGrade !== 'premium' && !customApiKey && !hasCredits) {
        // 크레딧 0일 때 대응
        if (userGrade === 'free') {
          setShowSubModal(true); // 일반 유저: 구독 유도
        } else {
          setShowKeyModal(true); // 프리미엄 유저: API KEY 설정 유도
        }
        return;
      }

      // 프리미엄 유저인데 API KEY가 없고 크레딧도 없으면 설정 유도
      if (userGrade === 'premium' && !customApiKey && !hasCredits) {
        setShowKeyModal(true);
        return;
      }
    }

    const userMessage = input.trim();
    setInput('');
    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);
    setStreamingText('');

    try {
      // Decrement credits if using free credits (no custom API key)
      if (!isAdmin && !customApiKey && hasCredits) {
        await updateDoc(doc(db, 'users', user!.uid), {
          free_credits: freeCredits - 1
        });
      }
      const historyPayload = newMessages.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
      }));

      const stream = generateExpertChatStream(historyPayload, customApiKey || undefined);
      let fullResponse = '';

      for await (const chunk of stream) {
        fullResponse += chunk;
        setStreamingText(fullResponse);
      }

      const finalMessages: Message[] = [...newMessages, { role: 'model', content: fullResponse }];
      setMessages(finalMessages);
      setStreamingText('');
      playUserSound();

      // --- Save to Firestore ---
      if (user) {
        if (!currentChatId) {
          // New Chat: Generate Title and Create Document
          const title = await generateChatTitle(userMessage, customApiKey || undefined);
          const docRef = await addDoc(collection(db, 'expert_chats'), {
            userId: user.uid,
            title,
            messages: finalMessages,
            createdAt: serverTimestamp()
          });
          setCurrentChatId(docRef.id);
        } else {
          // Existing Chat: Update Messages
          await updateDoc(doc(db, 'expert_chats', currentChatId), {
            messages: finalMessages
          });
        }
      }
    } catch (error: any) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { role: 'model', content: "죄송합니다. 오류가 발생했습니다: " + error.message }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteChat = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    if (!confirm("이 대화 내역을 삭제하시겠습니까?")) return;

    try {
      await deleteDoc(doc(db, 'expert_chats', chatId));
      if (currentChatId === chatId) {
        clearChat();
      }
    } catch (error) {
      console.error("Delete Error:", error);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const loadChat = (chat: ExpertChatHistory) => {
    setMessages(chat.messages);
    setCurrentChatId(chat.id);
    setStreamingText('');
  };

  const clearChat = () => {
    setMessages([]);
    setCurrentChatId(null);
    setStreamingText('');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans flex overflow-hidden">
      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className="w-72 bg-[#0F0F0F] border-r border-white/5 flex flex-col z-[60] h-screen shrink-0"
          >
            <div className="p-6">
              <button
                onClick={clearChat}
                className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center gap-2 transition-all font-bold text-sm"
              >
                <Plus className="w-4 h-4" />
                New Chat +
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 space-y-2 custom-scrollbar">
              <div className="px-2 mb-4">
                <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Recent History</span>
              </div>
              
              {history.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => loadChat(chat)}
                  className={`group p-4 rounded-2xl cursor-pointer transition-all border ${
                    currentChatId === chat.id 
                      ? 'bg-[#D4AF37]/10 border-[#D4AF37]/30' 
                      : 'bg-transparent border-transparent hover:bg-white/5'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-sm font-bold truncate mb-1 ${
                        currentChatId === chat.id ? 'text-[#D4AF37]' : 'text-white/80'
                      }`}>
                        {chat.title}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[10px] text-white/30">
                        <Calendar className="w-3 h-3" />
                        {dayjs(chat.createdAt?.toDate()).format('MM/DD HH:mm')}
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDeleteChat(e, chat.id)}
                      className="p-1.5 text-white/0 group-hover:text-white/20 hover:text-rose-500 transition-all rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {history.length === 0 && (
                <div className="py-10 text-center opacity-20">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-xs">기록이 없습니다</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-white/5">
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5">
                <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/20 flex items-center justify-center">
                  <Crown className="w-4 h-4 text-[#D4AF37]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate">{user?.email}</p>
                  <p className="text-[10px] text-white/40 uppercase font-bold tracking-tighter">{userGrade} Member</p>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col relative h-screen overflow-hidden">
        {/* Modals */}
        <LoginRequiredModal 
          isOpen={showLoginModal} 
          onClose={() => setShowLoginModal(false)} 
          onLogin={() => navigate('/')} 
        />
        <PremiumRequiredModal 
          isOpen={showPremiumModal} 
          onClose={() => setShowPremiumModal(false)} 
          onUpgrade={() => navigate('/')} 
        />
        <ApiKeyConfigModal 
          isOpen={showKeyModal} 
          onClose={() => setShowKeyModal(false)} 
          onSettings={() => navigate('/')} 
        />
        <SubscriptionModal
          isOpen={showSubModal}
          onClose={() => setShowSubModal(false)}
          userEmail={user?.email || ""}
        />
        <CreditsExhaustedModal 
          isOpen={showCreditsModal} 
          onClose={() => setShowCreditsModal(false)} 
          onAction={() => navigate('/')} 
        />

        {/* Header */}
        <header className="h-20 border-b border-white/10 bg-[#0A0A0A]/80 backdrop-blur-md sticky top-0 z-50 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-white/5 rounded-xl transition-colors text-white/60 hover:text-white"
            >
              <Menu className="w-6 h-6" />
            </button>
            <button 
              onClick={() => navigate('/')}
              className="p-2 hover:bg-white/5 rounded-xl transition-colors text-white/60 hover:text-white"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#D4AF37]/10 rounded-xl flex items-center justify-center border border-[#D4AF37]/20">
                <Sparkles className="text-[#D4AF37] w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">Auto-Pilot <span className="text-[#D4AF37]">Expert Mode</span></h1>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">
                    {userGrade !== 'premium' && !customApiKey && freeCredits > 0 
                      ? `무료 체험 크레딧 사용 중 (잔여: ${freeCredits}회)` 
                      : 'Gemini 2.5 Flash Connected'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={clearChat}
              className="p-2 text-white/40 hover:text-white transition-colors"
              title="대화 초기화"
            >
              <Eraser className="w-5 h-5" />
            </button>
            <div className="px-4 py-1.5 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-full">
              <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-tighter">Premium Direct Access</span>
            </div>
          </div>
        </header>

        {/* Chat Area */}
        <main 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar max-w-5xl mx-auto w-full"
        >
          {messages.length === 0 && !streamingText && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-40 py-20">
              <div className="w-20 h-20 bg-white/5 rounded-[2.5rem] flex items-center justify-center">
                <MessageSquare className="w-10 h-10" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">전문가 상담을 시작하세요</h2>
                <p className="text-sm max-w-xs mx-auto">
                  비즈니스 아키텍트가 당신의 전략 수립과 문제 해결을 실시간으로 도와드립니다.
                </p>
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'model' && (
                <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center shrink-0 border border-[#D4AF37]/20">
                  <Cpu className="w-5 h-5 text-[#D4AF37]" />
                </div>
              )}
              
              <div className={`max-w-[80%] group relative ${msg.role === 'user' ? 'order-1' : 'order-2'}`}>
                <div className={`p-5 rounded-3xl ${
                  msg.role === 'user' 
                    ? 'bg-[#D4AF37] text-black font-medium' 
                    : 'bg-[#1A1A1A] border border-white/10 text-white/90'
                }`}>
                  <div className="prose prose-invert max-w-none text-sm leading-relaxed">
                    <Markdown
                      components={{
                        code({ node, inline, className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || '');
                          return !inline ? (
                            <div className="relative group/code my-4">
                              <div className="absolute right-2 top-2 opacity-0 group-hover/code:opacity-100 transition-opacity">
                                <button
                                  onClick={() => copyToClipboard(String(children))}
                                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-md border border-white/10"
                                >
                                  <Copy className="w-4 h-4" />
                                </button>
                              </div>
                              <pre className="bg-black/50 p-4 rounded-xl overflow-x-auto border border-white/5">
                                <code className={className} {...props}>
                                  {children}
                                </code>
                              </pre>
                            </div>
                          ) : (
                            <code className="bg-white/10 px-1.5 py-0.5 rounded text-[#D4AF37]" {...props}>
                              {children}
                            </code>
                          );
                        }
                      }}
                    >
                      {msg.content}
                    </Markdown>
                  </div>
                </div>
                
                {msg.role === 'model' && (
                  <button 
                    onClick={() => copyToClipboard(msg.content)}
                    className="absolute -right-12 top-0 p-2 text-white/20 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10 order-2">
                  <User className="w-5 h-5 text-white/60" />
                </div>
              )}
            </motion.div>
          ))}

          {streamingText && (
            <div className="flex gap-4 justify-start">
              <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center shrink-0 border border-[#D4AF37]/20">
                <Cpu className="w-5 h-5 text-[#D4AF37] animate-pulse" />
              </div>
              <div className="max-w-[80%] order-2">
                <div className="p-5 rounded-3xl bg-[#1A1A1A] border border-white/10 text-white/90">
                  <div className="prose prose-invert max-w-none text-sm leading-relaxed">
                    <Markdown>{streamingText}</Markdown>
                    <motion.span 
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                      className="inline-block w-1.5 h-4 bg-[#D4AF37] ml-1 align-middle"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Input Area */}
        <footer className="p-6 bg-[#0A0A0A] border-t border-white/10 shrink-0">
          <div className="max-w-5xl mx-auto relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="전문가에게 무엇이든 물어보세요... (Shift+Enter로 줄바꿈)"
              className="w-full bg-[#1A1A1A] border border-white/10 rounded-[2rem] py-5 pl-8 pr-20 outline-none focus:border-[#D4AF37]/50 transition-all resize-none h-20 text-white/90 placeholder:text-white/20"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={`absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                !input.trim() || isLoading 
                  ? 'bg-white/5 text-white/20' 
                  : 'bg-[#D4AF37] text-black hover:scale-105 active:scale-95 shadow-lg shadow-[#D4AF37]/20'
              }`}
            >
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
            </button>
          </div>
          <p className="text-center text-[10px] text-white/20 mt-4 uppercase tracking-widest font-bold">
            Powered by Gemini 2.5 Flash & CRAFT Framework
          </p>
        </footer>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(212, 175, 55, 0.2);
        }
      `}</style>
    </div>
  );
};

export default ExpertChat;
