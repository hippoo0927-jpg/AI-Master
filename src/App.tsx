import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  TrendingUp, 
  Workflow, 
  ShieldCheck, 
  Copy, 
  Check, 
  ArrowRight, 
  Zap, 
  Code, 
  Mail, 
  Image as ImageIcon, 
  Search, 
  BarChart3,
  Loader2,
  Clock,
  DollarSign,
  Lightbulb,
  Cpu,
  Info,
  Upload,
  User,
  Crown,
  FileSearch,
  LogOut,
  LogIn,
  Key,
  History,
  AlertCircle,
  MessageSquare
} from 'lucide-react';
import { 
  generateConsulting, 
  generateConsultingStream 
} from './services/geminiService';
import SubscriptionModal from './components/SubscriptionModal';
import AdminDashboard from './components/AdminDashboard';
import UserSubscriptionStatus from './components/UserSubscriptionStatus';
import LoginModal from './components/LoginModal';
import ApiKeySettings from './components/ApiKeySettings';
import UsageWidget from './components/UsageWidget';
import ChatHistorySidebar from './components/ChatHistorySidebar';
import SidebarButton from './components/SidebarButton';
import LandingPageHeader from './components/LandingPageHeader';
import QuickPrompts from './components/QuickPrompts';
import { 
  saveChatHistory, 
  subscribeToChatHistory, 
  checkUsage,
  incrementUsage,
  ChatHistoryItem,
  useCoupon
} from './services/chatService';
import { Notice } from './types';
import NoticeCarousel from './components/NoticeCarousel';

import { 
  HashRouter as Router, 
  Routes, 
  Route, 
  useNavigate,
  Link
} from 'react-router-dom';
import ExpertChat from './pages/ExpertChat';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ExpertsPage from './pages/ExpertsPage';
import FloatingSupportChat from './components/FloatingSupportChat';

