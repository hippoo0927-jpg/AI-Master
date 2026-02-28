import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Megaphone, Check } from 'lucide-react';
import { Notice } from '../types';
import dayjs from 'dayjs';

interface NoticePopupProps {
  notice: Notice | null;
}

export default function NoticePopup({ notice }: NoticePopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dontShowToday, setDontShowToday] = useState(false);

  useEffect(() => {
    if (!notice) {
      setIsOpen(false);
      return;
    }

    const storageKey = `notice_closed_${notice.id}`;
    const closedData = localStorage.getItem(storageKey);

    if (closedData) {
      const { timestamp } = JSON.parse(closedData);
      const isExpired = dayjs().isAfter(dayjs(timestamp).add(1, 'day'));
      
      if (!isExpired) {
        setIsOpen(false);
        return;
      }
    }

    setIsOpen(true);
  }, [notice]);

  const handleClose = () => {
    if (notice) {
      if (dontShowToday) {
        const storageKey = `notice_closed_${notice.id}`;
        localStorage.setItem(storageKey, JSON.stringify({
          id: notice.id,
          timestamp: new Date().toISOString()
        }));
      }
    }
    setIsOpen(false);
  };

  if (!notice || !isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200"
          >
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center">
                    <Megaphone className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">공지사항</h3>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">Notice & Updates</p>
                  </div>
                </div>
                <button 
                  onClick={handleClose}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="space-y-4 mb-8">
                <h4 className="text-lg font-bold text-slate-800 leading-tight">
                  {notice.title}
                </h4>
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-slate-600 text-sm leading-relaxed whitespace-pre-wrap max-h-[300px] overflow-y-auto custom-scrollbar">
                  {notice.content}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input 
                      type="checkbox" 
                      checked={dontShowToday}
                      onChange={(e) => setDontShowToday(e.target.checked)}
                      className="peer appearance-none w-5 h-5 border-2 border-slate-200 rounded-md checked:bg-indigo-600 checked:border-indigo-600 transition-all"
                    />
                    <Check className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 left-0.5 transition-opacity" />
                  </div>
                  <span className="text-sm font-bold text-slate-500 group-hover:text-slate-700 transition-colors">오늘 하루 보지 않기</span>
                </label>

                <button
                  onClick={handleClose}
                  className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2"
                >
                  확인했습니다
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
