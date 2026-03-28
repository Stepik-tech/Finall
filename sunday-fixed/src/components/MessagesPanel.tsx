import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Send,
  Edit2,
  Trash2,
  Reply,
  X,
  CheckCheck,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getChats, saveChat, getUserById, getUsers } from '@/hooks/useStorage';
import type { UserType, Chat, MessageType } from '@/types';

interface MessagesPanelProps {
  currentUser: UserType;
}

export default function MessagesPanel({ currentUser }: MessagesPanelProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [replyTo, setReplyTo] = useState<MessageType | null>(null);
  const [editingMessage, setEditingMessage] = useState<MessageType | null>(null);
  const [editText, setEditText] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<MessageType | null>(null);
  const [deleteForAll, setDeleteForAll] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chats
  useEffect(() => {
    const allChats = getChats();
    const userChats = allChats.filter(c => c.participants.includes(currentUser.id));
    setChats(userChats);
  }, [currentUser.id]);

  // Load messages for selected chat
  useEffect(() => {
    if (selectedChat) {
      setMessages(selectedChat.messages || []);
    }
  }, [selectedChat]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const saveMessages = (chatId: string, newMessages: MessageType[]) => {
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      const updatedChat = { 
        ...chat, 
        messages: newMessages,
        lastMessage: newMessages[newMessages.length - 1],
        updated_at: new Date().toISOString(),
      };
      saveChat(updatedChat);
      setChats(chats.map(c => c.id === chatId ? updatedChat : c));
      if (selectedChat?.id === chatId) {
        setSelectedChat(updatedChat);
      }
    }
  };

  const handleSendMessage = () => {
    if (!selectedChat || !messageText.trim()) return;

    const newMessage: MessageType = {
      id: Date.now().toString(),
      chatId: selectedChat.id,
      senderId: currentUser.id,
      text: messageText,
      replyTo: replyTo?.id,
      created_at: new Date().toISOString(),
    };

    const updatedMessages = [...messages, newMessage];
    saveMessages(selectedChat.id, updatedMessages);
    setMessages(updatedMessages);
    setMessageText('');
    setReplyTo(null);
  };

  const handleEditMessage = () => {
    if (!editingMessage || !editText.trim() || !selectedChat) return;

    const updatedMessages = messages.map(m => 
      m.id === editingMessage.id 
        ? { ...m, text: editText, edited: true, editedAt: new Date().toISOString() }
        : m
    );
    saveMessages(selectedChat.id, updatedMessages);
    setMessages(updatedMessages);
    setEditingMessage(null);
    setEditText('');
  };

  const handleDeleteMessage = () => {
    if (!messageToDelete || !selectedChat) return;

    let updatedMessages;
    if (deleteForAll) {
      updatedMessages = messages.filter(m => m.id !== messageToDelete.id);
    } else {
      updatedMessages = messages.map(m => 
        m.id === messageToDelete.id 
          ? { ...m, deletedFor: [...(m.deletedFor || []), currentUser.id] }
          : m
      );
    }
    saveMessages(selectedChat.id, updatedMessages);
    setMessages(updatedMessages);
    setShowDeleteConfirm(false);
    setMessageToDelete(null);
    setDeleteForAll(false);
  };

  const startNewChat = (userId: number) => {
    const existingChat = chats.find(c => 
      c.participants.length === 2 && 
      c.participants.includes(currentUser.id) && 
      c.participants.includes(userId)
    );

    if (existingChat) {
      setSelectedChat(existingChat);
      setShowNewChatDialog(false);
      return;
    }

    const newChat: Chat = {
      id: Date.now().toString(),
      participants: [currentUser.id, userId],
      messages: [],
      unreadCount: 0,
      updated_at: new Date().toISOString(),
    };

    saveChat(newChat);
    setChats([...chats, newChat]);
    setSelectedChat(newChat);
    setShowNewChatDialog(false);
  };

  const getOtherParticipant = (chat: Chat): UserType | undefined => {
    const otherId = chat.participants.find(id => id !== currentUser.id);
    return otherId ? getUserById(otherId) : undefined;
  };

  const getReplyMessage = (replyId: string) => {
    return messages.find(m => m.id === replyId);
  };

  const filteredChats = chats.filter(chat => {
    const other = getOtherParticipant(chat);
    return other?.username.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const sortedChats = [...filteredChats].sort((a, b) => 
    new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );

  const availableUsers = getUsers().filter(u => 
    u.id !== currentUser.id && 
    !chats.some(c => 
      c.participants.length === 2 && 
      c.participants.includes(currentUser.id) && 
      c.participants.includes(u.id)
    )
  );

  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <div className="w-80 border-r border-white/10 flex flex-col">
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Сообщения</h2>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setShowNewChatDialog(true)}
              className="hover:bg-white/10"
            >
              <Edit2 className="w-5 h-5" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Поиск..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white/5 border-white/10 text-white"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {sortedChats.map(chat => {
              const other = getOtherParticipant(chat);
              const lastMessage = chat.lastMessage;
              const isOwnLast = lastMessage?.senderId === currentUser.id;

              return (
                <button
                  key={chat.id}
                  onClick={() => setSelectedChat(chat)}
                  className={`w-full p-3 rounded-xl flex items-center gap-3 transition-colors ${
                    selectedChat?.id === chat.id 
                      ? 'bg-violet-500/20 border border-violet-500/30' 
                      : 'hover:bg-white/5'
                  }`}
                >
                  <div className="relative">
                    <img
                      src={other?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${other?.username}`}
                      alt={other?.username}
                      className="w-12 h-12 rounded-xl object-cover"
                    />
                    {other?.is_online && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-950" />
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-medium text-white truncate">{other?.username}</p>
                    <p className="text-xs text-slate-400 truncate">
                      {lastMessage ? (
                        <>
                          {isOwnLast && <span className="text-violet-400">Вы: </span>}
                          {lastMessage.text}
                        </>
                      ) : (
                        'Нет сообщений'
                      )}
                    </p>
                  </div>
                  {chat.unreadCount > 0 && (
                    <Badge className="bg-violet-600 text-white">{chat.unreadCount}</Badge>
                  )}
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      {selectedChat ? (
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedChat(null)}
                className="lg:hidden"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              {(() => {
                const other = getOtherParticipant(selectedChat);
                return (
                  <>
                    <div className="relative">
                      <img
                        src={other?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${other?.username}`}
                        alt={other?.username}
                        className="w-10 h-10 rounded-xl object-cover"
                      />
                      {other?.is_online && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-950" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{other?.username}</h3>
                      <p className="text-xs text-slate-400">
                        {other?.is_online ? 'онлайн' : 'офлайн'}
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages
                .filter(m => !m.deletedFor?.includes(currentUser.id))
                .map((message) => {
                  const isOwn = message.senderId === currentUser.id;
                  const replyMessage = message.replyTo ? getReplyMessage(message.replyTo) : null;

                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                        {/* Reply */}
                        {replyMessage && (
                          <div className="mb-1 px-3 py-2 rounded-lg bg-white/5 border-l-2 border-violet-500 text-xs text-slate-400">
                            <p className="truncate">{replyMessage.text}</p>
                          </div>
                        )}

                        <div
                          className={`group relative px-4 py-2 rounded-2xl ${
                            isOwn 
                              ? 'bg-violet-600 text-white rounded-br-md' 
                              : 'bg-white/10 text-white rounded-bl-md'
                          }`}
                        >
                          <p>{message.text}</p>
                          <div className="flex items-center gap-1 mt-1 justify-end">
                            <span className="text-xs opacity-60">
                              {new Date(message.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isOwn && (
                              <CheckCheck className="w-3 h-3 opacity-60" />
                            )}
                            {message.edited && (
                              <span className="text-xs opacity-60">(изм.)</span>
                            )}
                          </div>

                          {/* Message Actions */}
                          <div className="absolute -top-8 right-0 hidden group-hover:flex items-center gap-1 bg-slate-800 rounded-lg p-1 shadow-lg">
                            <button
                              onClick={() => setReplyTo(message)}
                              className="p-1 hover:bg-white/10 rounded"
                            >
                              <Reply className="w-4 h-4" />
                            </button>
                            {isOwn && (
                              <button
                                onClick={() => {
                                  setEditingMessage(message);
                                  setEditText(message.text);
                                }}
                                className="p-1 hover:bg-white/10 rounded"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setMessageToDelete(message);
                                setShowDeleteConfirm(true);
                              }}
                              className="p-1 hover:bg-white/10 rounded text-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t border-white/10">
            {replyTo && (
              <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-white/5 rounded-lg">
                <Reply className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-400 truncate flex-1">
                  Ответ: {replyTo.text}
                </span>
                <button onClick={() => setReplyTo(null)}>
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="hover:bg-white/10">
                <Edit2 className="w-5 h-5" />
              </Button>
              <Input
                placeholder="Введите сообщение..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 bg-white/5 border-white/10 text-white"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!messageText.trim()}
                className="bg-violet-600 hover:bg-violet-500"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <Send className="w-10 h-10 text-slate-600" />
            </div>
            <p className="text-slate-400">Выберите чат для начала общения</p>
            <Button
              onClick={() => setShowNewChatDialog(true)}
              className="mt-4 bg-violet-600 hover:bg-violet-500"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Новое сообщение
            </Button>
          </div>
        </div>
      )}

      {/* New Chat Dialog */}
      <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
        <DialogContent className="bg-slate-950 border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Новое сообщение</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-2 pt-4">
              {availableUsers.map(user => (
                <button
                  key={user.id}
                  onClick={() => startNewChat(user.id)}
                  className="w-full p-3 rounded-xl flex items-center gap-3 hover:bg-white/5 transition-colors"
                >
                  <img
                    src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                    alt={user.username}
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                  <div className="text-left">
                    <p className="font-medium text-white">{user.username}</p>
                    <p className="text-xs text-slate-400">
                      {user.is_online ? 'онлайн' : 'офлайн'}
                    </p>
                  </div>
                </button>
              ))}
              {availableUsers.length === 0 && (
                <p className="text-center text-slate-400 py-4">Нет доступных пользователей</p>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Edit Message Dialog */}
      <Dialog open={!!editingMessage} onOpenChange={() => setEditingMessage(null)}>
        <DialogContent className="bg-slate-950 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Изменить сообщение</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Input
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setEditingMessage(null)}
                className="flex-1 border-white/10"
              >
                Отмена
              </Button>
              <Button
                onClick={handleEditMessage}
                disabled={!editText.trim()}
                className="flex-1 bg-violet-600 hover:bg-violet-500"
              >
                Сохранить
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="bg-slate-950 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Удалить сообщение</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="deleteForAll"
                checked={deleteForAll}
                onChange={(e) => setDeleteForAll(e.target.checked)}
                className="rounded border-white/20"
              />
              <label htmlFor="deleteForAll" className="text-sm">Удалить для всех</label>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 border-white/10"
              >
                Отмена
              </Button>
              <Button
                onClick={handleDeleteMessage}
                variant="destructive"
                className="flex-1"
              >
                Удалить
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
