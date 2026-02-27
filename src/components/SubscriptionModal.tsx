import { motion } from 'motion/react';
import { Coffee, AlertTriangle, CheckCircle2, ExternalLink, X, Sparkles } from 'lucide-react';

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
        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto relative custom-scrollbar"
      >
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-100 px-8 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">프리미엄 멤버십 플랜</h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 transition-colors bg-slate-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 pt-6">
          <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Coffee className="w-8 h-8 text-amber-600" />
          </div>
          
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-slate-900 mb-2">아키텍트 업그레이드</h3>
            <p className="text-slate-500">모든 파일 분석 및 무제한 설계를 시작하세요.</p>
          </div>

          {/* Pricing Plans */}
          <div className="space-y-4 mb-8">
            {/* 1 Month Plan */}
            <div className="relative p-5 rounded-2xl border-2 border-slate-100 bg-slate-50/50 hover:border-slate-200 transition-all">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-slate-400" />
                  <span className="font-bold text-slate-800 text-lg">1개월 무제한</span>
                </div>
                <div className="text-right">
                  <div className="text-slate-900 font-black text-xl">$5 <span className="text-sm font-normal text-slate-500">(약 6,700원)</span></div>
                </div>
              </div>
              <p className="text-sm text-slate-500">커피 한 잔 값으로 누리는 아키텍트 컨설팅</p>
            </div>

            {/* 6 Months Plan (Highlighted) */}
            <div className="relative p-5 rounded-2xl border-2 border-amber-50 bg-amber-50/30 ring-2 ring-amber-500/20 border-amber-500 shadow-lg shadow-amber-500/5 transition-all">
              <div className="absolute -top-3 right-4 bg-amber-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                BEST VALUE
              </div>
              
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-amber-600" />
                  <span className="font-bold text-slate-900 text-lg">6개월 무제한</span>
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end gap-2 mb-1">
                    <span className="text-slate-400 line-through text-sm">$30</span>
                    <span className="bg-rose-100 text-rose-600 text-[10px] font-bold px-1.5 py-0.5 rounded">17% 할인 적용</span>
                  </div>
                  <div className="text-amber-600 font-black text-xl">$25 <span className="text-sm font-normal text-slate-500">(약 33,000원)</span></div>
                </div>
              </div>
              <p className="text-sm text-amber-900/70 font-medium">5개월 가격으로 6개월 이용 (월 $4.1 수준)</p>
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
              ⚠️ 중요: 결제 시 메시지란에 현재 로그인하신 <span className="text-rose-600 underline decoration-2 underline-offset-4">이메일을 반드시 적어주세요!</span>
            </p>
            <div className="mt-3 bg-white/80 rounded-xl p-3 border border-rose-100 text-center shadow-inner">
              <code className="text-rose-600 font-black text-xl">{userEmail}</code>
            </div>
            <p className="text-rose-700 text-xs mt-3 font-medium">
              확인 후 1시간 내로 프리미엄 권한을 넣어드립니다.
            </p>
          </div>

          {/* Action Button */}
          <a
            href="https://buymeacoffee.com/hippoo0927c"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 group"
          >
            커피 후원하고 프리미엄 시작하기
            <ExternalLink className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </a>
          
          <div className="mt-6 space-y-2">
            <p className="text-[11px] text-slate-400 text-center">
              환율에 따라 원화 결제 금액이 다소 차이가 날 수 있습니다.
            </p>
            <p className="text-[11px] text-slate-400 text-center">
              후원 완료 후 권한 부여가 늦어질 경우 hippoo0927@gmail.com으로 문의주세요.
            </p>
          </div>
        </div>
      </motion.div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
}
