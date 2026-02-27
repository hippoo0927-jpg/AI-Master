import { 
  History, 
  MessageSquare, 
  ChevronRight, 
  Clock 
} from 'lucide-react';
import { ChatHistoryItem } from '../services/chatService';
import dayjs from 'dayjs';

interface ChatHistorySidebarProps {
  history: ChatHistoryItem[];
  onSelectChat: (chat: ChatHistoryItem) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatHistorySidebar({ history, onSelectChat, isOpen, onClose }: ChatHistorySidebarProps) {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60] lg:hidden" 
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed top-16 bottom-0 left-0 w-72 bg-white border-r border-slate-200 z-[70] transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:h-auto lg:z-0
      `}>
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
              <History className="w-4 h-4 text-slate-600" />
            </div>
            <h2 className="font-bold text-slate-900">최근 대화 기록</h2>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3">
            {history.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-xs text-slate-400 font-medium">아직 대화 기록이 없습니다.</p>
              </div>
            ) : (
              history.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => {
                    onSelectChat(chat);
                    onClose();
                  }}
                  className="w-full text-left p-4 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase bg-indigo-50 px-2 py-0.5 rounded-md">
                      {chat.category}
                    </span>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                      <Clock className="w-3 h-3" />
                      {chat.timestamp ? dayjs(chat.timestamp.toDate()).format('HH:mm') : '방금'}
                    </div>
                  </div>
                  <p className="text-sm text-slate-700 font-medium line-clamp-2 leading-relaxed group-hover:text-indigo-900">
                    {chat.userInput}
                  </p>
                  <div className="mt-2 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="w-4 h-4 text-indigo-400" />
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-[10px] text-slate-400 leading-relaxed">
              최근 5개의 대화만 저장됩니다. 중요한 내용은 프롬프트를 복사하여 별도로 보관하세요.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
