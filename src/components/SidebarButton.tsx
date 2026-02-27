import { History, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface SidebarButtonProps {
  isOpen: boolean;
  onClick: () => void;
  className?: string;
}

export default function SidebarButton({ isOpen, onClick, className }: SidebarButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "fixed top-20 left-4 z-[80] p-3 bg-white border border-slate-200 rounded-2xl shadow-lg hover:shadow-xl transition-all group",
        isOpen ? "left-[296px] lg:left-[296px]" : "left-4",
        className
      )}
      title={isOpen ? "사이드바 닫기" : "대화 기록 보기"}
    >
      {isOpen ? (
        <X className="w-5 h-5 text-slate-600 group-hover:text-rose-500 transition-colors" />
      ) : (
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-slate-600 group-hover:text-indigo-600 transition-colors" />
          <span className="text-xs font-bold text-slate-600 group-hover:text-indigo-600 hidden md:block">대화 기록</span>
        </div>
      )}
    </button>
  );
}
