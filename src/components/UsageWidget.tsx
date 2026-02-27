import { 
  BarChart3, 
  Crown, 
  Clock,
  Zap
} from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import dayjs from 'dayjs';

interface UsageWidgetProps {
  grade: string;
  usageCount: number;
  expiryDate?: Timestamp;
}

export default function UsageWidget({ grade, usageCount, expiryDate }: UsageWidgetProps) {
  const isPremium = grade === 'premium';
  const limit = 5;
  const progress = Math.min((usageCount / limit) * 100, 100);

  const getDDay = () => {
    if (!expiryDate) return null;
    const now = dayjs();
    const expiry = dayjs(expiryDate.toDate());
    return expiry.diff(now, 'day');
  };

  const dDay = getDDay();

  return (
    <div className="hidden sm:flex items-center gap-4 bg-white border border-slate-200 px-4 py-1.5 rounded-2xl shadow-sm">
      {isPremium ? (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
            <Crown className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Premium D-Day</span>
            <span className="text-xs font-black text-slate-900">
              {dDay !== null && dDay >= 0 ? `D-${dDay}` : "만료됨"}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <div className="flex flex-col min-w-[80px]">
            <div className="flex justify-between items-end mb-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Daily Usage</span>
              <span className="text-[10px] font-black text-indigo-600">{usageCount}/{limit}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 rounded-full ${
                  usageCount >= limit ? 'bg-rose-500' : 'bg-indigo-600'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <div className="w-px h-8 bg-slate-100" />
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="text-[10px] font-bold text-slate-500">Free</span>
          </div>
        </div>
      )}
    </div>
  );
}