// --- Firebase SDK 로드 및 초기화 ---
import { onAuthStateChanged, signOut, User as FirebaseUser, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { auth, db, googleProvider } from './firebase';
import { cn } from './lib/utils';
import dayjs from 'dayjs';

type Category = {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
};

const CATEGORIES: Category[] = [
  { id: 'marketing', title: '마케팅 혁명', description: '전략적 카피라이팅 & SNS 대량 생산', icon: Mail, color: 'text-rose-500 bg-rose-50' },
  { id: 'coding', title: '코딩 생산성', description: '비전공자용 주석 코드 & 디버깅', icon: Code, color: 'text-blue-500 bg-blue-50' },
  { id: 'automation', title: '업무 자동화', description: '회의록 구조화 & 데이터 인사이트', icon: Zap, color: 'text-amber-500 bg-amber-50' },
  { id: 'visual', title: '비주얼 마스터', description: '상업용 이미지/영상 프롬프트 설계', icon: ImageIcon, color: 'text-emerald-500 bg-emerald-50' },
  { id: 'research', title: '팩트체크/리서치', description: '실시간 정보 검색 & 교차 검증', icon: Search, color: 'text-indigo-500 bg-indigo-50' },
];

const PLATFORMS = [
  { id: 'recommend', name: 'AI 추천 플랫폼', icon: Sparkles },
  { id: 'gemini', name: 'Gemini 1.5 Pro', icon: Cpu },
  { id: 'grok', name: 'Grok (xAI)', icon: Search },
  { id: 'claude', name: 'Claude 3.5 Sonnet', icon: Cpu },
  { id: 'gpt', name: 'ChatGPT-4o', icon: Cpu },
  { id: 'perplexity', name: 'Perplexity', icon: Search },
];

import { ChatProvider } from './contexts/ChatContext';
import { X } from 'lucide-react';

function CouponModal({ isOpen, onClose, userId, onUpdate }: { isOpen: boolean, onClose: () => void, userId: string, onUpdate: () => void }) {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!code.trim()) return;
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const benefit = await useCoupon(userId, code);
      setSuccess(`쿠폰이 등록되었습니다! Expert Mode 전용 무료 상담 혜택(${benefit}회)이 지급되었습니다.`);
      onUpdate();
      setTimeout(() => {
        onClose();
        setSuccess(null);
        setCode('');
      }, 2000);
    } catch (err: any) {
      setError(err.message || "쿠폰 등록 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                    <Zap className="w-6 h-6 text-amber-500" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">쿠폰 등록</h3>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <p className="text-sm text-slate-500 mb-6">
                보유하신 쿠폰 코드를 입력하시면 즉시 혜택이 지급됩니다. (계정당 1회 사용 가능)
              </p>

              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="쿠폰 코드를 입력하세요"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono tracking-widest text-lg text-center uppercase"
                  />
                </div>

                {error && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </motion.div>
                )}

                {success && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-600 text-sm">
                    <Check className="w-4 h-4 shrink-0" />
                    {success}
                  </motion.div>
                )}

                <button
                  onClick={handleRegister}
                  disabled={!code.trim() || isLoading || !!success}
                  className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "등록하기"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userRole, setUserRole] = useState<string>('user');
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [showNoticePopup, setShowNoticePopup] = useState(false);

  useEffect(() => {
  const noticesRef = collection(db, 'notices');
  const q = query(
    noticesRef, 
    where('isActive', '==', true), 
    where('isPopup', '==', true),
    orderBy('createdAt', 'desc')
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const allNotices = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Notice[];

    // localStorage에서 '오늘 하루 보지 않기' 기록 가져오기
    const hiddenNoticesStr = localStorage.getItem('hidden_notices');
    const hiddenNotices = hiddenNoticesStr ? JSON.parse(hiddenNoticesStr) : {};
    const now = Date.now();

    const filteredNotices = allNotices.filter(notice => {
      // 해당 공지의 숨김 만료 시간이 현재보다 미래라면 숨김 처리
      const expiryTime = hiddenNotices[notice.id];
      if (expiryTime && now < expiryTime) return false;
      return true;
    });

    setNotices(filteredNotices);
    
    // ✅ 세션 체크 없이 필터링된 공지가 있으면 무조건 팝업 활성화
    if (filteredNotices.length > 0) {
      setShowNoticePopup(true);
    } else {
      setShowNoticePopup(false);
    }
  });

  return () => unsubscribe();
}, []);

      setNotices(filteredNotices);
      
      const isClosedInSession = sessionStorage.getItem('notice_popup_closed');
      if (filteredNotices.length > 0 && !isClosedInSession) {
        setShowNoticePopup(true);
      } else {
        setShowNoticePopup(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleCloseNoticePopup = () => {
    setShowNoticePopup(false);
    sessionStorage.setItem('notice_popup_closed', 'true');
  };

  const handleHideNoticeToday = (id: string) => {
    const hiddenNoticesStr = localStorage.getItem('hidden_notices');
    const hiddenNotices = hiddenNoticesStr ? JSON.parse(hiddenNoticesStr) : {};
    const today = dayjs().format('YYYY-MM-DD');
    
    hiddenNotices[id] = today;
    localStorage.setItem('hidden_notices', JSON.stringify(hiddenNotices));
    
    // Immediately remove from current state
    setNotices(prev => prev.filter(n => n.id !== id));
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role || 'user');
        }
      } else {
        setUserRole('user');
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <ChatProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home key={refreshTrigger} onUpdate={() => setRefreshTrigger(prev => prev + 1)} onOpenCoupon={() => setShowCouponModal(true)} />} />
          <Route path="/expert-chat" element={<ExpertChat />} />
          <Route path="/experts" element={<ExpertsPage />} />
          <Route 
            path="/admin" 
            element={
              (user?.email === 'hippoo0927@gmail.com' || userRole === 'admin') 
                ? <AdminDashboardPage /> 
                : <Home />
            } 
          />
        </Routes>
        {user && <FloatingSupportChat user={user} />}
        {user && (
          <CouponModal 
            isOpen={showCouponModal} 
            onClose={() => setShowCouponModal(false)} 
            userId={user.uid} 
            onUpdate={() => setRefreshTrigger(prev => prev + 1)}
          />
        )}
        <AnimatePresence>
          {showNoticePopup && notices.length > 0 && (
            <NoticeCarousel 
              notices={notices} 
              onClose={handleCloseNoticePopup} 
              onHideToday={handleHideNoticeToday}
            />
          )}
        </AnimatePresence>
      </Router>
    </ChatProvider>
  );
}

