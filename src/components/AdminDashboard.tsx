import { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Calendar, 
  ShieldAlert, 
  ArrowRight, 
  Trash2, 
  Filter,
  Clock,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { 
  getFirestore, 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  updateDoc, 
  Timestamp,
  where
} from 'firebase/firestore';
import dayjs from 'dayjs';

interface UserData {
  id: string;
  email: string;
  grade: 'free' | 'premium';
  expiryDate?: Timestamp;
  createdAt?: Timestamp;
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [filterPremium, setFilterPremium] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const db = getFirestore();

  useEffect(() => {
    const usersRef = collection(db, 'users');
    const q = filterPremium 
      ? query(usersRef, where('grade', '==', 'premium'))
      : query(usersRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserData[];
      setUsers(usersData);
    });

    return () => unsubscribe();
  }, [filterPremium, db]);

  const updateSubscription = async (userId: string, months: number | null) => {
    const userRef = doc(db, 'users', userId);
    if (months === null) {
      // 권한 회수
      await updateDoc(userRef, {
        grade: 'free',
        expiryDate: null
      });
    } else {
      // 기간 부여
      const expiryDate = dayjs().add(months * 30, 'day').toDate();
      await updateDoc(userRef, {
        grade: 'premium',
        expiryDate: Timestamp.fromDate(expiryDate)
      });
    }
  };

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDDay = (expiryDate?: Timestamp) => {
    if (!expiryDate) return null;
    const now = dayjs();
    const expiry = dayjs(expiryDate.toDate());
    const diff = expiry.diff(now, 'day');
    return diff;
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
            <ShieldAlert className="text-white w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">관리자 대시보드</h2>
            <p className="text-xs text-slate-500">사용자 구독 권한 및 기간 관리</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="이메일 검색..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all w-64"
            />
          </div>
          <button 
            onClick={() => setFilterPremium(!filterPremium)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
              filterPremium 
                ? "bg-indigo-600 text-white border-indigo-600 shadow-md" 
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Filter className="w-4 h-4" />
            프리미엄만
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase tracking-widest font-bold">
              <th className="px-6 py-4">사용자 정보</th>
              <th className="px-6 py-4">현재 등급</th>
              <th className="px-6 py-4">남은 기간</th>
              <th className="px-6 py-4 text-right">권한 관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredUsers.map((user) => {
              const dDay = getDDay(user.expiryDate);
              return (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                        {user.email?.[0].toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-slate-700">{user.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${
                      user.grade === 'premium' 
                        ? "bg-amber-50 text-amber-600 border-amber-100" 
                        : "bg-slate-100 text-slate-500 border-slate-200"
                    }`}>
                      {user.grade === 'premium' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {user.grade}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {user.grade === 'premium' && user.expiryDate ? (
                      <div className="flex flex-col">
                        <span className={`text-sm font-bold ${dDay !== null && dDay < 7 ? "text-rose-500" : "text-slate-700"}`}>
                          {dDay !== null ? (dDay < 0 ? "만료됨" : `남은 기간: ${dDay}일`) : "-"}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          종료: {dayjs(user.expiryDate.toDate()).format('YYYY-MM-DD')}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => updateSubscription(user.id, 1)}
                        className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-all border border-indigo-100"
                      >
                        1개월
                      </button>
                      <button 
                        onClick={() => updateSubscription(user.id, 6)}
                        className="px-3 py-1.5 bg-amber-50 text-amber-600 rounded-lg text-xs font-bold hover:bg-amber-100 transition-all border border-amber-100"
                      >
                        6개월
                      </button>
                      <button 
                        onClick={() => updateSubscription(user.id, null)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                        title="권한 회수"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredUsers.length === 0 && (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-medium">사용자가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
