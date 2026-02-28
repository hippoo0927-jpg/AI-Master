import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Star, 
  MessageSquare, 
  Search, 
  Filter, 
  ArrowRight, 
  CheckCircle2, 
  Award, 
  Briefcase,
  ChevronRight,
  User,
  X,
  Send,
  ThumbsUp,
  Loader2
} from 'lucide-react';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  addDoc, 
  serverTimestamp, 
  where,
  Timestamp,
  doc,
  updateDoc,
  increment
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Expert, Review } from '../types';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import dayjs from 'dayjs';

export default function ExpertsPage() {
  const [experts, setExperts] = useState<Expert[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStack, setSelectedStack] = useState<string>('All');
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'experts'), orderBy('rating', 'desc'));
    return onSnapshot(q, (snapshot) => {
      setExperts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Expert[]);
    });
  }, []);

  useEffect(() => {
    if (selectedExpert) {
      const q = query(
        collection(db, 'reviews'), 
        where('expertId', '==', selectedExpert.id),
        orderBy('createdAt', 'desc')
      );
      return onSnapshot(q, (snapshot) => {
        setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Review[]);
      });
    } else {
      setReviews([]);
    }
  }, [selectedExpert]);

  const allStacks = ['All', ...Array.from(new Set(experts.flatMap(ex => ex.techStack || [])))];

  const filteredExperts = experts.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         ex.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStack = selectedStack === 'All' || (ex.techStack && ex.techStack.includes(selectedStack));
    return matchesSearch && matchesStack;
  });

  const submitReview = async () => {
    if (!auth.currentUser || !selectedExpert || !newReview.comment.trim()) return;
    setIsSubmittingReview(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        expertId: selectedExpert.id,
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        rating: newReview.rating,
        comment: newReview.comment,
        createdAt: serverTimestamp()
      });

      // 전문가 평점 업데이트 (단순 평균 계산은 생략하고 여기서는 간단히 처리)
      const expertRef = doc(db, 'experts', selectedExpert.id);
      await updateDoc(expertRef, {
        consultationCount: increment(1)
      });

      setNewReview({ rating: 5, comment: '' });
    } catch (error) {
      console.error("Error submitting review:", error);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Award className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-slate-900">Expert Marketplace</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">홈</Link>
            <Link to="/expert-chat" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">실시간 상담</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero */}
        <div className="mb-12 text-center max-w-3xl mx-auto">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-black text-slate-900 mb-4 tracking-tight"
          >
            비즈니스 성장을 위한 <span className="text-indigo-600">검증된 전문가</span>를 만나보세요
          </motion.h1>
          <p className="text-slate-500 text-lg">
            아키텍처 설계부터 마케팅 자동화까지, 각 분야 최고의 전문가들이 당신의 프로젝트를 기다리고 있습니다.
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-12">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="전문가 이름, 기술 스택, 분야로 검색..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            {allStacks.map(stack => (
              <button
                key={stack}
                onClick={() => setSelectedStack(stack)}
                className={cn(
                  "px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all border",
                  selectedStack === stack 
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200" 
                    : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
                )}
              >
                {stack}
              </button>
            ))}
          </div>
        </div>

        {/* Expert Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredExperts.map((expert, idx) => (
            <motion.div
              key={expert.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => setSelectedExpert(expert)}
              className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden hover:shadow-2xl hover:shadow-indigo-100 transition-all group cursor-pointer"
            >
              <div className="p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="relative">
                    <img 
                      src={expert.profileImage || `https://picsum.photos/seed/${expert.name}/200/200`} 
                      alt={expert.name} 
                      className="w-20 h-20 rounded-3xl object-cover border-4 border-slate-50"
                    />
                    <div className="absolute -bottom-1 -right-1 bg-emerald-500 border-2 border-white w-5 h-5 rounded-full" />
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1 text-amber-500 font-bold">
                      <Star className="w-4 h-4 fill-amber-500" />
                      {expert.rating.toFixed(1)}
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      {expert.consultationCount} Consultations
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-1 flex items-center gap-2">
                    {expert.name}
                    <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                  </h3>
                  <p className="text-indigo-600 font-bold text-sm">{expert.title}</p>
                </div>

                <p className="text-slate-500 text-sm leading-relaxed mb-6 line-clamp-2">
                  {expert.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-8">
                  {expert.techStack?.slice(0, 3).map(stack => (
                    <span key={stack} className="px-3 py-1 bg-slate-50 text-slate-500 text-[10px] font-bold rounded-lg border border-slate-100 uppercase">
                      {stack}
                    </span>
                  ))}
                  {expert.techStack && expert.techStack.length > 3 && (
                    <span className="px-3 py-1 bg-slate-50 text-slate-400 text-[10px] font-bold rounded-lg border border-slate-100">
                      +{expert.techStack.length - 3}
                    </span>
                  )}
                </div>

                <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center overflow-hidden">
                        <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="user" className="w-full h-full object-cover opacity-80" />
                      </div>
                    ))}
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">
                      +12
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm group-hover:gap-3 transition-all">
                    자세히 보기
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredExperts.length === 0 && (
          <div className="text-center py-24 bg-white rounded-[3rem] border border-dashed border-slate-200">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">검색 결과가 없습니다</h3>
            <p className="text-slate-500">다른 검색어나 필터를 사용해보세요.</p>
          </div>
        )}
      </main>

      {/* Expert Detail Modal */}
      <AnimatePresence>
        {selectedExpert && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedExpert(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row"
            >
              <button 
                onClick={() => setSelectedExpert(null)}
                className="absolute top-6 right-6 z-10 p-2 bg-white/10 hover:bg-slate-100 rounded-full transition-all"
              >
                <X className="w-6 h-6 text-slate-400" />
              </button>

              {/* Left Side: Profile & Info */}
              <div className="w-full md:w-2/5 p-10 bg-slate-50 border-r border-slate-100 overflow-y-auto custom-scrollbar">
                <div className="text-center mb-8">
                  <img 
                    src={selectedExpert.profileImage || `https://picsum.photos/seed/${selectedExpert.name}/200/200`} 
                    alt={selectedExpert.name} 
                    className="w-32 h-32 rounded-[2.5rem] object-cover mx-auto mb-6 border-4 border-white shadow-xl"
                  />
                  <h2 className="text-3xl font-black text-slate-900 mb-2">{selectedExpert.name}</h2>
                  <p className="text-indigo-600 font-bold">{selectedExpert.title}</p>
                </div>

                <div className="space-y-8">
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Expertise</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedExpert.techStack?.map(stack => (
                        <span key={stack} className="px-3 py-1.5 bg-white text-slate-600 text-xs font-bold rounded-xl border border-slate-200 shadow-sm">
                          {stack}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">About</h4>
                    <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                      {selectedExpert.description}
                    </p>
                  </div>

                  <div className="pt-8 border-t border-slate-200">
                    <Link 
                      to="/expert-chat"
                      className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                    >
                      <MessageSquare className="w-5 h-5" />
                      1:1 상담 시작하기
                    </Link>
                  </div>
                </div>
              </div>

              {/* Right Side: Case Studies & Reviews */}
              <div className="flex-1 p-10 overflow-y-auto custom-scrollbar bg-white">
                <div className="space-y-12">
                  {/* Case Studies */}
                  <section>
                    <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-indigo-600" />
                      주요 포트폴리오
                    </h3>
                    <div className="space-y-6">
                      {selectedExpert.caseStudies?.map((cs, idx) => (
                        <div key={idx} className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                          <h4 className="font-bold text-slate-900 mb-2">{cs.title}</h4>
                          <p className="text-slate-500 text-sm leading-relaxed">{cs.description}</p>
                        </div>
                      ))}
                      {(!selectedExpert.caseStudies || selectedExpert.caseStudies.length === 0) && (
                        <p className="text-slate-400 text-sm italic">등록된 포트폴리오가 없습니다.</p>
                      )}
                    </div>
                  </section>

                  {/* Reviews */}
                  <section>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                        고객 리뷰 ({reviews.length})
                      </h3>
                    </div>

                    {/* Review Input */}
                    {auth.currentUser && (
                      <div className="mb-8 p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(star => (
                              <button 
                                key={star} 
                                onClick={() => setNewReview({...newReview, rating: star})}
                                className="focus:outline-none"
                              >
                                <Star className={cn("w-6 h-6 transition-all", star <= newReview.rating ? "text-amber-500 fill-amber-500" : "text-slate-300")} />
                              </button>
                            ))}
                          </div>
                          <span className="text-sm font-bold text-indigo-600">{newReview.rating}점</span>
                        </div>
                        <div className="relative">
                          <textarea 
                            value={newReview.comment}
                            onChange={e => setNewReview({...newReview, comment: e.target.value})}
                            placeholder="상담 후기를 남겨주세요..."
                            className="w-full h-24 p-4 bg-white border border-indigo-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-sm"
                          />
                          <button 
                            onClick={submitReview}
                            disabled={isSubmittingReview || !newReview.comment.trim()}
                            className="absolute bottom-3 right-3 p-2 bg-indigo-600 text-white rounded-xl disabled:opacity-50 hover:bg-indigo-700 transition-all"
                          >
                            {isSubmittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-6">
                      {reviews.map(review => (
                        <div key={review.id} className="flex gap-4 p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                            <User className="w-5 h-5 text-slate-400" />
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <div className="font-bold text-slate-900 text-sm">{review.userEmail.split('@')[0]}***</div>
                                <div className="flex gap-0.5 mt-1">
                                  {[1, 2, 3, 4, 5].map(star => (
                                    <Star key={star} className={cn("w-3 h-3", star <= review.rating ? "text-amber-500 fill-amber-500" : "text-slate-200")} />
                                  ))}
                                </div>
                              </div>
                              <span className="text-[10px] text-slate-400 font-bold">{dayjs(review.createdAt?.toDate()).format('YYYY.MM.DD')}</span>
                            </div>
                            <p className="text-slate-600 text-sm leading-relaxed">{review.comment}</p>
                          </div>
                        </div>
                      ))}
                      {reviews.length === 0 && (
                        <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                          <MessageSquare className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                          <p className="text-slate-400 text-sm">첫 번째 리뷰를 남겨보세요!</p>
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-slate-400 text-sm">© 2024 AI Master Architect. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
