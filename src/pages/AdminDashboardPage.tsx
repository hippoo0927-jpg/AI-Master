import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Ticket, 
  Megaphone, 
  Headset, 
  LayoutDashboard, 
  Settings, 
  LogOut, 
  Search, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Filter,
  ShieldAlert,
  ArrowRight,
  UserCheck,
  Star,
  MessageSquare,
  Send,
  Loader2
} from 'lucide-react';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  updateDoc, 
  addDoc, 
  deleteDoc, 
  Timestamp, 
  where, 
  orderBy,
  serverTimestamp,
  getDocs
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);
import { UserProfile, Coupon, Notice, Expert, SupportChat, ChatMessage } from '../types';
import { cn } from '../lib/utils';
import { useChat } from '../contexts/ChatContext';

type AdminTab = 'users' | 'coupons' | 'experts' | 'cs';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate('/');
        return;
      }

      if (user.email === 'hippoo0927@gmail.com') {
        setIsAdmin(true);
        setIsLoading(false);
        return;
      }

      const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', user.uid)));
      if (!userDoc.empty && userDoc.docs[0].data().role === 'admin') {
        setIsAdmin(true);
      } else {
        navigate('/');
      }
      setIsLoading(false);
    };

    checkAdmin();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-72 bg-slate-900 text-white flex flex-col shrink-0">
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg">Admin Center</h1>
            <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest">Master Architect</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          <SidebarItem 
            icon={Users} 
            label="사용자 관리" 
            active={activeTab === 'users'} 
            onClick={() => setActiveTab('users')} 
          />
          <SidebarItem 
            icon={Ticket} 
            label="쿠폰/공지 관리" 
            active={activeTab === 'coupons'} 
            onClick={() => setActiveTab('coupons')} 
          />
          <SidebarItem 
            icon={UserCheck} 
            label="전문가 관리" 
            active={activeTab === 'experts'} 
            onClick={() => setActiveTab('experts')} 
          />
          <SidebarItem 
            icon={Headset} 
            label="CS 센터" 
            active={activeTab === 'cs'} 
            onClick={() => setActiveTab('cs')} 
          />
        </nav>

        <div className="p-6 border-t border-white/5">
          <button 
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            메인으로 돌아가기
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-12">
        <AnimatePresence mode="wait">
          {activeTab === 'users' && <UserManagementTab key="users" />}
          {activeTab === 'coupons' && <CouponNoticeTab key="coupons" />}
          {activeTab === 'experts' && <ExpertManagementTab key="experts" />}
          {activeTab === 'cs' && <CSCenterTab key="cs" />}
        </AnimatePresence>
      </main>
    </div>
  );
}

function SidebarItem({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all text-sm font-bold",
        active 
          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" 
          : "text-slate-400 hover:text-white hover:bg-white/5"
      )}
    >
      <Icon className="w-5 h-5" />
      {label}
    </button>
  );
}

// --- Tab Components ---

