import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  MessageSquare,
  Settings,
  LogOut,
  Send,
  Paperclip,
  Edit2,
  Trash2,
  Reply,
  X,
  Pin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getGroups, saveGroup, getUserById } from '@/hooks/useStorage';
import type { UserType, Group, MessageType } from '@/types';

interface GroupsPanelProps {
  currentUser: UserType;
}

export default function GroupsPanel({ currentUser }: GroupsPanelProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [replyTo, setReplyTo] = useState<MessageType | null>(null);
  const [editingMessage, setEditingMessage] = useState<MessageType | null>(null);
  const [editText, setEditText] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<MessageType | null>(null);
  const [deleteForAll, setDeleteForAll] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load groups where user is member
  useEffect(() => {
    const allGroups = getGroups();
    const userGroups = allGroups.filter(g => g.members.includes(currentUser.id));
    setGroups(userGroups);
  }, [currentUser.id]);

  // Load messages for selected group
  useEffect(() => {
    if (selectedGroup) {
      const storedMessages = localStorage.getItem(`sunday_app_messages_${selectedGroup.id}`);
      if (storedMessages) {
        setMessages(JSON.parse(storedMessages));
      } else {
        setMessages([]);
      }
    }
  }, [selectedGroup]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const saveMessages = (groupId: string, newMessages: MessageType[]) => {
    localStorage.setItem(`sunday_app_messages_${groupId}`, JSON.stringify(newMessages));
    setMessages(newMessages);
  };

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return;

    const newGroup: Group = {
      id: Date.now().toString(),
      name: newGroupName,
      description: newGroupDescription,
      creatorId: currentUser.id,
      members: [currentUser.id],
      admins: [currentUser.id],
      created_at: new Date().toISOString(),
    };

    saveGroup(newGroup);
    setGroups([...groups, newGroup]);
    setShowCreateDialog(false);
    setNewGroupName('');
    setNewGroupDescription('');
  };

  const handleSendMessage = () => {
    if (!selectedGroup || !messageText.trim()) return;

    const newMessage: MessageType = {
      id: Date.now().toString(),
      groupId: selectedGroup.id,
      senderId: currentUser.id,
      text: messageText,
      replyTo: replyTo?.id,
      created_at: new Date().toISOString(),
    };

    const updatedMessages = [...messages, newMessage];
    saveMessages(selectedGroup.id, updatedMessages);
    setMessageText('');
    setReplyTo(null);
  };

  const handleEditMessage = () => {
    if (!editingMessage || !editText.trim()) return;

    const updatedMessages = messages.map(m => 
      m.id === editingMessage.id 
        ? { ...m, text: editText, edited: true, editedAt: new Date().toISOString() }
        : m
    );
    saveMessages(selectedGroup!.id, updatedMessages);
    setEditingMessage(null);
    setEditText('');
  };

  const handleDeleteMessage = () => {
    if (!messageToDelete) return;

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
    saveMessages(selectedGroup!.id, updatedMessages);
    setShowDeleteConfirm(false);
    setMessageToDelete(null);
    setDeleteForAll(false);
  };

  const handlePinMessage = (message: MessageType) => {
    if (!selectedGroup) return;
    const updatedGroup = { ...selectedGroup, pinnedMessage: message };
    saveGroup(updatedGroup);
    setSelectedGroup(updatedGroup);
  };

  const handleUnpinMessage = () => {
    if (!selectedGroup) return;
    const updatedGroup = { ...selectedGroup };
    delete updatedGroup.pinnedMessage;
    saveGroup(updatedGroup);
    setSelectedGroup(updatedGroup);
  };

  const handleLeaveGroup = () => {
    if (!selectedGroup) return;
    const updatedGroup = {
      ...selectedGroup,
      members: selectedGroup.members.filter(m => m !== currentUser.id),
      admins: selectedGroup.admins.filter(a => a !== currentUser.id),
    };
    saveGroup(updatedGroup);
    setGroups(groups.filter(g => g.id !== selectedGroup.id));
    setSelectedGroup(null);
  };

  const handleDeleteGroup = () => {
    if (!selectedGroup) return;
    const allGroups = getGroups().filter(g => g.id !== selectedGroup.id);
    localStorage.setItem('sunday_app_groups', JSON.stringify(allGroups));
    setGroups(groups.filter(g => g.id !== selectedGroup.id));
    setSelectedGroup(null);
    setShowSettingsDialog(false);
  };

  const isAdmin = selectedGroup?.admins.includes(currentUser.id);

  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getReplyMessage = (replyId: string) => {
    return messages.find(m => m.id === replyId);
  };

  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <div className="w-80 border-r border-white/10 flex flex-col">
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Группы</h2>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setShowCreateDialog(true)}
              className="hover:bg-white/10"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Поиск групп..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white/5 border-white/10 text-white"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {filteredGroups.map(group => (
              <button
                key={group.id}
                onClick={() => setSelectedGroup(group)}
                className={`w-full p-3 rounded-xl flex items-center gap-3 transition-colors ${
                  selectedGroup?.id === group.id 
                    ? 'bg-violet-500/20 border border-violet-500/30' 
                    : 'hover:bg-white/5'
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-lg">
                  {group.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-white truncate">{group.name}</p>
                  <p className="text-xs text-slate-400">{group.members.length} участников</p>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      {selectedGroup ? (
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold">
                {selectedGroup.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-semibold text-white">{selectedGroup.name}</h3>
                <p className="text-xs text-slate-400">{selectedGroup.members.length} участников</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSettingsDialog(true)}
                className="hover:bg-white/10"
              >
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Pinned Message */}
          {selectedGroup.pinnedMessage && (
            <div className="p-3 bg-violet-500/10 border-b border-violet-500/20">
              <div className="flex items-start gap-2">
                <Pin className="w-4 h-4 text-violet-400 mt-1" />
                <div className="flex-1">
                  <p className="text-xs text-violet-400">Закрепленное сообщение</p>
                  <p className="text-sm text-slate-300 truncate">{selectedGroup.pinnedMessage.text}</p>
                </div>
                {isAdmin && (
                  <button onClick={handleUnpinMessage} className="text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages
                .filter(m => !m.deletedFor?.includes(currentUser.id))
                .map((message) => {
                  const sender = getUserById(message.senderId);
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
                            <p className="font-medium text-slate-300">{getUserById(replyMessage.senderId)?.username}</p>
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
                          {!isOwn && (
                            <p className="text-xs text-violet-300 mb-1">{sender?.username}</p>
                          )}
                          <p>{message.text}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-xs opacity-60">
                              {new Date(message.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {message.edited && (
                              <span className="text-xs opacity-60">(изменено)</span>
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
                            {(isOwn || isAdmin) && (
                              <>
                                <button
                                  onClick={() => handlePinMessage(message)}
                                  className="p-1 hover:bg-white/10 rounded"
                                >
                                  <Pin className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setMessageToDelete(message);
                                    setShowDeleteConfirm(true);
                                  }}
                                  className="p-1 hover:bg-white/10 rounded text-red-400"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
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
                  Ответ на: {replyTo.text}
                </span>
                <button onClick={() => setReplyTo(null)}>
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-white/10"
              >
                <Paperclip className="w-5 h-5" />
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
            <MessageSquare className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">Выберите группу для начала общения</p>
          </div>
        </div>
      )}

      {/* Create Group Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-slate-950 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Создать группу</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Input
              placeholder="Название группы..."
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
            />
            <Textarea
              placeholder="Описание (необязательно)..."
              value={newGroupDescription}
              onChange={(e) => setNewGroupDescription(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                className="flex-1 border-white/10"
              >
                Отмена
              </Button>
              <Button
                onClick={handleCreateGroup}
                disabled={!newGroupName.trim()}
                className="flex-1 bg-violet-600 hover:bg-violet-500"
              >
                Создать
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="bg-slate-950 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Настройки группы</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="p-4 rounded-xl bg-white/5">
              <h4 className="font-medium mb-2">Участники</h4>
              <div className="space-y-2">
                {selectedGroup?.members.map(memberId => {
                  const member = getUserById(memberId);
                  return (
                    <div key={memberId} className="flex items-center gap-2">
                      <img
                        src={member?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member?.username}`}
                        alt=""
                        className="w-8 h-8 rounded-full"
                      />
                      <span className="text-sm">{member?.username}</span>
                      {selectedGroup?.admins.includes(memberId) && (
                        <Badge variant="secondary" className="text-xs">Админ</Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleLeaveGroup}
                className="flex-1 border-white/10 text-red-400"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Покинуть группу
              </Button>
              {isAdmin && (
                <Button
                  onClick={handleDeleteGroup}
                  variant="destructive"
                  className="flex-1"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Удалить
                </Button>
              )}
            </div>
          </div>
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
