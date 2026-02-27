import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Check, 
  ChevronRight, 
  ShieldCheck, 
  Lock, 
  FileText,
  AlertCircle
} from 'lucide-react';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { TERMS_OF_SERVICE, PRIVACY_POLICY } from '../constants/TermsData';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [agreedAll, setAgreedAll] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [viewingTerms, setViewingTerms] = useState<'terms' | 'privacy' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const auth = getAuth();
  const db = getFirestore();
  const googleProvider = new GoogleAuthProvider();

  // 전체 동기화 로직
  useEffect(() => {
    if (agreedTerms && agreedPrivacy) {
      setAgreedAll(true);
    } else {
      setAgreedAll(false);
    }
  }, [agreedTerms, agreedPrivacy]);

  const handleAgreeAll = (checked: boolean) => {
    setAgreedAll(checked);
    setAgreedTerms(checked);
    setAgreedPrivacy(checked);
  };

  const handleLogin = async () => {
    if (!agreedTerms || !agreedPrivacy) return;
    
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Firestore에 유저 정보 저장 (Merge)
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        agreedToTerms: true,
        lastLogin: serverTimestamp(),
        // 신규 유저일 때만 기본값 설정
        grade: 'free',
        createdAt: serverTimestamp(),
      }, { merge: true });

      onClose();
    } catch (error) {
      console.error("Login Error:", error);
      alert("로그인 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300">
      {/* Background Overlay for closing */}
      <div className="absolute inset-0" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full overflow-hidden relative z-10"
      >
        {/* Header */}
        <div className="p-8 pb-4 text-center">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-200">
            <ShieldCheck className="text-white w-8 h-8" />
          </div>
          
          <h2 className="text-2xl font-bold text-slate-900 mb-2">환영합니다!</h2>
          <p className="text-slate-500">계속하려면 로그인하고 설계를 시작하세요.</p>
        </div>

        {/* Terms Section */}
        <div className="px-8 py-6 space-y-4">
          <label className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer group transition-all hover:bg-slate-100">
            <div className="relative flex items-center">
              <input 
                type="checkbox" 
                className="peer hidden" 
                checked={agreedAll}
                onChange={(e) => handleAgreeAll(e.target.checked)}
              />
              <div className="w-6 h-6 border-2 border-slate-300 rounded-lg flex items-center justify-center transition-all peer-checked:bg-indigo-600 peer-checked:border-indigo-600">
                <Check className="w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
              </div>
            </div>
            <span className="font-bold text-slate-700">모두 동의하기</span>
          </label>

          <div className="space-y-3 px-1">
            <div className="flex items-center justify-between group">
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative flex items-center">
                  <input 
                    type="checkbox" 
                    className="peer hidden" 
                    checked={agreedTerms}
                    onChange={(e) => setAgreedTerms(e.target.checked)}
                  />
                  <div className="w-5 h-5 border-2 border-slate-200 rounded-md flex items-center justify-center transition-all peer-checked:bg-indigo-500 peer-checked:border-indigo-500">
                    <Check className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                  </div>
                </div>
                <span className="text-sm text-slate-600 font-medium">[필수] 이용약관 동의</span>
              </label>
              <button 
                onClick={() => setViewingTerms('terms')}
                className="text-xs text-slate-400 hover:text-indigo-600 font-bold flex items-center gap-0.5 transition-colors"
              >
                보기 <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="flex items-center justify-between group">
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative flex items-center">
                  <input 
                    type="checkbox" 
                    className="peer hidden" 
                    checked={agreedPrivacy}
                    onChange={(e) => setAgreedPrivacy(e.target.checked)}
                  />
                  <div className="w-5 h-5 border-2 border-slate-200 rounded-md flex items-center justify-center transition-all peer-checked:bg-indigo-500 peer-checked:border-indigo-500">
                    <Check className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                  </div>
                </div>
                <span className="text-sm text-slate-600 font-medium">[필수] 개인정보 수집 및 이용 동의</span>
              </label>
              <button 
                onClick={() => setViewingTerms('privacy')}
                className="text-xs text-slate-400 hover:text-indigo-600 font-bold flex items-center gap-0.5 transition-colors"
              >
                보기 <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Login Button */}
        <div className="p-8 pt-2">
          <button
            onClick={handleLogin}
            disabled={!agreedTerms || !agreedPrivacy || isLoading}
            className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-lg transition-all shadow-lg ${
              agreedTerms && agreedPrivacy && !isLoading
                ? "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-slate-200 active:scale-[0.98]"
                : "bg-slate-100 text-slate-400 border-transparent cursor-not-allowed shadow-none"
            }`}
          >
            {isLoading ? (
              <div className="w-6 h-6 border-3 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google로 계속하기
              </>
            )}
          </button>
          <p className="mt-4 text-center text-[10px] text-slate-400 flex items-center justify-center gap-1">
            <Lock className="w-3 h-3" /> 안전한 보안 로그인을 지원합니다
          </p>
        </div>
      </motion.div>

      {/* Terms Sub-Modal */}
      <AnimatePresence>
        {viewingTerms && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
          >
            <div className="bg-white rounded-[2rem] shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-slate-900">
                    {viewingTerms === 'terms' ? '이용약관' : '개인정보 처리방침'}
                  </h3>
                </div>
                <button 
                  onClick={() => setViewingTerms(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-8 overflow-y-auto text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                {viewingTerms === 'terms' ? TERMS_OF_SERVICE : PRIVACY_POLICY}
              </div>
              <div className="p-6 border-t border-slate-100 text-center">
                <button 
                  onClick={() => setViewingTerms(null)}
                  className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all"
                >
                  확인
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
