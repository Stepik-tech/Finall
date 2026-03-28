import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  MessageSquare,
  CheckCircle,
  Send,
  Trash2,
  MoreVertical,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getTickets, saveTicket, getUserById, addLog, addNotification } from '@/hooks/useStorage';
import type { UserType, Ticket, TicketResponse } from '@/types';

interface TicketsPanelProps {
  currentUser: UserType;
}

export default function TicketsPanel({ currentUser }: TicketsPanelProps) {
  const [tickets, setTickets] = useState<Ticket[]>(getTickets());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showTicketDialog, setShowTicketDialog] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [newTicketTitle, setNewTicketTitle] = useState('');
  const [newTicketDescription, setNewTicketDescription] = useState('');
  const [newTicketPriority, setNewTicketPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [responseText, setResponseText] = useState('');
  const [closeReason, setCloseReason] = useState('');
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const canRespond = currentUser.lvl >= 3;

  useEffect(() => {
    const interval = setInterval(() => {
      setTickets(getTickets());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ticket.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const myTickets = filteredTickets.filter(t => t.userId === currentUser.id);
  const openTickets = filteredTickets.filter(t => t.status === 'open');
  const closedTickets = filteredTickets.filter(t => t.status === 'closed');

  const handleCreateTicket = () => {
    if (!newTicketTitle.trim() || !newTicketDescription.trim()) return;

    const newTicket: Ticket = {
      id: Date.now().toString(),
      userId: currentUser.id,
      title: newTicketTitle,
      description: newTicketDescription,
      status: 'open',
      priority: newTicketPriority,
      responses: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    saveTicket(newTicket);
    setTickets(getTickets());
    setShowCreateDialog(false);
    setNewTicketTitle('');
    setNewTicketDescription('');
    setNewTicketPriority('medium');

    // Notify admins
    addNotification({
      id: Date.now().toString(),
      userId: 0, // Broadcast to all admins
      title: 'Новый тикет',
      message: `${currentUser.username} создал тикет: ${newTicket.title}`,
      type: 'ticket',
      read: false,
      link: `/tickets/${newTicket.id}`,
      created_at: new Date().toISOString(),
    });
  };

  const handleResponse = () => {
    if (!selectedTicket || !responseText.trim() || !canRespond) return;

    const response: TicketResponse = {
      id: Date.now().toString(),
      ticketId: selectedTicket.id,
      userId: currentUser.id,
      text: responseText,
      created_at: new Date().toISOString(),
    };

    const updatedTicket = {
      ...selectedTicket,
      responses: [...selectedTicket.responses, response],
      status: 'in_progress' as const,
      updated_at: new Date().toISOString(),
    };

    saveTicket(updatedTicket);
    setTickets(getTickets());
    setSelectedTicket(updatedTicket);
    setResponseText('');

    // Notify ticket creator
    const ticketCreator = getUserById(selectedTicket.userId);
    if (ticketCreator) {
      addNotification({
        id: Date.now().toString(),
        userId: ticketCreator.id,
        title: 'Ответ на тикет',
        message: `${currentUser.username} ответил на ваш тикет: ${selectedTicket.title}`,
        type: 'ticket',
        read: false,
        created_at: new Date().toISOString(),
      });
    }
  };

  const handleCloseTicket = () => {
    if (!selectedTicket || !closeReason.trim()) return;

    const updatedTicket = {
      ...selectedTicket,
      status: 'closed' as const,
      closedBy: currentUser.id,
      closeReason,
      updated_at: new Date().toISOString(),
    };

    saveTicket(updatedTicket);
    setTickets(getTickets());
    setSelectedTicket(updatedTicket);
    setShowCloseDialog(false);
    setCloseReason('');

    addLog({
      id: Date.now().toString(),
      type: 'other',
      userId: selectedTicket.userId,
      description: `Тикет закрыт. Причина: ${closeReason}`,
      created_by: currentUser.id,
      created_at: new Date().toISOString(),
    });
  };

  const handleDeleteTicket = () => {
    if (!selectedTicket || !deleteReason.trim()) return;

    const updatedTickets = tickets.filter(t => t.id !== selectedTicket.id);
    localStorage.setItem('sunday_app_tickets', JSON.stringify(updatedTickets));
    setTickets(updatedTickets);
    setShowDeleteDialog(false);
    setShowTicketDialog(false);
    setDeleteReason('');

    addLog({
      id: Date.now().toString(),
      type: 'other',
      userId: selectedTicket.userId,
      description: `Тикет удален. Причина: ${deleteReason}`,
      created_by: currentUser.id,
      created_at: new Date().toISOString(),
    });
  };

  const openTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setShowTicketDialog(true);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-emerald-500/20 text-emerald-400';
      case 'in_progress': return 'bg-yellow-500/20 text-yellow-400';
      case 'closed': return 'bg-slate-500/20 text-slate-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const TicketCard = ({ ticket }: { ticket: Ticket }) => {
    const creator = getUserById(ticket.userId);
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors cursor-pointer"
        onClick={() => openTicket(ticket)}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={getPriorityColor(ticket.priority)}>
              {ticket.priority === 'high' ? 'Высокий' : ticket.priority === 'medium' ? 'Средний' : 'Низкий'}
            </Badge>
            <Badge className={getStatusColor(ticket.status)}>
              {ticket.status === 'open' ? 'Открыт' : ticket.status === 'in_progress' ? 'В работе' : 'Закрыт'}
            </Badge>
          </div>
          <span className="text-xs text-slate-400">
            {new Date(ticket.created_at).toLocaleDateString('ru-RU')}
          </span>
        </div>
        <h3 className="font-semibold text-white mb-1">{ticket.title}</h3>
        <p className="text-slate-400 text-sm line-clamp-2 mb-3">{ticket.description}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={creator?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${creator?.username}`}
              alt={creator?.username}
              className="w-6 h-6 rounded-full"
            />
            <span className="text-sm text-slate-400">{creator?.username}</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <MessageSquare className="w-4 h-4" />
            <span className="text-sm">{ticket.responses.length}</span>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold text-white">Тикеты</h1>
          <p className="text-slate-400">Всего тикетов: {tickets.length}</p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-violet-600 hover:bg-violet-500"
        >
          <Plus className="w-4 h-4 mr-2" />
          Создать тикет
        </Button>
      </div>

      {/* Filters */}
      <div className="p-4 border-b border-white/10 space-y-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Поиск по тикетам..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-white/10">
              <SelectItem value="all">Все</SelectItem>
              <SelectItem value="open">Открытые</SelectItem>
              <SelectItem value="in_progress">В работе</SelectItem>
              <SelectItem value="closed">Закрытые</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 p-4">
        <Tabs defaultValue={canRespond ? 'open' : 'my'} className="w-full">
          <TabsList className="w-full bg-white/5 border border-white/10 mb-4">
            {!canRespond && (
              <TabsTrigger value="my" className="flex-1 data-[state=active]:bg-violet-600">
                Мои тикеты ({myTickets.length})
              </TabsTrigger>
            )}
            {canRespond && (
              <>
                <TabsTrigger value="open" className="flex-1 data-[state=active]:bg-violet-600">
                  Открытые ({openTickets.length})
                </TabsTrigger>
                <TabsTrigger value="closed" className="flex-1 data-[state=active]:bg-violet-600">
                  Закрытые ({closedTickets.length})
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="my" className="space-y-2">
            {myTickets.map(ticket => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </TabsContent>

          <TabsContent value="open" className="space-y-2">
            {openTickets.map(ticket => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </TabsContent>

          <TabsContent value="closed" className="space-y-2">
            {closedTickets.map(ticket => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </TabsContent>
        </Tabs>
      </ScrollArea>

      {/* Create Ticket Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-slate-950 border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>Создать новый тикет</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Input
              placeholder="Заголовок..."
              value={newTicketTitle}
              onChange={(e) => setNewTicketTitle(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
            />
            <Textarea
              placeholder="Описание проблемы..."
              value={newTicketDescription}
              onChange={(e) => setNewTicketDescription(e.target.value)}
              className="bg-white/5 border-white/10 text-white min-h-[120px]"
            />
            <Select value={newTicketPriority} onValueChange={(v: 'low' | 'medium' | 'high') => setNewTicketPriority(v)}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Приоритет" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/10">
                <SelectItem value="low">Низкий</SelectItem>
                <SelectItem value="medium">Средний</SelectItem>
                <SelectItem value="high">Высокий</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                className="flex-1 border-white/10"
              >
                Отмена
              </Button>
              <Button
                onClick={handleCreateTicket}
                disabled={!newTicketTitle.trim() || !newTicketDescription.trim()}
                className="flex-1 bg-violet-600 hover:bg-violet-500"
              >
                Создать
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ticket Detail Dialog */}
      <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
        <DialogContent className="bg-slate-950 border-white/10 text-white max-w-2xl max-h-[80vh] flex flex-col">
          {selectedTicket && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <DialogTitle className="text-xl mb-2">{selectedTicket.title}</DialogTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getPriorityColor(selectedTicket.priority)}>
                        {selectedTicket.priority === 'high' ? 'Высокий' : selectedTicket.priority === 'medium' ? 'Средний' : 'Низкий'}
                      </Badge>
                      <Badge className={getStatusColor(selectedTicket.status)}>
                        {selectedTicket.status === 'open' ? 'Открыт' : selectedTicket.status === 'in_progress' ? 'В работе' : 'Закрыт'}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-slate-900 border-white/10">
                      {selectedTicket.status !== 'closed' && canRespond && (
                        <DropdownMenuItem onClick={() => setShowCloseDialog(true)}>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Закрыть тикет
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-red-400">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Удалить тикет
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </DialogHeader>

              <ScrollArea className="flex-1 my-4" ref={scrollRef}>
                <div className="space-y-4">
                  {/* Original message */}
                  <div className="p-4 rounded-2xl bg-white/5">
                    <div className="flex items-center gap-2 mb-2">
                      <img
                        src={getUserById(selectedTicket.userId)?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${getUserById(selectedTicket.userId)?.username}`}
                        alt=""
                        className="w-8 h-8 rounded-full"
                      />
                      <span className="font-medium">{getUserById(selectedTicket.userId)?.username}</span>
                      <span className="text-slate-400 text-sm">
                        {new Date(selectedTicket.created_at).toLocaleString('ru-RU')}
                      </span>
                    </div>
                    <p className="text-slate-300">{selectedTicket.description}</p>
                  </div>

                  {/* Responses */}
                  {selectedTicket.responses.map((response) => {
                    const responder = getUserById(response.userId);
                    return (
                      <div key={response.id} className="p-4 rounded-2xl bg-violet-500/10 border border-violet-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <img
                            src={responder?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${responder?.username}`}
                            alt=""
                            className="w-8 h-8 rounded-full"
                          />
                          <span className="font-medium">{responder?.username}</span>
                          <Badge variant="secondary" className="text-xs">Ответ</Badge>
                          <span className="text-slate-400 text-sm">
                            {new Date(response.created_at).toLocaleString('ru-RU')}
                          </span>
                        </div>
                        <p className="text-slate-300">{response.text}</p>
                      </div>
                    );
                  })}

                  {selectedTicket.status === 'closed' && (
                    <div className="p-4 rounded-2xl bg-slate-500/10 border border-slate-500/20">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-slate-400" />
                        <span className="text-slate-400">
                          Тикет закрыт {selectedTicket.closeReason && `· Причина: ${selectedTicket.closeReason}`}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Response input */}
              {selectedTicket.status !== 'closed' && canRespond && (
                <div className="flex gap-2">
                  <Input
                    placeholder="Введите ответ..."
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    className="flex-1 bg-white/5 border-white/10 text-white"
                    onKeyDown={(e) => e.key === 'Enter' && handleResponse()}
                  />
                  <Button
                    onClick={handleResponse}
                    disabled={!responseText.trim()}
                    className="bg-violet-600 hover:bg-violet-500"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Close Dialog */}
      <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <DialogContent className="bg-slate-950 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Закрыть тикет</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Input
              placeholder="Причина закрытия..."
              value={closeReason}
              onChange={(e) => setCloseReason(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCloseDialog(false)}
                className="flex-1 border-white/10"
              >
                Отмена
              </Button>
              <Button
                onClick={handleCloseTicket}
                disabled={!closeReason.trim()}
                className="flex-1 bg-violet-600 hover:bg-violet-500"
              >
                Закрыть
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-slate-950 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Удалить тикет</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-slate-400">Это действие нельзя отменить. Укажите причину удаления:</p>
            <Input
              placeholder="Причина удаления..."
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                className="flex-1 border-white/10"
              >
                Отмена
              </Button>
              <Button
                onClick={handleDeleteTicket}
                disabled={!deleteReason.trim()}
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
