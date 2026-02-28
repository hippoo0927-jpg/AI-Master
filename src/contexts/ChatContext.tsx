import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  limit
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { SupportChat } from '../types';

interface ChatContextType {
  activeChat: SupportChat | null;
  unreadCount: number;
  playUserSound: () => void;
  playAdminSound: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeChat, setActiveChat] = useState<SupportChat | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const isFirstLoad = useRef(true);
  const lastPlayedId = useRef<string | null>(null);

  const playUserSound = useCallback(() => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
    audio.play().catch(e => console.log('Audio play blocked:', e));
  }, []);

  const playAdminSound = useCallback(() => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.play().catch(e => console.log('Audio play blocked:', e));
  }, []);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        const chatsRef = collection(db, 'support_chats');
        const q = query(
          chatsRef,
          where('userId', '==', user.uid),
          where('status', 'in', ['ai', 'manual', 'request_admin']),
          orderBy('lastMessageAt', 'desc'),
          limit(1)
        );

        const unsubscribeChat = onSnapshot(q, (snapshot) => {
          if (!snapshot.empty) {
            const chatDoc = snapshot.docs[0];
            const chatData = { id: chatDoc.id, ...chatDoc.data() } as SupportChat;
            
            // Notification logic
            if (!isFirstLoad.current) {
              const lastMsg = chatData.messages[chatData.messages.length - 1];
              if (lastMsg && (lastMsg.role === 'model' || lastMsg.role === 'admin')) {
                const msgId = `${chatData.id}_${lastMsg.timestamp?.toMillis() || Date.now()}`;
                if (msgId !== lastPlayedId.current) {
                  playUserSound();
                  lastPlayedId.current = msgId;
                }
              }
            }
            
            setActiveChat(chatData);
            setUnreadCount(chatData.unreadByUser ? 1 : 0);
          } else {
            setActiveChat(null);
            setUnreadCount(0);
          }
          isFirstLoad.current = false;
        });

        return () => unsubscribeChat();
      } else {
        setActiveChat(null);
        setUnreadCount(0);
        isFirstLoad.current = true;
        lastPlayedId.current = null;
      }
    });

    return () => unsubscribeAuth();
  }, [playUserSound]);

  return (
    <ChatContext.Provider value={{ activeChat, unreadCount, playUserSound, playAdminSound }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
