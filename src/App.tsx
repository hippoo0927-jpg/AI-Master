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
  Key
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { generateConsulting } from './services/geminiService';
import SubscriptionModal from './components/SubscriptionModal';
import AdminDashboard from './components/AdminDashboard';
import UserSubscriptionStatus from './components/UserSubscriptionStatus';
import LoginModal from './components/LoginModal';
import MyPage from './components/MyPage';

// --- Firebase SDK 로드 및 초기화 ---
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

// 🛡️ 보안이 적용된 설정 방식
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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

export default function App() {
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
  const [customApiKey, setCustomApiKey] = useState<string | null>(null);
  const [showSubModal, setShowSubModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showMyPage, setShowMyPage] = useState(false);

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
        } else {
          // 신규 유저인 경우 기본 등급으로 생성
          await setDoc(userDocRef, {
            email: currentUser.email,
            grade: 'free',
            expiryDate: null,
            customApiKey: null,
            createdAt: new Date()
          });
          setUserGrade('free');
          setUserExpiryDate(null);
          setCustomApiKey(null);
        }
      } else {
        setUserGrade('free');
        setUserExpiryDate(null);
        setCustomApiKey(null);
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

    // Free 등급 유저가 파일 분석을 시도할 때 (이미지 외 파일)
    if (userGrade === 'free' && file && !file.mimeType.startsWith('image/')) {
      setShowSubModal(true);
      return;
    }

    setIsLoading(true);
    setResult(null);
    try {
      // Gemini API 호출 시 Firebase에서 조회한 userGrade 및 customApiKey 전달
      const data = await generateConsulting(
        userInput, 
        selectedCategory, 
        selectedPlatform, 
        userGrade,
        file ? { mimeType: file.mimeType, data: file.data } : undefined,
        customApiKey || undefined
      );
      setResult(data);
    } catch (error) {
      alert('상담 중 오류가 발생했습니다. 다시 시도해주세요.');
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

      {/* MyPage Modal */}
      {showMyPage && user && (
        <MyPage 
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
        {/* Admin Dashboard - Only for hippoo0927@gmail.com */}
        {user?.email === 'hippoo0927@gmail.com' && (
          <div className="mb-16">
            <AdminDashboard />
          </div>
        )}

        {/* Hero Section */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6 tracking-tight leading-tight">
              Firebase 통합 프리미엄<br />
              <span className="gradient-text">AI 비즈니스 아키텍트</span>
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              로그인 후 당신의 멤버십 등급({userGrade})에 맞는 최적화된 분석을 경험하세요.<br />
              모든 데이터는 Firestore를 통해 안전하게 관리됩니다.
            </p>
          </motion.div>

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
        </div>

        {/* Input Section */}
        <div className="max-w-3xl mx-auto mb-16">
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
