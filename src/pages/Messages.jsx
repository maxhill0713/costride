import React, { useState, useEffect, useRef } from 'react';
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
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['messages'],
    queryFn: () => base44.entities.Message.list('-created_date')
  });

  const { data: members = [] } = useQuery({
    queryKey: ['members'],
    queryFn: () => base44.entities.GymMember.list()
  });

  const sendMessageMutation = useMutation({
    mutationFn: (messageData) => base44.entities.Message.create(messageData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      setMessageText('');
    }
  });

  // Get unique conversations
  const conversations = messages.reduce((acc, msg) => {
    if (!currentUser) return acc;
    
    const otherUserId = msg.sender_id === currentUser.id ? msg.receiver_id : msg.sender_id;
    const otherUserName = msg.sender_id === currentUser.id ? msg.receiver_name : msg.sender_name;
    
    if (!acc[otherUserId]) {
      acc[otherUserId] = {
        userId: otherUserId,
        userName: otherUserName,
        lastMessage: msg.content,
        lastMessageTime: msg.created_date,
        unread: msg.receiver_id === currentUser.id && !msg.read
      };
    }
    return acc;
  }, {});

  const conversationList = Object.values(conversations);

  // Get messages for selected chat
  const chatMessages = selectedChat
    ? messages.filter(
        m =>
          (m.sender_id === currentUser?.id && m.receiver_id === selectedChat.userId) ||
          (m.receiver_id === currentUser?.id && m.sender_id === selectedChat.userId)
      )
    : [];

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

  const filteredMembers = members.filter(m =>
    m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.nickname?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto p-4">
        <div className="grid md:grid-cols-[320px_1fr] gap-4 h-[calc(100vh-8rem)]">
          {/* Conversations List */}
          <Card className="bg-white/80 backdrop-blur-lg border-2 border-gray-200/50 shadow-xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-purple-500">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <MessageCircle className="w-6 h-6" />
                Messages
              </h2>
            </div>

            {/* Search Users */}
            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 rounded-2xl bg-gray-50 border-0 focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-2">{searchQuery ? (

              <div className="space-y-1">
                {filteredMembers.map(member => (
                  <button
                    key={member.id}
                    onClick={() => {
                      setSelectedChat({ userId: member.id, userName: member.name });
                      setSearchQuery('');
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-blue-50 transition-all"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center shadow-md">
                      <span className="text-white font-bold text-lg">{member.name.charAt(0)}</span>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-gray-900">{member.name}</p>
                      {member.nickname && <p className="text-sm text-gray-500">{member.nickname}</p>}
                    </div>
                  </button>
                ))}
              </div>
                <div className="text-center py-12">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">No messages yet</p>
                  <p className="text-sm text-gray-400 mt-1">Search members to start chatting</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {conversationList.map(conv => (
                    <button
                      key={conv.userId}
                      onClick={() => setSelectedChat(conv)}
                      className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${
                        selectedChat?.userId === conv.userId 
                          ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-500' 
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center relative shadow-md">
                        <span className="text-white font-bold text-lg">{conv.userName.charAt(0)}</span>
                        {conv.unread && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
                            <span className="text-xs text-white font-bold">!</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{conv.userName}</p>
                        <p className="text-sm text-gray-500 truncate">{conv.lastMessage}</p>
                      </div>
                      <span className="text-xs text-gray-400 self-start mt-1">
                        {format(new Date(conv.lastMessageTime), 'h:mm a')}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Chat Window */}
          <Card className="bg-white/80 backdrop-blur-lg border-2 border-gray-200/50 shadow-xl flex flex-col overflow-hidden">
            {selectedChat ? (
              <>
                {/* Chat Header */}
                <div className="flex items-center gap-3 p-4 border-b border-gray-200 bg-gradient-to-r from-white to-gray-50">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedChat(null)}
                    className="md:hidden rounded-full hover:bg-gray-100"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center shadow-md">
                    <span className="text-white font-bold text-lg">{selectedChat.userName.charAt(0)}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-lg">{selectedChat.userName}</p>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <p className="text-xs text-gray-500">Active now</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100">
                    <MoreVertical className="w-5 h-5 text-gray-600" />
                  </Button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50/30 to-white">
                  {chatMessages.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center mx-auto mb-3">
                          <MessageCircle className="w-8 h-8 text-white" />
                        </div>
                        <p className="text-gray-500">Start a conversation with {selectedChat.userName}</p>
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
                            className={`max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                              msg.sender_id === currentUser?.id
                                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-br-sm'
                                : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm'
                            }`}
                          >
                            <p className="text-sm leading-relaxed">{msg.content}</p>
                            <p className={`text-xs mt-1 ${msg.sender_id === currentUser?.id ? 'text-blue-100' : 'text-gray-400'}`}>
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
                <div className="p-4 border-t border-gray-200 bg-white">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100 text-gray-500">
                      <Image className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100 text-gray-500">
                      <Smile className="w-5 h-5" />
                    </Button>
                    <Input
                      placeholder="Type a message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                      className="rounded-full bg-gray-100 border-0 focus:ring-2 focus:ring-blue-400 px-4"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!messageText.trim()}
                      className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-full w-12 h-12 p-0 shadow-md disabled:opacity-50"
                    >
                      <Send className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <MessageCircle className="w-12 h-12 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Your Messages</h3>
                  <p className="text-gray-500">Select a conversation to start chatting</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}