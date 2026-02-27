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
  setDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import dayjs from 'dayjs';

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
 * 일일 사용량 체크 및 업데이트
 */
export async function checkAndUpdateUsage(userId: string, grade: string) {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) return true;

  const data = userDoc.data();
  const now = dayjs();
  const lastReset = data.lastUsageReset ? dayjs(data.lastUsageReset.toDate()) : null;
  
  let currentCount = data.usageCount || 0;

  // 날짜가 바뀌었으면 리셋
  if (!lastReset || !now.isSame(lastReset, 'day')) {
    currentCount = 0;
    await updateDoc(userRef, {
      usageCount: 0,
      lastUsageReset: serverTimestamp()
    });
  }

  // 프리미엄은 제한 없음 (또는 매우 높음)
  if (grade === 'premium') return true;

  // 무료 사용자는 일일 5회 제한
  if (currentCount >= 5) {
    return false;
  }

  // 사용량 증가
  await updateDoc(userRef, {
    usageCount: currentCount + 1,
    lastUsageReset: serverTimestamp()
  });

  return true;
}
