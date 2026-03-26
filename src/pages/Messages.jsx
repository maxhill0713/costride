import React, { useState, useEffect, useRef, useMemo } from 'react';
import { usePageVisibility } from '@/hooks/usePageVisibility';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, Send, ArrowLeft, Search, Image, Smile, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';

export default function Messages() {
  const [selectedChat, setSelectedChat] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();
  const isPageVisible = usePageVisibility();

  // Check for userId in URL to open direct message
  const urlParams = new URLSearchParams(window.location.search);
  const directUserId = urlParams.get('userId');

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });

  // Full conversation list — 60 s poll keeps sidebar fresh without hammering the DB.
  // The open chat window gets 5 s incremental updates via getNewMessages below.
  const { data: messages = [] } = useQuery({
    queryKey: ['messages', currentUser?.id],
    queryFn: () => base44.entities.Message.filter({
      $or: [{ sender_id: currentUser.id }, { receiver_id: currentUser.id }]
    }, '-created_date', 100),
    enabled: !!currentUser,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: isPageVisible ? 60000 : false,
    refetchIntervalInBackground: false,
  });

  // Only fetch a specific user when opening a direct message from a URL param.
  // SECURITY: Route through getUserById backend — returns only public fields
  // (full_name, avatar_url, streak etc.). Direct User.filter() from the client
  // would return the full user record including email (IDOR).
  const { data: directUser } = useQuery({
    queryKey: ['userById', directUserId],
    queryFn: () => base44.functions.invoke('getUserById', { userId: directUserId }).then(r => r.data?.user || null),
    enabled: !!directUserId,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000
  });

  // Debounce search input to avoid firing on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Server-side user search — returns max 20 results, no full table scan
  const { data: allUsers = [] } = useQuery({
    queryKey: ['userSearch', debouncedSearch],
    queryFn: () => base44.functions.invoke('searchUsers', { query: debouncedSearch, limit: 20 }).then(r => r.data?.users || []),
    enabled: debouncedSearch.length >= 2,
    staleTime: 30 * 1000,
    gcTime: 2 * 60 * 1000,
  });

  // Auto-open chat if directUserId is present
  useEffect(() => {
    if (directUserId && directUser && !selectedChat) {
      setSelectedChat({
        userId: directUser.id,
        userName: directUser.full_name
      });
    }
  }, [directUserId, directUser, selectedChat]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (selectedChat && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, selectedChat, isMinimized]);

  const sendMessageMutation = useMutation({
    mutationFn: (messageData) => base44.entities.Message.create(messageData),
    onMutate: async (newMsg) => {
      await queryClient.cancelQueries({ queryKey: ['messages', currentUser?.id] });
      const previous = queryClient.getQueryData(['messages', currentUser?.id]);
      queryClient.setQueryData(['messages', currentUser?.id], (old = []) => [
        { ...newMsg, id: `optimistic-${Date.now()}`, created_date: new Date().toISOString(), read: false },
        ...old,
      ]);
      setMessageText('');
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['messages', currentUser?.id], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', currentUser?.id] });
    },
  });

  // Memoized conversation list — only recomputes when messages or currentUser change
  const conversationList = useMemo(() => {
    if (!currentUser) return [];
    const conversations = {};
    for (const msg of messages) {
      const otherUserId = msg.sender_id === currentUser.id ? msg.receiver_id : msg.sender_id;
      if (!otherUserId || msg.id?.startsWith?.('optimistic-')) continue;
      if (!conversations[otherUserId]) {
        conversations[otherUserId] = {
          userId: otherUserId,
          userName: msg.sender_id === currentUser.id ? msg.receiver_name : msg.sender_name,
          lastMessage: msg.content,
          lastMessageTime: msg.created_date,
          unread: msg.receiver_id === currentUser.id && !msg.read,
        };
      }
    }
    return Object.values(conversations);
  }, [messages, currentUser]);

  const chatMessages = useMemo(() => {
    if (!selectedChat || !currentUser) return [];
    return messages.filter(
      m =>
        (m.sender_id === currentUser.id && m.receiver_id === selectedChat.userId) ||
        (m.receiver_id === currentUser.id && m.sender_id === selectedChat.userId)
    );
  }, [messages, selectedChat, currentUser]);

  // Track newest real (non-optimistic) message timestamp for incremental polling.
  const lastMsgTimestampRef = useRef(null);
  useEffect(() => {
    const newest = chatMessages.find(m => !m.id?.startsWith?.('optimistic-'));
    if (newest) lastMsgTimestampRef.current = newest.created_date;
  }, [chatMessages]);

  // Incremental 5 s poll — fetches only messages newer than the last seen timestamp.
  // Merges results into the main messages cache without a full 100-message reload.
  // When no new messages arrive this is a near-zero-cost indexed range-scan.
  useQuery({
    queryKey: ['chatPoll', currentUser?.id, selectedChat?.userId],
    queryFn: async () => {
      const since = lastMsgTimestampRef.current;
      if (!since || !selectedChat) return [];
      const result = await base44.functions.invoke('getNewMessages', {
        partnerId: selectedChat.userId,
        since,
      });
      const newMsgs = result.data?.messages || [];
      if (newMsgs.length > 0) {
        queryClient.setQueryData(['messages', currentUser?.id], (old = []) => {
          const existingIds = new Set(old.map(m => m.id));
          const fresh = newMsgs.filter(m => !existingIds.has(m.id));
          return fresh.length ? [...fresh, ...old] : old;
        });
        lastMsgTimestampRef.current = newMsgs[0].created_date;
      }
      return newMsgs;
    },
    enabled: !!currentUser && !!selectedChat && isPageVisible,
    refetchInterval: isPageVisible ? 5000 : false,
    refetchIntervalInBackground: false,
    staleTime: 0,
    gcTime: 0,
  });

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedChat || !currentUser) return;

    sendMessageMutation.mutate({
      sender_id: currentUser.id,
      sender_name: currentUser.full_name,
      receiver_id: selectedChat.userId,
      receiver_name: selectedChat.userName,
      content: messageText
    });
  };

  // allUsers is already server-filtered; just exclude current user
  const filteredUsers = useMemo(
    () => allUsers.filter(u => u.id !== currentUser?.id),
    [allUsers, currentUser?.id]
  );

  const unreadCount = conversationList.filter(conv => conv.unread).length;

  return (
    <div className="min-h-screen bg-[linear-gradient(to_bottom_right,#02040a,#0d2360,#02040a)]">
      {/* Minimized Floating Chat */}
      {isMinimized && selectedChat && (
        <div className="fixed bottom-4 right-4 z-50">
          <button
            onClick={() => setIsMinimized(false)}
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full p-4 shadow-2xl hover:scale-110 transition-transform relative"
          >
            <MessageCircle className="w-6 h-6" />
            {unreadCount > 0 && (
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold">
                {unreadCount}
              </div>
            )}
          </button>
          <div className="absolute bottom-full right-0 mb-2 bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-3 w-72 max-h-96 overflow-hidden">
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-700/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">{selectedChat.userName.charAt(0)}</span>
                </div>
                <span className="font-semibold text-sm text-white">{selectedChat.userName}</span>
              </div>
              <button onClick={() => setIsMinimized(false)} className="text-slate-400 hover:text-slate-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {chatMessages.slice(-3).map(msg => (
                <div key={msg.id} className={`text-xs ${msg.sender_id === currentUser?.id ? 'text-right' : 'text-left'}`}>
                  <div className={`inline-block px-2 py-1.5 rounded-lg ${msg.sender_id === currentUser?.id ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-200'}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className={`max-w-7xl mx-auto p-4 transition-all ${isMinimized ? 'hidden' : ''}`}>
        <div className="grid md:grid-cols-[320px_1fr] gap-4 h-[calc(100vh-8rem)]">
          {/* Conversations List */}
          <Card className="bg-slate-900/80 backdrop-blur-lg border border-slate-700/50 shadow-xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-700/50 bg-slate-800/60">
              <h2 className="text-[17px] font-black text-white flex items-center gap-2 tracking-tight">
                <MessageCircle className="w-[18px] h-[18px] text-blue-400" />
                Messages
              </h2>
            </div>

            {/* Search Users */}
            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 rounded-2xl bg-slate-800/80 border border-slate-600/50 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-2">
              {searchQuery ? (
                <div className="space-y-1">
                  {filteredUsers.map(user => (
                    <button
                      key={user.id}
                      onClick={() => {
                        setSelectedChat({ userId: user.id, userName: user.full_name });
                        setSearchQuery('');
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-700/50 transition-all"
                    >
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md overflow-hidden flex-shrink-0">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-white font-bold text-lg">{user.full_name?.charAt(0)}</span>
                        )}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="font-semibold text-white truncate">{user.full_name}</p>
                        {user.location && <p className="text-sm text-slate-400 truncate">{user.location}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              ) : conversationList.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                  <p className="text-slate-400 font-medium">No messages yet</p>
                  <p className="text-sm text-slate-500 mt-1">Search users to start chatting</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {conversationList.map(conv => (
                    <button
                      key={conv.userId}
                      onClick={() => setSelectedChat(conv)}
                      className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${
                        selectedChat?.userId === conv.userId
                          ? 'bg-blue-500/15 border-l-4 border-blue-400'
                          : 'hover:bg-slate-700/50'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center relative shadow-md flex-shrink-0">
                        <span className="text-white font-bold text-lg">{conv.userName.charAt(0)}</span>
                        {conv.unread && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
                            <span className="text-xs text-white font-bold">!</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="font-semibold text-white truncate">{conv.userName}</p>
                        <p className="text-sm text-slate-400 truncate">{conv.lastMessage}</p>
                      </div>
                      <span className="text-xs text-slate-500 self-start mt-1 flex-shrink-0">
                        {format(new Date(conv.lastMessageTime), 'h:mm a')}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Chat Window */}
          <Card className="bg-slate-900/80 backdrop-blur-lg border border-slate-700/50 shadow-xl flex flex-col overflow-hidden">
            {selectedChat ? (
              <>
                {/* Chat Header */}
                <div className="flex items-center gap-3 p-4 border-b border-slate-700/50 bg-slate-800/60">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedChat(null)}
                    className="md:hidden rounded-full hover:bg-slate-700 text-slate-400"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md flex-shrink-0">
                    <span className="text-white font-bold text-lg">{selectedChat.userName.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-[15px] truncate">{selectedChat.userName}</p>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <p className="text-xs text-slate-400">Active now</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full hover:bg-slate-700 text-slate-400"
                    onClick={() => setIsMinimized(true)}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </Button>
                  <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-700 text-slate-400">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-slate-950/30">
                  {chatMessages.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-500/20">
                          <MessageCircle className="w-8 h-8 text-white" />
                        </div>
                        <p className="text-slate-400">Start a conversation with {selectedChat.userName}</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {chatMessages.map(msg => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                        >
                          <div
                            className={`max-w-md px-4 py-3 rounded-2xl ${
                              msg.sender_id === currentUser?.id
                                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-br-sm shadow-lg shadow-blue-500/20'
                                : 'bg-slate-700/80 text-white border border-slate-600/40 rounded-bl-sm'
                            }`}
                          >
                            <p className="text-sm leading-relaxed">{msg.content}</p>
                            <p className={`text-xs mt-1 ${msg.sender_id === currentUser?.id ? 'text-blue-200' : 'text-slate-400'}`}>
                              {format(new Date(msg.created_date), 'h:mm a')}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {/* Input */}
                <div className="p-4 border-t border-slate-700/50 bg-slate-800/60">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-700 text-slate-400 flex-shrink-0">
                      <Image className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-700 text-slate-400 flex-shrink-0">
                      <Smile className="w-5 h-5" />
                    </Button>
                    <Input
                      placeholder="Type a message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                      className="rounded-full bg-slate-800 border border-slate-600/50 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/50 px-4"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!messageText.trim()}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-full w-11 h-11 p-0 shadow-md shadow-blue-500/20 disabled:opacity-50 flex-shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-10 h-10 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">Your Messages</h3>
                  <p className="text-slate-400 text-sm">Select a conversation to start chatting</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}