function UserManagementTab() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })) as UserProfile[]);
    });
  }, []);

  const updateGrade = async (uid: string, grade: 'free' | 'premium', months?: number) => {
    const userRef = doc(db, 'users', uid);
    if (grade === 'free') {
      await updateDoc(userRef, { grade: 'free', expiryDate: null });
    } else {
      const expiryDate = dayjs().add(months || 1, 'month').toDate();
      await updateDoc(userRef, { grade: 'premium', expiryDate: Timestamp.fromDate(expiryDate) });
    }
  };

  const filteredUsers = users.filter(u => u.email?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">사용자 관리</h2>
          <p className="text-slate-500">전체 사용자 목록 및 구독 권한 관리</p>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="이메일 검색..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-2xl w-80 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase tracking-widest font-black text-slate-400">
              <th className="px-8 py-5">사용자</th>
              <th className="px-8 py-5">등급 / 크레딧</th>
              <th className="px-8 py-5">만료일</th>
              <th className="px-8 py-5 text-right">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredUsers.map(user => (
              <tr key={user.uid} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500">
                      {user.email?.[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{user.email}</div>
                      <div className="text-xs text-slate-400">UID: {user.uid.substring(0, 8)}...</div>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex flex-col gap-1">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase border w-fit",
                      user.grade === 'premium' ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-slate-100 text-slate-500 border-slate-200"
                    )}>
                      {user.grade}
                    </span>
                    <span className="text-xs font-bold text-indigo-600">{user.free_credits || 0} Credits</span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  {user.expiryDate ? (
                    <div className="text-sm">
                      <div className="font-bold text-slate-700">{dayjs(user.expiryDate.toDate()).format('YYYY-MM-DD')}</div>
                      <div className="text-[10px] text-rose-500 font-bold uppercase tracking-tighter">
                        D-{dayjs(user.expiryDate.toDate()).diff(dayjs(), 'day')}
                      </div>
                    </div>
                  ) : "-"}
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => updateGrade(user.uid, 'premium', 1)} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold border border-indigo-100">1개월</button>
                    <button onClick={() => updateGrade(user.uid, 'premium', 6)} className="px-3 py-1.5 bg-amber-50 text-amber-600 rounded-lg text-xs font-bold border border-amber-100">6개월</button>
                    <button onClick={() => updateGrade(user.uid, 'free')} className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><XCircle className="w-5 h-5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

function CouponNoticeTab() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [newCoupon, setNewCoupon] = useState({ code: '', benefit: 10, months: 1 });
  const [newNotice, setNewNotice] = useState({ title: '', content: '', isPopup: false, targetUid: '' });

  useEffect(() => {
    const unsubCoupons = onSnapshot(query(collection(db, 'coupons'), orderBy('createdAt', 'desc')), (s) => {
      setCoupons(s.docs.map(d => ({ id: d.id, ...d.data() })) as Coupon[]);
    });
    const unsubNotices = onSnapshot(query(collection(db, 'notices'), orderBy('createdAt', 'desc')), (s) => {
      setNotices(s.docs.map(d => ({ id: d.id, ...d.data() })) as Notice[]);
    });
    return () => { unsubCoupons(); unsubNotices(); };
  }, []);

  const addCoupon = async () => {
    if (!newCoupon.code) return;
    await addDoc(collection(db, 'coupons'), {
      code: newCoupon.code.toUpperCase(),
      benefit_credits: newCoupon.benefit,
      expiryDate: Timestamp.fromDate(dayjs().add(newCoupon.months, 'month').toDate()),
      createdAt: serverTimestamp(),
      usedCount: 0
    });
    setNewCoupon({ code: '', benefit: 10, months: 1 });
  };

  const addNotice = async () => {
    if (!newNotice.title) return;
    await addDoc(collection(db, 'notices'), {
      ...newNotice,
      createdAt: serverTimestamp(),
      active: true
    });
    setNewNotice({ title: '', content: '', isPopup: false, targetUid: '' });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 gap-12">
      {/* Coupons */}
      <div className="space-y-8">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <Ticket className="text-indigo-600" /> 쿠폰 관리
        </h2>
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">쿠폰 코드</label>
              <input 
                type="text" placeholder="예: WELCOME" 
                value={newCoupon.code} onChange={e => setNewCoupon({...newCoupon, code: e.target.value})}
                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">지급 크레딧</label>
              <input 
                type="number" placeholder="10" 
                value={newCoupon.benefit} onChange={e => setNewCoupon({...newCoupon, benefit: Number(e.target.value)})}
                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <button onClick={addCoupon} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">쿠폰 생성</button>
        </div>
        <div className="space-y-3">
          {coupons.map(c => (
            <div key={c.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
              <div>
                <div className="font-bold text-slate-900">{c.code}</div>
                <div className="text-xs text-slate-400">{c.benefit_credits} Credits • 사용: {c.usedCount}회</div>
              </div>
              <button onClick={() => deleteDoc(doc(db, 'coupons', c.id))} className="p-2 text-slate-300 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </div>

      {/* Notices */}
      <div className="space-y-8">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <Megaphone className="text-amber-500" /> 공지사항 관리
        </h2>
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
          <input 
            type="text" placeholder="공지 제목" 
            value={newNotice.title} onChange={e => setNewNotice({...newNotice, title: e.target.value})}
            className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <textarea 
            placeholder="공지 내용" 
            value={newNotice.content} onChange={e => setNewNotice({...newNotice, content: e.target.value})}
            className="w-full h-32 px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
          <input 
            type="text" placeholder="대상 UID (비워두면 전체 공지)" 
            value={newNotice.targetUid} onChange={e => setNewNotice({...newNotice, targetUid: e.target.value})}
            className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={newNotice.isPopup} onChange={e => setNewNotice({...newNotice, isPopup: e.target.checked})} className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
            <span className="text-sm font-bold text-slate-600">팝업으로 띄우기</span>
          </label>
          <button onClick={addNotice} className="w-full py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-all shadow-lg shadow-amber-200">공지 등록</button>
        </div>
        <div className="space-y-3">
          {notices.map(n => (
            <div key={n.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
              <div>
                <div className="font-bold text-slate-900">{n.title}</div>
                <div className="text-xs text-slate-400">{n.isPopup ? '팝업' : '일반'} • {dayjs(n.createdAt?.toDate()).format('MM/DD')}</div>
              </div>
              <button onClick={() => deleteDoc(doc(db, 'notices', n.id))} className="p-2 text-slate-300 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function ExpertManagementTab() {
  const [experts, setExperts] = useState<Expert[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentExpert, setCurrentExpert] = useState<Partial<Expert>>({
    name: '', title: '', techStack: [], description: '', caseStudies: []
  });

  useEffect(() => {
    return onSnapshot(collection(db, 'experts'), (s) => {
      setExperts(s.docs.map(d => ({ id: d.id, ...d.data() })) as Expert[]);
    });
  }, []);

  const saveExpert = async () => {
    if (!currentExpert.name) return;
    if (currentExpert.id) {
      await updateDoc(doc(db, 'experts', currentExpert.id), currentExpert);
    } else {
      await addDoc(collection(db, 'experts'), {
        ...currentExpert,
        consultationCount: 0,
        rating: 5.0,
        profileImage: `https://picsum.photos/seed/${currentExpert.name}/200/200`
      });
    }
    setIsEditing(false);
    setCurrentExpert({ name: '', title: '', techStack: [], description: '', caseStudies: [] });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">전문가 관리</h2>
          <p className="text-slate-500">플랫폼 파트너 전문가 프로필 및 포트폴리오 관리</p>
        </div>
        <button 
          onClick={() => { setIsEditing(true); setCurrentExpert({ name: '', title: '', techStack: [], description: '', caseStudies: [] }); }}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
        >
          <Plus className="w-5 h-5" /> 전문가 등록
        </button>
      </div>

      {isEditing && (
        <div className="bg-white p-8 rounded-[2rem] border border-indigo-200 shadow-xl space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">이름</label>
              <input 
                type="text" placeholder="이름" value={currentExpert.name} onChange={e => setCurrentExpert({...currentExpert, name: e.target.value})}
                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">직함</label>
              <input 
                type="text" placeholder="직함 (예: 시니어 아키텍트)" value={currentExpert.title} onChange={e => setCurrentExpert({...currentExpert, title: e.target.value})}
                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">기술 스택 (쉼표로 구분)</label>
            <input 
              type="text" 
              placeholder="React, Firebase, Node.js..." 
              value={currentExpert.techStack?.join(', ')} 
              onChange={e => setCurrentExpert({...currentExpert, techStack: e.target.value.split(',').map(s => s.trim()).filter(s => s)})}
              className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">전문가 소개</label>
            <textarea 
              placeholder="전문가 소개" value={currentExpert.description} onChange={e => setCurrentExpert({...currentExpert, description: e.target.value})}
              className="w-full h-32 px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">포트폴리오 (Case Studies)</label>
              <button 
                onClick={() => setCurrentExpert({
                  ...currentExpert, 
                  caseStudies: [...(currentExpert.caseStudies || []), { title: '', description: '', result: '' }]
                })}
                className="text-xs font-bold text-indigo-600 hover:underline"
              >
                + 항목 추가
              </button>
            </div>
            <div className="space-y-4">
              {currentExpert.caseStudies?.map((cs, idx) => (
                <div key={idx} className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 relative">
                  <button 
                    onClick={() => {
                      const newCS = [...(currentExpert.caseStudies || [])];
                      newCS.splice(idx, 1);
                      setCurrentExpert({...currentExpert, caseStudies: newCS});
                    }}
                    className="absolute top-4 right-4 text-rose-500 hover:text-rose-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <input 
                    type="text" placeholder="프로젝트 제목" value={cs.title} 
                    onChange={e => {
                      const newCS = [...(currentExpert.caseStudies || [])];
                      newCS[idx].title = e.target.value;
                      setCurrentExpert({...currentExpert, caseStudies: newCS});
                    }}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg outline-none"
                  />
                  <textarea 
                    placeholder="프로젝트 설명" value={cs.description} 
                    onChange={e => {
                      const newCS = [...(currentExpert.caseStudies || [])];
                      newCS[idx].description = e.target.value;
                      setCurrentExpert({...currentExpert, caseStudies: newCS});
                    }}
                    className="w-full h-20 px-4 py-2 bg-white border border-slate-200 rounded-lg outline-none resize-none"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <button onClick={() => setIsEditing(false)} className="px-6 py-3 text-slate-500 font-bold">취소</button>
            <button onClick={saveExpert} className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200">저장하기</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {experts.map(ex => (
          <div key={ex.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm group">
            <div className="flex items-center gap-4 mb-4">
              <img src={ex.profileImage} alt={ex.name} className="w-16 h-16 rounded-2xl object-cover" />
              <div>
                <h3 className="font-bold text-slate-900">{ex.name}</h3>
                <p className="text-xs text-slate-500">{ex.title}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-400 mb-6">
              <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400 fill-amber-400" /> {ex.rating}</span>
              <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {ex.consultationCount}회 상담</span>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => { setCurrentExpert(ex); setIsEditing(true); }} className="p-2 text-slate-400 hover:text-indigo-600"><Settings className="w-5 h-5" /></button>
              <button onClick={() => deleteDoc(doc(db, 'experts', ex.id))} className="p-2 text-slate-400 hover:text-rose-500"><Trash2 className="w-5 h-5" /></button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function CSCenterTab() {
  const [chats, setChats] = useState<SupportChat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [showClosed, setShowClosed] = useState(false);
  const { playAdminSound } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const isFirstLoad = useRef(true);
  const lastPlayedId = useRef<string | null>(null);

  useEffect(() => {
    const chatsRef = collection(db, 'support_chats');
    const q = showClosed 
      ? query(chatsRef, where('status', '==', 'closed'), orderBy('lastMessageAt', 'desc'))
      : query(chatsRef, where('status', 'in', ['ai', 'manual', 'request_admin']), orderBy('lastMessageAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newChats = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as SupportChat[];
      
      if (!isFirstLoad.current && !showClosed) {
        snapshot.docChanges().forEach(change => {
          if (change.type === 'modified' || change.type === 'added') {
            const chat = { id: change.doc.id, ...change.doc.data() } as SupportChat;
            const lastMsg = chat.messages[chat.messages.length - 1];
            
            // Play sound only if unreadByAdmin is true AND it's a new message from user
            if (chat.unreadByAdmin && lastMsg && lastMsg.role === 'user') {
              const msgId = `${chat.id}_${lastMsg.timestamp?.toMillis() || Date.now()}`;
              if (msgId !== lastPlayedId.current) {
                playAdminSound();
                lastPlayedId.current = msgId;
              }
            }
          }
        });
      }

      setChats(newChats);
      isFirstLoad.current = false;
    });
    return () => {
      unsubscribe();
      isFirstLoad.current = true;
      lastPlayedId.current = null;
    };
  }, [showClosed, playAdminSound]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [selectedChatId, chats]);

  const filteredChats = chats; // Already filtered by query
  const selectedChat = chats.find(c => c.id === selectedChatId);

  const sendReply = async () => {
    if (!selectedChat || !reply.trim()) return;

    const adminMessage: ChatMessage = {
      role: 'admin',
      content: reply,
      timestamp: Timestamp.now()
    };

    // Takeover logic: set status to manual if it was ai or request_admin
    const newStatus = selectedChat.status === 'closed' ? 'closed' : 'manual';

    await updateDoc(doc(db, 'support_chats', selectedChat.id), {
      messages: [...selectedChat.messages, adminMessage],
      status: newStatus,
      lastMessageAt: serverTimestamp(),
      unreadByAdmin: false,
      unreadByUser: true
    });
    setReply('');
  };

  const updateStatus = async (id: string, status: SupportChat['status']) => {
    await updateDoc(doc(db, 'support_chats', id), { status });
  };

  const completeChat = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await updateDoc(doc(db, 'support_chats', id), { 
      status: 'closed',
      unreadByAdmin: false
    });
    if (selectedChatId === id) setSelectedChatId(null);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="h-[calc(100vh-160px)] flex gap-8">
      {/* Chat List */}
      <div className="w-96 bg-white rounded-[2rem] border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-600" /> {showClosed ? '종료된 상담' : '활성 상담 목록'}
          </h3>
          <button 
            onClick={() => setShowClosed(!showClosed)}
            className="text-[10px] font-bold text-indigo-600 hover:underline"
          >
            {showClosed ? '활성 보기' : '종료 보기'}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {filteredChats.map(chat => (
            <button
              key={chat.id}
              onClick={() => {
                setSelectedChatId(chat.id);
                if (chat.unreadByAdmin) {
                  updateDoc(doc(db, 'support_chats', chat.id), { unreadByAdmin: false });
                }
              }}
              className={cn(
                "w-full p-4 rounded-2xl border transition-all text-left relative group",
                selectedChatId === chat.id 
                  ? "bg-indigo-50 border-indigo-200 shadow-sm" 
                  : "bg-white border-slate-100 hover:border-indigo-200"
              )}
            >
              {chat.unreadByAdmin && (
                <span className="absolute top-4 right-4 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white animate-pulse" />
              )}
              <div className="flex justify-between items-start mb-1">
                <span className="text-xs font-bold text-slate-400 truncate max-w-[150px]">{chat.userEmail}</span>
                <span className="text-[10px] text-slate-400">{dayjs(chat.lastMessageAt?.toDate()).fromNow()}</span>
              </div>
              <div className="text-sm font-medium text-slate-700 line-clamp-1 mb-2">
                {chat.messages[chat.messages.length - 1]?.content}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider",
                    chat.status === 'ai' ? "bg-emerald-100 text-emerald-600" :
                    chat.status === 'request_admin' ? "bg-amber-100 text-amber-600" :
                    chat.status === 'manual' ? "bg-blue-100 text-blue-600" :
                    "bg-slate-100 text-slate-600"
                  )}>
                    {chat.status === 'closed' ? '상담 종료' : chat.status}
                  </span>
                </div>
                {!showClosed && (
                  <button 
                    onClick={(e) => completeChat(e, chat.id)}
                    className="text-[10px] font-bold text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity hover:underline"
                  >
                    상담 완료
                  </button>
                )}
              </div>
            </button>
          ))}
          {filteredChats.length === 0 && (
            <div className="text-center py-10 text-slate-300 text-sm">
              {showClosed ? '종료된 상담이 없습니다.' : '활성 상담이 없습니다.'}
            </div>
          )}
        </div>
      </div>

      {/* Chat Detail */}
      <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        {selectedChat ? (
          <>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-900">{selectedChat.userEmail}</h3>
                <p className="text-xs text-slate-400">UID: {selectedChat.userId}</p>
              </div>
              <div className="flex gap-2">
                <select 
                  value={selectedChat.status}
                  onChange={(e) => updateStatus(selectedChat.id, e.target.value as any)}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ai">AI 모드</option>
                  <option value="manual">상담원 모드</option>
                  <option value="request_admin">연결 요청</option>
                  <option value="closed">종료</option>
                </select>
              </div>
            </div>
            
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/30 custom-scrollbar">
              {selectedChat.messages.map((msg, idx) => (
                <div key={idx} className={cn(
                  "flex flex-col",
                  msg.role === 'user' ? "items-start" : "items-end"
                )}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {msg.role === 'user' ? 'User' : msg.role === 'admin' ? 'Admin' : 'AI Architect'}
                    </span>
                    <span className="text-[10px] text-slate-300">
                      {dayjs(msg.timestamp?.toDate()).format('HH:mm')}
                    </span>
                  </div>
                  <div className={cn(
                    "max-w-[70%] p-4 rounded-2xl text-sm shadow-sm",
                    msg.role === 'user' 
                      ? "bg-white border border-slate-200 text-slate-700 rounded-tl-none" 
                      : msg.role === 'admin'
                        ? "bg-indigo-600 text-white rounded-tr-none"
                        : "bg-slate-800 text-white rounded-tr-none"
                  )}>
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-slate-100 bg-white">
              <div className="flex gap-3">
                <input 
                  type="text"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendReply()}
                  placeholder="답변을 입력하세요... (입력 시 상담원 모드로 전환됩니다)"
                  className="flex-1 px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
                <button 
                  onClick={sendReply}
                  className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2"
                >
                  <Send className="w-4 h-4" /> 전송
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
            <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
            <p className="font-medium">상담을 선택해주세요</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
