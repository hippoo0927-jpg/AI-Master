import { motion } from 'motion/react';

export default function LandingPageHeader() {
  return (
    <div className="text-center mb-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col items-center justify-center gap-2 mb-6">
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 tracking-tight leading-tight">
            당신의 비즈니스를 위한 스마트한 동반자
          </h1>
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight gradient-text">
            AI 마스터 아키텍트 플랫폼
          </h2>
        </div>
        <p className="text-lg text-slate-600 max-w-3xl mx-auto mb-10 leading-relaxed">
          최상급 AI 엔진(Grok, Claude 3.5 Sonnet, ChatGPT-4o 등)을 활용한 비즈니스 분석 및 최적화 설계를 경험하세요. 
          AI 마스터 아키텍트와 함께라면 더욱 전략적이고 효율적인 비즈니스 운영이 가능해집니다.
        </p>
      </motion.div>
    </div>
  );
}
