import { Timestamp } from 'firebase/firestore';

export type UserGrade = 'free' | 'premium' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  grade: UserGrade;
  expiryDate: Timestamp | null;
  customApiKey: string | null;
  selectedModel: string;
  daily_count: number;
  free_credits: number;
  used_coupons: string[];
  createdAt: Timestamp;
  last_reset_date: Timestamp | null;
  role?: 'admin' | 'user';
}

export interface Coupon {
  id: string;
  code: string;
  benefit_credits: number;
  expiryDate: Timestamp;
  createdAt: Timestamp;
  usedCount: number;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  targetUid?: string; // If empty, global
  isPopup: boolean;
  createdAt: Timestamp;
  isActive: boolean;
}

export interface Expert {
  id: string;
  name: string;
  title: string;
  profileImage: string;
  techStack: string[];
  caseStudies: CaseStudy[];
  consultationCount: number;
  rating: number;
  description: string;
}

export interface CaseStudy {
  title: string;
  description: string;
  result?: string;
  tags?: string[];
}

export interface Review {
  id: string;
  expertId: string;
  userId: string;
  userEmail: string;
  rating: number;
  comment: string;
  createdAt: Timestamp;
}

export interface SupportChat {
  id: string;
  userId: string;
  userEmail: string;
  messages: ChatMessage[];
  status: 'ai' | 'manual' | 'request_admin' | 'closed';
  lastMessageAt: Timestamp;
  unreadByAdmin: boolean;
  unreadByUser?: boolean;
}

export interface ChatMessage {
  role: 'user' | 'model' | 'admin';
  content: string;
  timestamp: Timestamp;
}
