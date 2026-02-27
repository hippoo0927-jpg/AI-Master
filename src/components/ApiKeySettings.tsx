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
  AlertCircle,
  Settings,
  Trash2,
  ChevronDown,
  Cpu,
  Eye,
  EyeOff
} from 'lucide-react';
import { doc, getDoc, updateDoc, deleteField } from 'firebase/firestore';
import { db } from '../firebase';
import { testApiKey } from '../services/geminiService';
import { cn } from '../lib/utils';

interface ApiKeySettingsProps {
  userId: string;
  onClose: () => void;
}

export default function ApiKeySettings({ userId, onClose }: ApiKeySettingsProps) {
  const [apiKey, setApiKey] = useState('');
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState('gemini-flash-latest');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'fail' | null>(null);
  const [testErrorMessage, setTestErrorMessage] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        const key = data.customApiKey || '';
        setApiKey(key);
        setSavedKey(key || null);
        setSelectedModel(data.selectedModel || 'gemini-flash-latest');
        if (key) setIsVerified(true);
      }
    };
    fetchUserData();
  }, [userId]);

  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    setTestResult(null);
    setTestErrorMessage(null);
    setIsVerified(false);
  };

  const handleTest = async () => {
    const trimmedKey = apiKey.trim();
    if (!trimmedKey) return;
    setIsTesting(true);
    setTestResult(null);
    setTestErrorMessage(null);
    
    try {
      const success = await testApiKey(trimmedKey);
      
      if (success) {
        setTestResult('success');
        setIsVerified(true);
      } else {
        setTestResult('fail');
        setIsVerified(false);
      }
    } catch (error: any) {
      setTestResult('fail');
      setTestErrorMessage(error.message || "연결 테스트 중 오류가 발생했습니다.");
      setIsVerified(false);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    if (apiKey.trim() && !isVerified) {
      alert('먼저 연결 테스트를 완료해주세요.');
      return;
    }

    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'users', userId), {
        customApiKey: apiKey.trim() || null,
        selectedModel: selectedModel
      });
      setSavedKey(apiKey.trim() || null);
      alert('개인 키가 등록되었습니다. 플랫폼 정책에 따라 일일 5회 사용 제한은 동일하게 유지됩니다.');
      if (!apiKey.trim()) onClose();
    } catch (error) {
      console.error('Save Error:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleModelChange = async (model: string) => {
    setSelectedModel(model);
    setShowModelSelector(false);
    if (savedKey) {
      try {
        await updateDoc(doc(db, 'users', userId), {
          selectedModel: model
        });
      } catch (error) {
        console.error('Model Change Error:', error);
      }
    }
  };

  const handleDeleteKey = async () => {
    if (deleteInput.toLowerCase() !== 'ai master architect') {
      alert('서비스 이름을 정확히 입력해주세요.');
      return;
    }

    setIsDeleting(true);
    try {
      await updateDoc(doc(db, 'users', userId), {
        customApiKey: deleteField(),
        selectedModel: deleteField()
      });
      setApiKey('');
      setSavedKey(null);
      setIsVerified(false);
      setShowDeleteConfirm(false);
      setDeleteInput('');
      alert('개인 API 키와 관련 설정이 보안 삭제되었습니다.');
    } catch (error) {
      console.error('Delete Error:', error);
      alert('삭제 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  const maskKey = (key: string) => {
    if (!key) return '';
    return `${key.substring(0, 8)}...****`;
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

          {/* Key Status & Model Selector */}
          {savedKey && (
            <div className="mb-8 p-6 bg-slate-50 rounded-3xl border border-slate-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Registered Key</p>
                    <p className="text-sm font-mono font-bold text-slate-700">{maskKey(savedKey)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setShowDeleteConfirm(true)}
                    className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                    title="개인 키 삭제"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setShowModelSelector(!showModelSelector)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:border-indigo-300 transition-all shadow-sm"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    설정
                    <ChevronDown className={cn("w-3 h-3 transition-transform", showModelSelector && "rotate-180")} />
                  </button>
                </div>
              </div>

              {showModelSelector && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2"
                >
                  <p className="text-xs font-bold text-slate-500 mb-3">사용할 모델 선택</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'gemini-flash-latest', name: 'Gemini 1.5 Flash', desc: '빠른 속도 & 효율성' },
                      { id: 'gemini-3.1-pro-preview', name: 'Gemini 1.5 Pro', desc: '복잡한 추론 & 대용량' }
                    ].map((m) => (
                      <button
                        key={m.id}
                        onClick={() => handleModelChange(m.id)}
                        className={cn(
                          "p-4 rounded-2xl border-2 text-left transition-all",
                          selectedModel === m.id 
                            ? "border-indigo-600 bg-white shadow-md shadow-indigo-100" 
                            : "border-transparent bg-white hover:border-slate-200"
                        )}
                      >
                        <p className="text-sm font-bold text-slate-900">{m.name}</p>
                        <p className="text-[10px] text-slate-500">{m.desc}</p>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* Input Section */}
          <div className="space-y-6">
            {!savedKey ? (
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
                    type={showKey ? "text" : "password"} 
                    value={apiKey}
                    onChange={(e) => handleApiKeyChange(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono text-sm pr-24"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      title={showKey ? "키 가리기" : "키 보기"}
                    >
                      {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                    {testResult === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                    {testResult === 'fail' && <XCircle className="w-5 h-5 text-rose-500" />}
                  </div>
                </div>
                {testResult === 'success' && (
                  <p className="mt-2 text-xs text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 연결 확인되었습니다. 이제 저장할 수 있습니다.
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <Cpu className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-indigo-400 uppercase">Active Model</p>
                    <p className="text-xs font-bold text-indigo-900">
                      {selectedModel.includes('pro') ? 'Gemini 1.5 Pro' : 'Gemini 1.5 Flash'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setSavedKey(null);
                    setIsVerified(false);
                  }}
                  className="text-xs font-bold text-indigo-600 hover:underline"
                >
                  키 교체하기
                </button>
              </div>
            )}

            {!savedKey && (
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
                  className={cn(
                    "flex-[2] flex items-center justify-center gap-2 py-4 rounded-2xl font-bold transition-all shadow-xl disabled:opacity-50",
                    isVerified || apiKey.trim() === ''
                      ? "bg-slate-900 text-white hover:bg-slate-800 shadow-slate-200"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                  )}
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  키 저장하기
                </button>
              </div>
            )}

            {testResult === 'fail' && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex gap-3">
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                <div className="space-y-1">
                  <p className="text-xs text-rose-700 font-bold">연결 실패</p>
                  <p className="text-xs text-rose-600 leading-relaxed">
                    {testErrorMessage || "API 키가 유효하지 않거나 서버 응답이 없습니다. 키를 다시 확인해주세요."}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 pt-8 border-t border-slate-100">
            <div className="flex items-center gap-2 text-slate-400">
              <Info className="w-4 h-4" />
              <p className="text-[11px]">입력하신 키는 암호화되어 Firestore에 안전하게 저장됩니다.</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl"
          >
            <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mb-6">
              <Trash2 className="w-8 h-8 text-rose-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">개인 API 키 보안 삭제</h3>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              정말 삭제하시겠습니까? 확인을 위해 서비스 이름인 <span className="font-bold text-slate-900">'AI Master Architect'</span>를 입력해주세요.
            </p>
            <input 
              type="text"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder="서비스 이름을 입력하세요"
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-rose-500 transition-all mb-6 text-sm"
            />
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteInput('');
                }}
                className="flex-1 py-4 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-all"
              >
                취소
              </button>
              <button 
                onClick={handleDeleteKey}
                disabled={isDeleting || deleteInput.toLowerCase() !== 'ai master architect'}
                className="flex-[2] py-4 bg-rose-600 text-white rounded-2xl font-bold hover:bg-rose-700 transition-all disabled:opacity-50 shadow-lg shadow-rose-200"
              >
                {isDeleting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "보안 삭제 실행"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
