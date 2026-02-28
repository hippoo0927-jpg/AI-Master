import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { Notice } from '../types';
import dayjs from 'dayjs';

interface NoticeCarouselProps {
  notices: Notice[];
  onClose: () => void;
  onHideToday: (id: string) => void;
}

export default function NoticeCarousel({ notices, onClose, onHideToday }: NoticeCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (notices.length === 0) return null;

  const currentNotice = notices[currentIndex];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % notices.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + notices.length) % notices.length);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-indigo-600" />
            </div>
            <h3 className="font-bold text-slate-900">공지사항</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content Area with Animation */}
        <div className="relative flex-1 min-h-[300px] flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentNotice.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-8 flex-1 overflow-y-auto custom-scrollbar"
            >
              <h4 className="text-xl font-bold text-slate-900 mb-4">{currentNotice.title}</h4>
              <div className="text-slate-600 leading-relaxed whitespace-pre-wrap text-sm">
                {currentNotice.content}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Arrows */}
          {notices.length > 1 && (
            <>
              <button 
                onClick={handlePrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 border border-slate-100 rounded-full shadow-md hover:bg-white transition-all text-slate-600 z-10"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={handleNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 border border-slate-100 rounded-full shadow-md hover:bg-white transition-all text-slate-600 z-10"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col gap-4">
          {/* Indicators */}
          {notices.length > 1 && (
            <div className="flex justify-center gap-1.5">
              {notices.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    idx === currentIndex ? "w-4 bg-indigo-600" : "bg-slate-300"
                  }`}
                />
              ))}
            </div>
          )}

          <div className="flex justify-between items-center">
            <button 
              onClick={() => onHideToday(currentNotice.id)}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1"
            >
              오늘 하루 보지 않기
            </button>
            <button 
              onClick={onClose}
              className="px-6 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all"
            >
              닫기
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
