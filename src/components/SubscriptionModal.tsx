import { motion } from 'motion/react';
import { Coffee, AlertTriangle, CheckCircle2, ExternalLink, X } from 'lucide-react';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
}

export default function SubscriptionModal({ isOpen, onClose, userEmail }: SubscriptionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden relative"
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Coffee className="w-8 h-8 text-amber-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-slate-900 mb-2">프리미엄 아키텍트 업그레이드</h2>
          <p className="text-slate-500 mb-8">모든 파일 분석 및 무제한 설계를 시작하세요.</p>

          {/* Pricing Plans */}
          <div className="space-y-3 mb-8">
            <div className="flex items-center justify-between p-4 rounded-2xl border-2 border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                <span className="font-bold text-slate-700">1개월 무제한</span>
              </div>
              <span className="text-indigo-600 font-bold">커피 2잔 (약 1만원)</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-2xl border-2 border-indigo-100 bg-indigo-50/30">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                <span className="font-bold text-slate-700">6개월 무제한</span>
              </div>
              <div className="text-right">
                <div className="text-indigo-600 font-bold">커피 10잔 (약 5만원)</div>
                <div className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider">15% 할인 적용</div>
              </div>
            </div>
          </div>

          {/* CRITICAL WARNING BOX */}
          <div className="instruction-box bg-rose-50 border-2 border-rose-200 rounded-2xl p-5 mb-8 text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-10">
              <AlertTriangle className="w-12 h-12 text-rose-600" />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              <span className="font-black text-rose-600">가장 중요한 주의사항</span>
            </div>
            <p className="text-rose-900 font-bold leading-relaxed">
              ⚠️ 중요: 결제 시 메시지란에 현재 로그인하신 이메일을 반드시 적어주세요!
            </p>
            <div className="mt-3 bg-white/60 rounded-lg p-2 border border-rose-100 text-center">
              <code className="text-rose-600 font-black text-lg">{userEmail}</code>
            </div>
            <p className="text-rose-700 text-sm mt-3 font-medium">
              확인 후 1시간 내로 프리미엄 권한을 넣어드립니다.
            </p>
          </div>

          {/* Action Button */}
          <a
            href="https://buymeacoffee.com/hippoo0927c"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
          >
            커피 후원하고 프리미엄 시작하기
            <ExternalLink className="w-5 h-5" />
          </a>
          
          <p className="mt-4 text-xs text-slate-400">
            후원 완료 후 권한 부여가 늦어질 경우 hippoo0927@gmail.com으로 문의주세요.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
