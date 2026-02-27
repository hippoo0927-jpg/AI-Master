import { 
  FileText, 
  Languages, 
  Code2, 
  Sparkles,
  Search
} from 'lucide-react';

const RECOMMENDATIONS = [
  { 
    id: 'summary', 
    label: '요약하기', 
    icon: FileText, 
    prompt: '다음 내용을 핵심 위주로 3문장 이내로 요약해줘:\n\n',
    color: 'hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200'
  },
  { 
    id: 'translate', 
    label: '번역하기', 
    icon: Languages, 
    prompt: '다음 내용을 자연스러운 한국어(또는 영어)로 번역해줘:\n\n',
    color: 'hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200'
  },
  { 
    id: 'code', 
    label: '코드리뷰', 
    icon: Code2, 
    prompt: '다음 코드의 버그를 찾고 가독성 개선 방안을 제안해줘:\n\n',
    color: 'hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200'
  },
  { 
    id: 'strategy', 
    label: '전략수립', 
    icon: Sparkles, 
    prompt: '다음 비즈니스 아이디어에 대한 SWOT 분석과 초기 실행 전략을 짜줘:\n\n',
    color: 'hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200'
  }
];

interface QuickPromptsProps {
  onSelect: (prompt: string) => void;
}

export default function QuickPrompts({ onSelect }: QuickPromptsProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {RECOMMENDATIONS.map((item) => (
        <button
          key={item.id}
          onClick={() => onSelect(item.prompt)}
          className={`
            flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 transition-all active:scale-95
            ${item.color}
          `}
        >
          <item.icon className="w-3.5 h-3.5" />
          {item.label}
        </button>
      ))}
    </div>
  );
}
