import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Ticket, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useCoupon } from '../services/chatService';

interface CouponModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSuccess: (credits: number) => void;
}

export default function CouponModal({ isOpen, onClose, userId, onSuccess }: CouponModalProps) {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCredits, setSuccessCredits] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const credits = await useCoupon(userId, code);
      setSuccessCredits(credits);
      onSuccess(credits);
      setTimeout(() => {
        onClose();
        setSuccessCredits(null);
        setCode('');
      }, 2000);
    } catch (err: any) {
      setError(err.message || '쿠폰 등록 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full overflow-hidden"
          >
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <Ticket className="text-indigo-600 w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">쿠폰 등록</h2>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {successCredits !== null ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-8"
                >
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">쿠폰 등록 성공!</h3>
                  <p className="text-slate-500">
                    <span className="text-emerald-600 font-bold">{successCredits} 크레딧</span>이 즉시 지급되었습니다.
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">쿠폰 코드 입력</label>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="예: MASTER2024"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono tracking-widest text-lg"
                      autoFocus
                    />
                  </div>

                  {error && (
                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 text-rose-600 text-sm">
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      {error}
                    </div>
                  )}

                  <div className="bg-slate-50 rounded-xl p-4 text-xs text-slate-500 leading-relaxed">
                    <p>• 쿠폰은 계정당 1회만 등록 가능합니다.</p>
                    <p>• 등록된 크레딧은 프리미엄 기능 이용 시 우선 차감됩니다.</p>
                    <p>• 유효기간이 지난 쿠폰은 등록할 수 없습니다.</p>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !code.trim()}
                    className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "혜택 받기"}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
