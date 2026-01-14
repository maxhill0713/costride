import { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { Brain, User } from 'lucide-react';

const TypewriterText = ({ text, isComplete }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (isComplete) {
      setDisplayedText(text);
      return;
    }

    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 20);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text, isComplete]);

  return <div className="whitespace-pre-wrap">{displayedText}</div>;
};

export default function CoachMessageBubble({ message }) {
  const isUser = message.role === 'user';
  const isComplete = message.status === 'completed' || message.role === 'user';

  return (
    <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shrink-0 shadow-lg">
          <Brain className="w-4 h-4 text-white" />
        </div>
      )}
      {isUser && (
        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center shrink-0 shadow-lg order-2">
          <User className="w-4 h-4 text-slate-300" />
        </div>
      )}
      <div className={cn("max-w-[75%]", isUser && "order-1")}>
        {message.content && (
          <div className={cn(
            "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
            isUser 
              ? "bg-gradient-to-r from-slate-600 to-slate-700 text-slate-100 shadow-md" 
              : "bg-gradient-to-br from-slate-700/90 to-slate-800/90 backdrop-blur-sm border border-slate-600/40 text-slate-200"
          )}>
            {isUser ? (
              message.content
            ) : (
              <TypewriterText text={message.content} isComplete={isComplete} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}