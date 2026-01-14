import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Brain, Send, Loader2, Sparkles, Dumbbell, Apple, TrendingUp, MessageCircle } from 'lucide-react';
import MessageBubble from '../components/coach/MessageBubble';

export default function AICoach() {
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Create conversation on mount
  useEffect(() => {
    if (currentUser && !conversationId) {
      base44.agents.createConversation({
        agent_name: 'fitness_coach',
        metadata: {
          name: `${currentUser.full_name}'s Fitness Coaching`,
          description: 'AI Fitness Coach Session'
        }
      }).then(conv => {
        setConversationId(conv.id);
        setMessages(conv.messages || []);
      });
    }
  }, [currentUser, conversationId]);

  // Subscribe to conversation updates
  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = base44.agents.subscribeToConversation(conversationId, (data) => {
      setMessages(data.messages);
    });

    return () => unsubscribe();
  }, [conversationId]);

  const sendMessageMutation = useMutation({
    mutationFn: async (message) => {
      const conversation = await base44.agents.getConversation(conversationId);
      return base44.agents.addMessage(conversation, {
        role: 'user',
        content: message
      });
    }
  });

  const handleSend = async () => {
    if (!input.trim() || !conversationId || sendMessageMutation.isPending) return;
    
    const message = input;
    setInput('');
    await sendMessageMutation.mutateAsync(message);
  };

  const quickActions = [
    { icon: Dumbbell, label: 'Create Workout Plan', message: 'Create a personalized workout plan for me based on my goals and current progress' },
    { icon: Apple, label: 'Nutrition Advice', message: 'Give me nutrition advice and meal plan suggestions based on my fitness goals' },
    { icon: TrendingUp, label: 'Analyze Progress', message: 'Analyze my training history and suggest optimizations for better results' },
    { icon: Sparkles, label: 'Form Tips', message: 'Give me form correction tips and technique advice for my main lifts' }
  ];

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900 flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 px-4 pt-8 pb-6 shadow-xl">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg">
              <Brain className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">AI Fitness Coach</h1>
              <p className="text-white/90 text-sm">Your personal training & nutrition expert</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Quick Actions */}
        {messages.length === 0 && (
          <Card className="bg-gradient-to-br from-slate-700/90 to-slate-800/90 backdrop-blur-sm border border-cyan-600/30 p-6 mb-6">
            <h3 className="text-lg font-bold bg-gradient-to-r from-cyan-200 to-blue-200 bg-clip-text text-transparent mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action, idx) => (
                <Button
                  key={idx}
                  onClick={() => {
                    setInput(action.message);
                    setTimeout(() => handleSend(), 100);
                  }}
                  variant="outline"
                  className="h-auto py-4 flex flex-col items-center gap-2 bg-slate-700/50 hover:bg-slate-600/50 border-cyan-600/30 hover:border-cyan-500/50 text-slate-200"
                >
                  <action.icon className="w-6 h-6 text-cyan-400" />
                  <span className="text-sm font-semibold text-center">{action.label}</span>
                </Button>
              ))}
            </div>
          </Card>
        )}

        {/* Messages */}
        <div className="space-y-4 mb-6">
          {messages.length === 0 ? (
            <Card className="bg-gradient-to-br from-slate-700/90 to-slate-800/90 backdrop-blur-sm border border-slate-600/40 p-8 text-center">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 text-slate-600" />
              <p className="text-slate-300 mb-2">Start a conversation with your AI coach</p>
              <p className="text-sm text-slate-400">Ask for workout plans, nutrition advice, or training tips!</p>
            </Card>
          ) : (
            messages.map((message, idx) => (
              <MessageBubble key={idx} message={message} />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <Card className="bg-gradient-to-br from-slate-700/90 to-slate-800/90 backdrop-blur-sm border border-cyan-600/30 p-4 sticky bottom-20 shadow-xl">
          <div className="flex gap-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask your coach anything..."
              className="flex-1 bg-slate-800/50 border-slate-600 text-slate-100 placeholder:text-slate-400 rounded-2xl"
              disabled={sendMessageMutation.isPending || !conversationId}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || sendMessageMutation.isPending || !conversationId}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-2xl shadow-lg px-6"
            >
              {sendMessageMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}