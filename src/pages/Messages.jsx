import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, Send, ArrowLeft, Search } from 'lucide-react';
import { format } from 'date-fns';

export default function Messages() {
  const [selectedChat, setSelectedChat] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4">
        <div className="grid md:grid-cols-3 gap-4 h-[calc(100vh-8rem)]">
          {/* Conversations List */}
          <Card className="bg-white p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Messages</h2>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
              >
                <MessageCircle className="w-5 h-5" />
              </Button>
            </div>

            {/* Search Users */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-2xl"
              />
            </div>

            {searchQuery ? (
              <div className="space-y-2">
                {filteredMembers.map(member => (
                  <button
                    key={member.id}
                    onClick={() => {
                      setSelectedChat({ userId: member.id, userName: member.name });
                      setSearchQuery('');
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                      <span className="text-white font-bold">{member.name.charAt(0)}</span>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-gray-900">{member.name}</p>
                      {member.nickname && <p className="text-sm text-gray-500">{member.nickname}</p>}
                    </div>
                  </button>
                ))}
              </div>
            ) : conversationList.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">No messages yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {conversationList.map(conv => (
                  <button
                    key={conv.userId}
                    onClick={() => setSelectedChat(conv)}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-colors ${
                      selectedChat?.userId === conv.userId ? 'bg-blue-50' : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center relative">
                      <span className="text-white font-bold">{conv.userName.charAt(0)}</span>
                      {conv.unread && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-gray-900">{conv.userName}</p>
                      <p className="text-sm text-gray-500 truncate">{conv.lastMessage}</p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {format(new Date(conv.lastMessageTime), 'MMM d')}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </Card>

          {/* Chat Window */}
          <Card className="bg-white md:col-span-2 flex flex-col">
            {selectedChat ? (
              <>
                {/* Chat Header */}
                <div className="flex items-center gap-3 p-4 border-b border-gray-200">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedChat(null)}
                    className="md:hidden rounded-full"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                    <span className="text-white font-bold">{selectedChat.userName.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{selectedChat.userName}</p>
                    <p className="text-xs text-gray-500">Active now</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {chatMessages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs px-4 py-2 rounded-2xl ${
                          msg.sender_id === currentUser?.id
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p className={`text-xs mt-1 ${msg.sender_id === currentUser?.id ? 'text-blue-100' : 'text-gray-500'}`}>
                          {format(new Date(msg.created_date), 'h:mm a')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Input */}
                <div className="p-4 border-t border-gray-200">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="rounded-2xl"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!messageText.trim()}
                      className="bg-blue-500 hover:bg-blue-600 rounded-2xl"
                    >
                      <Send className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="w-20 h-20 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">Select a conversation to start messaging</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}