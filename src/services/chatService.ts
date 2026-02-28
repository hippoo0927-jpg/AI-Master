import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  setDoc,
  where,
  getDocs,
  Timestamp,
  increment,
  arrayUnion
} from 'firebase/firestore';
import { db } from '../firebase';
import dayjs from 'dayjs';
import { UserProfile, Coupon } from '../types';

export interface ChatHistoryItem {
  id: string;
  userInput: string;
  category: string;
  result: any;
  timestamp: any;
}

/**
 * 대화 내용 저장
 */
export async function saveChatHistory(userId: string, userInput: string, category: string, result: any) {
  try {
    const historyRef = collection(db, 'chats', userId, 'history');
    await addDoc(historyRef, {
      userInput,
      category,
      result,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error("Error saving chat history:", error);
  }
}

/**
 * 최근 대화 목록 가져오기 (실시간)
 */
export function subscribeToChatHistory(userId: string, callback: (history: ChatHistoryItem[]) => void) {
  const historyRef = collection(db, 'chats', userId, 'history');
  const q = query(historyRef, orderBy('timestamp', 'desc'), limit(5));

  return onSnapshot(q, (snapshot) => {
    const history = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ChatHistoryItem[];
    callback(history);
  });
}

/**
 * 일일 사용량 및 크레딧 체크 (일반 채팅용)
 */
export async function checkUsage(userId: string, grade: string) {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) return true;

  const data = userDoc.data() as UserProfile;
  
  // 프리미엄은 일반 채팅 제한 없음
  if (grade === 'premium') return true;

  const now = dayjs();
  const lastReset = data.last_reset_date ? dayjs(data.last_reset_date.toDate()) : null;
  
  let currentCount = data.daily_count || 0;

  // 날짜가 바뀌었으면 리셋
  if (!lastReset || !now.isSame(lastReset, 'day')) {
    await updateDoc(userRef, {
      daily_count: 0,
      last_reset_date: serverTimestamp()
    });
    return true;
  }

  // 무료 사용자는 일반 채팅 일일 5회 제한
  return currentCount < 5;
}

/**
 * 일반 채팅 사용량 증가 (free_credits 차감 없음)
 */
export async function incrementUsage(userId: string) {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) return;

    const data = userDoc.data() as UserProfile;
    
    // 일반 채팅은 daily_count만 증가
    const currentCount = data.daily_count || 0;
    await updateDoc(userRef, {
      daily_count: currentCount + 1,
      last_reset_date: serverTimestamp()
    });
  } catch (error) {
    console.error("Error incrementing usage:", error);
  }
}

/**
 * 쿠폰 등록 및 혜택 지급
 */
export async function useCoupon(userId: string, code: string) {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) throw new Error("사용자를 찾을 수 없습니다.");

    const userData = userDoc.data() as UserProfile;
    const usedCoupons = userData.used_coupons || [];
    if (usedCoupons.includes(code.trim())) {
      throw new Error("이미 사용한 쿠폰 번호입니다.");
    }

    // 쿠폰 조회
    const couponsRef = collection(db, 'coupons');
    const q = query(couponsRef, where('code', '==', code.trim()));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) throw new Error("유효하지 않은 쿠폰 코드입니다.");

    const couponDoc = querySnapshot.docs[0];
    const couponData = couponDoc.data() as Coupon;

    // 만료 체크
    if (couponData.expiryDate && dayjs().isAfter(dayjs(couponData.expiryDate.toDate()))) {
      throw new Error("만료된 쿠폰입니다.");
    }

    // 혜택 지급
    await updateDoc(userRef, {
      free_credits: increment(couponData.benefit_credits || 0),
      used_coupons: arrayUnion(code.trim())
    });

    // 쿠폰 사용 횟수 증가
    await updateDoc(doc(db, 'coupons', couponDoc.id), {
      usedCount: increment(1)
    });

    return couponData.benefit_credits;
  } catch (error: any) {
    throw error;
  }
}
