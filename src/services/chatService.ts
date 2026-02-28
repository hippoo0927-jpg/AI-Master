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
  increment
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
 * 일일 사용량 및 크레딧 체크
 */
export async function checkUsage(userId: string, grade: string) {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) return true;

  const data = userDoc.data() as UserProfile;
  
  // 프리미엄은 제한 없음
  if (grade === 'premium') return true;

  // 크레딧이 있으면 우선 사용 가능
  if (data.free_credits && data.free_credits > 0) return true;

  const now = dayjs();
  const lastReset = data.lastUsageReset ? dayjs(data.lastUsageReset.toDate()) : null;
  
  let currentCount = data.usageCount || 0;

  // 날짜가 바뀌었으면 리셋
  if (!lastReset || !now.isSame(lastReset, 'day')) {
    await updateDoc(userRef, {
      usageCount: 0,
      lastUsageReset: serverTimestamp()
    });
    return true;
  }

  // 무료 사용자는 일일 5회 제한
  return currentCount < 5;
}

/**
 * 사용량 차감 또는 증가
 */
export async function incrementUsage(userId: string) {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) return;

    const data = userDoc.data() as UserProfile;
    
    // 크레딧이 있으면 크레딧 차감
    if (data.free_credits && data.free_credits > 0) {
      await updateDoc(userRef, {
        free_credits: increment(-1)
      });
      return;
    }

    // 크레딧 없으면 일일 사용량 증가
    const currentCount = data.usageCount || 0;
    await updateDoc(userRef, {
      usageCount: currentCount + 1,
      lastUsageReset: serverTimestamp()
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
    if (userData.coupon_used) throw new Error("이미 쿠폰을 사용한 계정입니다.");

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
      coupon_used: true
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
