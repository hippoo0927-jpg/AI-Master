import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AlertCircle, 
  LogIn, 
  Crown, 
  Key, 
  X,
  ArrowRight
} from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAction: () => void;
  title: string;
  description: string;
  actionText: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}

const BaseModal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  onAction, 
  title, 
  description, 
  actionText, 
  icon: Icon,
  iconBg,
  iconColor
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-[#1A1A1A] border border-white/10 rounded-[2rem] shadow-2xl max-w-md w-full overflow-hidden"
          >
            <div className="p-8">
              <div className="flex justify-end mb-2">
                <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="flex flex-col items-center text-center">
                <div className={`w-20 h-20 ${iconBg} rounded-3xl flex items-center justify-center mb-6 shadow-xl`}>
                  <Icon className={`w-10 h-10 ${iconColor}`} />
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
                <p className="text-white/60 text-sm leading-relaxed mb-8">
                  {description}
                </p>
                
                <button
                  onClick={onAction}
                  className="w-full py-4 bg-[#D4AF37] hover:bg-[#C4A137] text-black font-bold rounded-2xl transition-all flex items-center justify-center gap-2 group shadow-lg shadow-[#D4AF37]/20"
                >
                  {actionText}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export const LoginRequiredModal: React.FC<{ isOpen: boolean; onClose: () => void; onLogin: () => void }> = ({ isOpen, onClose, onLogin }) => (
  <BaseModal
    isOpen={isOpen}
    onClose={onClose}
    onAction={onLogin}
    title="로그인이 필요합니다"
    description="이 기능은 회원 전용입니다. 로그인을 통해 아키텍트의 전문적인 상담을 시작해보세요."
    actionText="로그인하러 가기"
    icon={LogIn}
    iconBg="bg-blue-500/20"
    iconColor="text-blue-400"
  />
);

export const PremiumRequiredModal: React.FC<{ isOpen: boolean; onClose: () => void; onUpgrade: () => void }> = ({ isOpen, onClose, onUpgrade }) => (
  <BaseModal
    isOpen={isOpen}
    onClose={onClose}
    onAction={onUpgrade}
    title="프리미엄 전용 기능입니다"
    description="Architect Direct Chat은 프리미엄 멤버십 전용 기능입니다. 지금 업그레이드하여 무제한 전문가 상담을 경험하세요."
    actionText="멤버십 업그레이드"
    icon={Crown}
    iconBg="bg-[#D4AF37]/20"
    iconColor="text-[#D4AF37]"
  />
);

export const ApiKeyRequiredModal: React.FC<{ isOpen: boolean; onClose: () => void; onSettings: () => void }> = ({ isOpen, onClose, onSettings }) => (
  <BaseModal
    isOpen={isOpen}
    onClose={onClose}
    onAction={onSettings}
    title="개인 API Key 등록이 필요합니다"
    description="프리미엄 기능을 원활하게 이용하시려면 본인의 Gemini API Key 등록이 필요합니다. 설정 페이지에서 등록해주세요."
    actionText="API Key 설정하러 가기"
    icon={Key}
    iconBg="bg-emerald-500/20"
    iconColor="text-emerald-400"
  />
);