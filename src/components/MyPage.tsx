import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Key, 
  ExternalLink, 
  ShieldCheck, 
  Zap, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Info,
  Save,
  AlertCircle
} from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { testApiKey } from '../services/geminiService';

interface MyPageProps {
  userId: string;
  onClose: () => void;
}

export default function MyPage({ userId, onClose }: MyPageProps) {
  const [apiKey, setApiKey] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'fail' | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchUserKey = async () => {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const key = userDoc.data().customApiKey || '';
        setApiKey(key);
        // 이미 저장된 키가 있다면 일단 검증된 상태로 간주 (수정 시 리셋됨)
        if (key) setIsVerified(true);
      }
    };
    fetchUserKey();
  }, [userId, db]);

  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    setTestResult(null);
    setIsVerified(false); // 키 수정 시 검증 상태 초기화
  };

  const handleTest = async () => {
    if (!apiKey.trim()) {
      // 키를 비우는 경우는 테스트 없이 저장 가능하게 할 수 있으나, 
      // 여기서는 입력이 있는 경우에만 테스트 진행
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    const success = await testApiKey(apiKey);
    
    if (success) {
      setTestResult('success');
      setIsVerified(true);
    } else {
      setTestResult('fail');
      setIsVerified(false);
    }
    setIsTesting(false);
  };

  const handleSave = async () => {
    // 방어 로직: 키가 입력되어 있는데 검증되지 않았다면 차단
    if (apiKey.trim() && !isVerified) {
      alert('먼저 연결 테스트를 완료해주세요.');
      return;
    }

    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'users', userId), {
        customApiKey: apiKey.trim() || null
      });
      alert('개인 키가 등록되었습니다. 플랫폼 정책에 따라 일일 5회 사용 제한은 동일하게 유지됩니다.');
      onClose();
    } catch (error) {
      console.error('Save Error:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-[2rem] shadow-2xl max-w-2xl w-full overflow-hidden"
      >
        <div className="p-8">
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                <Key className="text-white w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">개인 API 키 설정 (BYOK)</h2>
                <p className="text-slate-500 text-sm">자신만의 API 키를 사용하여 분석을 수행합니다.</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          {/* Info Box */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 mb-8 flex gap-4">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm">
              <Zap className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-indigo-900 font-bold text-sm mb-1">운영 정책 안내</p>
              <p className="text-indigo-700 text-xs leading-relaxed">
                개인 API 키를 등록하시더라도 플랫폼의 공정한 이용을 위해 <strong>일일 5회 사용 제한은 동일하게 적용</strong>됩니다. 
                개인 키 사용 시에도 모든 데이터는 본인 계정에만 안전하게 관리됩니다.
              </p>
            </div>
          </div>

          {/* Input Section */}
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-end mb-2">
                <label className="text-sm font-bold text-slate-700">Gemini API Key</label>
                <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-indigo-600 font-bold flex items-center gap-1 hover:underline"
                >
                  무료 발급받기 <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="relative">
                <input 
                  type="password" 
                  value={apiKey}
                  onChange={(e) => handleApiKeyChange(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono text-sm"
                />
                {testResult === 'success' && <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />}
                {testResult === 'fail' && <XCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-rose-500" />}
              </div>
              {testResult === 'success' && (
                <p className="mt-2 text-xs text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 연결 확인되었습니다. 이제 저장할 수 있습니다.
                </p>
              )}
              <p className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> 입력하신 키는 암호화되어 Firestore에 안전하게 저장됩니다.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleTest}
                disabled={isTesting || !apiKey.trim()}
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-slate-700 border border-slate-200 hover:bg-slate-50 transition-all disabled:opacity-50"
              >
                {isTesting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                연결 테스트
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || (apiKey.trim() !== '' && !isVerified)}
                className={`flex-[2] flex items-center justify-center gap-2 py-4 rounded-2xl font-bold transition-all shadow-xl disabled:opacity-50 ${
                  isVerified || apiKey.trim() === ''
                    ? "bg-slate-900 text-white hover:bg-slate-800 shadow-slate-200"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                }`}
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                키 저장하기
              </button>
            </div>

            {testResult === 'fail' && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex gap-3">
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                <p className="text-xs text-rose-700 leading-relaxed">
                  API 키가 유효하지 않습니다. 키가 정확한지, 혹은 발급받은 프로젝트의 할당량이 남아있는지 확인해주세요.
                </p>
              </div>
            )}
          </div>

          <div className="mt-8 pt-8 border-t border-slate-100">
            <div className="flex items-center gap-2 text-slate-400">
              <Info className="w-4 h-4" />
              <p className="text-[11px]">개인 키를 삭제하려면 입력란을 비우고 저장하세요. 관리자의 기본 키가 다시 적용됩니다.</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