function Home({ onUpdate, onOpenCoupon }: { onUpdate?: () => void, onOpenCoupon?: () => void }) {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('marketing');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('recommend');
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [file, setFile] = useState<{ name: string; mimeType: string; data: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Firebase 상태 관리 ---
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userGrade, setUserGrade] = useState<string>('free'); // 기본 등급: free
  const [userExpiryDate, setUserExpiryDate] = useState<any>(null);
  const [dailyCount, setDailyCount] = useState<number>(0);
  const [customApiKey, setCustomApiKey] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-1.5-flash');
  const [streamingText, setStreamingText] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingError, setStreamingError] = useState<string | null>(null);
  const [showSubModal, setShowSubModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showMyPage, setShowMyPage] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleNewChat = () => {
    setUserInput('');
    setResult(null);
    setFile(null);
    setSelectedCategory('marketing');
  };

  // 인증 상태 감시 및 Firestore 등급 동기화
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Firestore에서 유저 등급, 만료일, 개인 API 키 조회
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserGrade(data.grade || 'free');
          setUserExpiryDate(data.expiryDate || null);
          setCustomApiKey(data.customApiKey || null);
          setSelectedModel(data.selectedModel || 'gemini-1.5-flash');
          setDailyCount(data.daily_count || 0);
        } else {
          // 신규 유저인 경우 기본 등급으로 생성
          await setDoc(userDocRef, {
            email: currentUser.email,
            grade: 'free',
            expiryDate: null,
            customApiKey: null,
            selectedModel: 'gemini-1.5-flash',
            daily_count: 0,
            used_coupons: [],
            createdAt: new Date(),
            last_reset_date: new Date()
          });
          setUserGrade('free');
          setUserExpiryDate(null);
          setCustomApiKey(null);
          setSelectedModel('gemini-1.5-flash');
          setDailyCount(0);
        }

        // 대화 기록 구독
        const unsubHistory = subscribeToChatHistory(currentUser.uid, (history) => {
          setChatHistory(history);
        });
        return () => unsubHistory();
      } else {
        setUserGrade('free');
        setUserExpiryDate(null);
        setCustomApiKey(null);
        setSelectedModel('gemini-1.5-flash');
        setDailyCount(0);
        setChatHistory([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // 로그아웃 로직
  const handleLogout = async () => {
    await signOut(auth);
    setResult(null);
  };

  // --- AuthCheck: 비로그인 차단 로직 ---
  const ensureAuth = async () => {
    if (!user) {
      setShowLoginModal(true);
      return false;
    }
    return true;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!(await ensureAuth())) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // 프리미엄 등급이 아닌데 이미지가 아닌 파일을 올리려 할 때 체크
      if (userGrade === 'free' && !selectedFile.type.startsWith('image/')) {
        setShowSubModal(true);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = (event.target?.result as string).split(',')[1];
        setFile({
          name: selectedFile.name,
          mimeType: selectedFile.type,
          data: base64
        });
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleConsult = async () => {
    if (!(await ensureAuth())) return;
    if (!userInput.trim() && !file) return;

    // 1. 입력값 유효성 검사 (10자 미만인 경우 AI 호출 전 차단)
    if (userInput.trim().length < 10 && !file) {
      setResult({
        isClarificationNeeded: true,
        clarificationMessage: "입력하신 내용이 너무 짧습니다. 설계하고 싶은 비즈니스 모델이나 해결하고 싶은 문제를 조금 더 구체적으로(10자 이상) 설명해주세요.",
        isLocalValidation: true
      });
      return;
    }

    // 2. 사용량 체크 (차감은 성공적인 설계 응답 시에만 수행)
    const canProceed = await checkUsage(user!.uid, userGrade);
    if (!canProceed) {
      alert("일일 사용량을 모두 소진했습니다. 내일 다시 시도하거나 프리미엄으로 업그레이드하세요!");
      setShowSubModal(true);
      return;
    }

    // Free 등급 유저가 파일 분석을 시도할 때 (이미지 외 파일)
    if (userGrade === 'free' && file && !file.mimeType.startsWith('image/')) {
      setShowSubModal(true);
      return;
    }

    setIsLoading(true);
    setResult(null);
    setStreamingText('');
    setIsStreaming(true);
    setStreamingError(null);

    try {
      let fullText = '';
      const stream = generateConsultingStream(
        userInput, 
        selectedCategory, 
        selectedPlatform, 
        userGrade,
        file ? { mimeType: file.mimeType, data: file.data } : undefined,
        customApiKey || undefined,
        selectedModel
      );

      try {
        for await (const chunk of stream) {
          fullText += chunk;
          setStreamingText(fullText);
        }
      } catch (streamError: any) {
        console.error("Stream interrupted:", streamError);
        setStreamingError(streamError.message || "스트리밍 중 연결이 끊겼습니다.");
        // 스트리밍 중단 시에도 지금까지 받은 텍스트로 파싱 시도
      }

      if (fullText) {
        try {
          const data = JSON.parse(fullText);
          setResult(data);
          setIsStreaming(false);

          // 3. 실제 AI 응답이 생성될 때만 (추가 정보 요청이 아닐 때만) 차감 및 저장
          if (user && !data.isClarificationNeeded) {
            await incrementUsage(user.uid);
            await saveChatHistory(user.uid, userInput, selectedCategory, data);
            setDailyCount(prev => prev + 1);
          }
        } catch (parseError) {
          console.error("JSON Parse Error:", parseError);
          if (!streamingError) {
            setStreamingError("응답 형식이 올바르지 않습니다. 다시 시도해주세요.");
          }
        }
      }
    } catch (error: any) {
      setIsStreaming(false);
      setStreamingError(error.message || '상담 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen font-sans selection:bg-indigo-100">
      {/* Login Modal */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />

      {/* Subscription Modal */}
      <SubscriptionModal 
        isOpen={showSubModal} 
        onClose={() => setShowSubModal(false)} 
        userEmail={user?.email || ""} 
      />

      {/* MyPage Modal (ApiKeySettings) */}
      {showMyPage && user && (
        <ApiKeySettings 
          userId={user.uid} 
          onClose={() => setShowMyPage(false)} 
        />
      )}

      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                <Sparkles className="text-white w-6 h-6" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">AI Master <span className="text-indigo-600">Architect</span></span>
            </div>
            
            <div className="flex items-center gap-4">
              {user && (
                <button 
                  onClick={onOpenCoupon}
                  className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-amber-600 transition-all shadow-lg shadow-amber-200"
                >
                  <Zap className="w-4 h-4" />
                  쿠폰 등록
                </button>
              )}
              {user && (
                <UsageWidget 
                  grade={userGrade} 
                  daily_count={dailyCount} 
                  expiryDate={userExpiryDate} 
                  hasCustomKey={!!customApiKey}
                />
              )}

              {user ? (
                <div className="flex items-center gap-4">
                  <div 
                    onClick={() => userGrade === 'free' && setShowSubModal(true)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-xl cursor-pointer transition-all",
                      userGrade === 'premium' ? "bg-amber-50 border border-amber-200" : "bg-slate-100 hover:bg-slate-200"
                    )}
                  >
                    {userGrade === 'premium' ? <Crown className="w-4 h-4 text-amber-500" /> : <User className="w-4 h-4 text-slate-500" />}
                    <span className="text-xs font-bold text-slate-700 uppercase">{userGrade} Member</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setShowMyPage(true)}
                      className="p-2 text-slate-500 hover:text-indigo-600 transition-colors"
                      title="개인 설정"
                    >
                      <Key className="w-5 h-5" />
                    </button>
                    <img src={user.photoURL || ""} alt="profile" className="w-8 h-8 rounded-full border border-slate-200" />
                    <button onClick={handleLogout} className="text-slate-500 hover:text-rose-500 transition-colors">
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => setShowLoginModal(true)}
                  className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
                >
                  <LogIn className="w-4 h-4 text-indigo-600" />
                  Google 로그인
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-8 min-h-[calc(100vh-200px)]">
          {/* Sidebar */}
              {user && (
                <ChatHistorySidebar 
                  history={chatHistory} 
                  onSelectChat={(chat) => {
                    setUserInput(chat.userInput);
                    setSelectedCategory(chat.category);
                    setResult(chat.result);
                  }}
                  onNewChat={handleNewChat}
                  isOpen={isSidebarOpen}
                  onClose={() => setIsSidebarOpen(false)}
                />
              )}

              {/* Sidebar Toggle Button */}
              {user && (
                <SidebarButton 
                  isOpen={isSidebarOpen} 
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                />
              )}

              <div className={cn(
                "flex-1 transition-all duration-300",
                isSidebarOpen && user ? "lg:ml-72" : "lg:ml-0"
              )}>
                {/* Premium Expert Chat Banner */}
                <div className="mb-8">
                  <Link 
                    to="/expert-chat"
                    className="flex items-center justify-between p-6 bg-slate-900 rounded-3xl border border-slate-800 hover:border-amber-500/50 transition-all group overflow-hidden relative"
                  >
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Crown className="w-32 h-32 text-amber-500" />
                    </div>
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20">
                        <MessageSquare className="text-amber-500 w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-lg">Architect Direct Chat (Premium)</h3>
                        <p className="text-slate-400 text-sm">비즈니스 아키텍트와 실시간 1:1 전문가 상담을 시작하세요.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-amber-500 font-bold text-sm relative z-10">
                      입장하기
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                </div>

                {/* Admin Dashboard Link - Only for admins */}
            {(user?.email === 'hippoo0927@gmail.com' || userGrade === 'admin') && (
              <div className="mb-8">
                <Link 
                  to="/admin"
                  className="flex items-center justify-between p-6 bg-indigo-900 rounded-3xl border border-indigo-800 hover:border-indigo-500 transition-all group overflow-hidden relative"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <ShieldCheck className="w-32 h-32 text-white" />
                  </div>
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                      <ShieldCheck className="text-white w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">Admin Dashboard</h3>
                      <p className="text-indigo-300 text-sm">사용자, 쿠폰, 전문가 및 CS 센터를 관리하세요.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-white font-bold text-sm relative z-10">
                    관리자 도구 열기
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </div>
            )}

            {/* Hero Section */}
            <LandingPageHeader />

          {/* User Subscription Status */}
          {user && (
            <div className="max-w-md mx-auto mb-12">
              <UserSubscriptionStatus 
                grade={userGrade} 
                expiryDate={userExpiryDate} 
                onUpgradeClick={() => setShowSubModal(true)} 
              />
            </div>
          )}

          {/* Category Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "p-6 rounded-2xl border-2 transition-all text-left flex flex-col gap-4 group",
                  selectedCategory === cat.id 
                    ? "border-indigo-600 bg-white shadow-xl shadow-indigo-100 -translate-y-1" 
                    : "border-transparent bg-white hover:border-slate-200 hover:shadow-lg"
                )}
              >
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110", cat.color)}>
                  <cat.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm mb-1">{cat.title}</h3>
                  <p className="text-xs text-slate-500 leading-tight">{cat.description}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Platform Selection */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {PLATFORMS.map((platform) => (
              <button
                key={platform.id}
                onClick={() => setSelectedPlatform(platform.id)}
                className={cn(
                  "px-4 py-2 rounded-full border text-sm font-medium transition-all flex items-center gap-2",
                  selectedPlatform === platform.id
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                    : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
                )}
              >
                <platform.icon className="w-4 h-4" />
                {platform.name}
              </button>
            ))}
          </div>

        {/* Input Section */}
        <div className="max-w-3xl mx-auto mb-16">
          <QuickPrompts onSelect={(prompt) => setUserInput(prev => prev + prompt)} />
          
          <div className="relative bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="해결하고 싶은 비즈니스 문제나 자동화하고 싶은 업무를 상세히 입력해주세요..."
              className="w-full h-48 p-6 outline-none text-slate-700 resize-none text-lg border-b border-slate-100"
            />
            
            <div className="p-4 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border",
                    file ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
                  )}
                >
                  <Upload className="w-4 h-4" />
                  {file ? file.name : "파일 업로드 (HWP, Excel, PDF...)"}
                </button>
                {file && (
                  <button 
                    onClick={() => setFile(null)}
                    className="text-xs text-rose-500 font-bold hover:underline"
                  >
                    삭제
                  </button>
                )}
              </div>

              <button
                onClick={handleConsult}
                disabled={isLoading || (!userInput.trim() && !file)}
                className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg shadow-indigo-200"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    분석 중...
                  </>
                ) : (
                  <>
                    설계 시작
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
          
          <div className="mt-4 flex items-center gap-6 text-xs text-slate-400 font-medium justify-center">
            <div className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-500" /> CRAFT 공식 적용</div>
            <div className="flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-indigo-500" /> 실시간 ROI 추적</div>
            <div className="flex items-center gap-1.5"><Workflow className="w-4 h-4 text-amber-500" /> 멀티-AI 파이프라인</div>
          </div>
        </div>

        {/* Results Section */}
        <AnimatePresence mode="wait">
          {isStreaming && !result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto"
            >
              <div className="bg-slate-900 rounded-[2rem] p-8 shadow-2xl border border-slate-800 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500/20">
                  <motion.div 
                    className="h-full bg-indigo-500"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  />
                </div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center">
                    <Cpu className="w-5 h-5 text-indigo-400 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold">AI 아키텍트 분석 중...</h3>
                    <p className="text-slate-400 text-xs">실시간으로 전략을 수립하고 있습니다.</p>
                  </div>
                </div>
                <div className="font-mono text-sm text-indigo-300/90 leading-relaxed whitespace-pre-wrap h-[300px] overflow-y-auto custom-scrollbar">
                  {streamingText || "분석 엔진 가동 중..."}
                  {!streamingError && (
                    <motion.span 
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                      className="inline-block w-2 h-4 bg-indigo-400 ml-1 align-middle"
                    />
                  )}
                  {streamingError && (
                    <div className="mt-4 p-4 bg-rose-500/20 border border-rose-500/50 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {streamingError}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {result && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              className="space-y-8"
            >
              {result.isClarificationNeeded ? (
                /* Clarification Needed UI */
                <div className="max-w-3xl mx-auto bg-amber-50 border border-amber-200 rounded-3xl p-8 text-center">
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Info className="w-8 h-8 text-amber-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-amber-900 mb-4">정교한 설계를 위해 추가 정보가 필요합니다</h2>
                  <p className="text-amber-800 text-lg mb-8 leading-relaxed">
                    {result.clarificationMessage}
                  </p>
                  <div className="mb-8 p-3 bg-amber-100/50 rounded-xl inline-block">
                    <p className="text-amber-700 text-sm font-bold flex items-center gap-2 justify-center">
                      <ShieldCheck className="w-4 h-4" />
                      이 요청은 일일 사용 횟수에 포함되지 않았습니다.
                    </p>
                  </div>
                  <button 
                    onClick={() => {
                      setResult(null);
                    }}
                    className="bg-amber-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-amber-700 transition-all"
                  >
                    내용 수정하기
                  </button>
                </div>
              ) : (
                /* Full Result UI */
                <div className="grid md:grid-cols-3 gap-8">
                  {/* Strategy Card */}
                  <div className="md:col-span-2 space-y-8">
                    {/* File Analysis Card */}
                    {result.fileAnalysis && (
                      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                            <FileSearch className="text-emerald-600 w-6 h-6" />
                          </div>
                          <h2 className="text-2xl font-bold text-slate-900">🔍 업로드 파일 분석 및 진단</h2>
                        </div>
                        
                        <div className="space-y-6">
                          <div>
                            <div className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">데이터 핵심 인사이트</div>
                            <p className="text-slate-700 leading-relaxed font-medium">{result.fileAnalysis.insights}</p>
                          </div>
                          
                          <div>
                            <div className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">전략적 보완점</div>
                            <p className="text-slate-600 leading-relaxed">{result.fileAnalysis.strategicImprovements}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                          <Lightbulb className="text-indigo-600 w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900">💡 AI 아키텍트의 맞춤 설계</h2>
                      </div>
                      
                      <div className="space-y-6">
                        <div>
                          <div className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">최적 매칭 플랫폼</div>
                          <div className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            {result.diagnosis.selectedPlatform}
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs rounded-full border border-indigo-100">최적 매칭</span>
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">파이프라인 전략</div>
                          <p className="text-slate-600 leading-relaxed">{result.diagnosis.pipelineStrategy}</p>
                        </div>
                      </div>
                    </div>

                    {/* Master Prompt Card */}
                    <div className="bg-slate-900 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Sparkles className="w-32 h-32 text-white" />
                      </div>
                      <div className="flex justify-between items-center mb-6 relative z-10">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                            <Sparkles className="text-white w-6 h-6" />
                          </div>
                          <h2 className="text-2xl font-bold text-white">📝 실전 투입용 마스터 프롬프트</h2>
                        </div>
                        <button
                          onClick={() => copyToClipboard(result.masterPrompt)}
                          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all text-sm font-medium border border-white/10"
                        >
                          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          {copied ? '복사됨' : '복사하기'}
                        </button>
                      </div>
                      <div className="bg-black/40 rounded-2xl p-6 border border-white/5 relative z-10">
                        <pre className="text-slate-300 whitespace-pre-wrap font-mono text-sm leading-relaxed">
                          {result.masterPrompt}
                        </pre>
                      </div>
                    </div>
                  </div>

                  {/* ROI Sidebar */}
                  <div className="space-y-6">
                    <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm sticky top-24">
                      <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                          <BarChart3 className="text-emerald-600 w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">📈 프리미엄 비즈니스 임팩트</h2>
                      </div>

                      <div className="space-y-8">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                            <Clock className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-500 mb-1">예상 절감 시간</div>
                            <div className="text-3xl font-bold text-slate-900">약 {result.roi.savedHours}시간</div>
                          </div>
                        </div>

                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                            <DollarSign className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-500 mb-1">경제적 가치</div>
                            <div className="text-3xl font-bold text-slate-900">약 {Number(result.roi.economicValue).toLocaleString()}원</div>
                          </div>
                        </div>

                        <div className="pt-6 border-t border-slate-100">
                          <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100">
                            <div className="flex items-center gap-2 mb-2">
                              <Zap className="w-4 h-4 text-amber-600" />
                              <span className="text-sm font-bold text-amber-900">아키텍트 코멘트</span>
                            </div>
                            <p className="text-sm text-amber-800 leading-relaxed">
                              {result.roi.architectComment}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-12 bg-white mt-24">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center">
              <Sparkles className="text-slate-400 w-5 h-5" />
            </div>
            <span className="font-bold text-slate-400">AI Master Architect</span>
          </div>
          <p className="text-slate-400 text-sm">
            © 2026 AI Master Architect. All rights reserved.<br />
            본 서비스는 CRAFT 프레임워크와 최신 AI 모델을 기반으로 최적의 비즈니스 솔루션을 제공합니다.
          </p>
        </div>
      </footer>
    </div>
  );
}
