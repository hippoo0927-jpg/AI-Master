import { 
  Crown, 
  User, 
  Calendar, 
  ArrowRight, 
  Clock,
  AlertCircle
} from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import dayjs from 'dayjs';

interface UserSubscriptionStatusProps {
  grade: string;
  expiryDate?: Timestamp;
  onUpgradeClick: () => void;
}

export default function UserSubscriptionStatus({ grade, expiryDate, onUpgradeClick }: UserSubscriptionStatusProps) {
  const isPremium = grade === 'premium';
  
  const getDDay = () => {
    if (!expiryDate) return null;
    const now = dayjs();
    const expiry = dayjs(expiryDate.toDate());
    const diff = expiry.diff(now, 'day');
    return diff;
  };

  const dDay = getDDay();

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isPremium ? "bg-amber-100" : "bg-slate-100"
          }`}>
            {isPremium ? <Crown className="w-6 h-6 text-amber-600" /> : <User className="w-6 h-6 text-slate-500" />}
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">나의 멤버십</div>
            <div className="text-lg font-black text-slate-900 uppercase">{grade}</div>
          </div>
        </div>
        
        {!isPremium && (
          <button 
            onClick={onUpgradeClick}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
          >
            업그레이드
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="pt-4 border-t border-slate-100">
        {isPremium ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-600">
              <Clock className="w-4 h-4 text-indigo-500" />
              <span className="text-sm font-medium">
                {dDay !== null && dDay >= 0 ? (
                  <>구독 종료일까지 <span className="text-indigo-600 font-bold">{dDay}일</span> 남았습니다</>
                ) : (
                  <span className="text-rose-500 font-bold">구독이 만료되었습니다</span>
                )}
              </span>
            </div>
            {expiryDate && (
              <div className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                종료일: {dayjs(expiryDate.toDate()).format('YYYY-MM-DD')}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-slate-500">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <p className="text-xs leading-relaxed">
              현재 무료 등급입니다. <span className="text-indigo-600 font-bold cursor-pointer hover:underline" onClick={onUpgradeClick}>프리미엄으로 업그레이드</span>하여 모든 기능을 무제한으로 이용하세요!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
