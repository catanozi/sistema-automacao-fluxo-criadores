
import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import MainLayout from '@/components/MainLayout.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Eye, RefreshCw, ChevronLeft, ChevronRight, Trash2, Send } from 'lucide-react';
import { toast } from 'sonner';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext.jsx';

const MessageHistoryPage = () => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  const [selectedMessage, setSelectedMessage] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchMessages = useCallback(async (isManualRefresh = false) => {
    if (!currentUser) return;
    if (isManualRefresh) setRefreshing(true);
    else if (messages.length === 0) setLoading(true);

    try {
      let pbFilter = `user_id="${currentUser.id}"`;
      if (statusFilter !== 'all') pbFilter += ` && status="${statusFilter}"`;
      if (dateFilter === '7d') { const d = new Date(); d.setDate(d.getDate() - 7); pbFilter += ` && sent_at >= "${d.toISOString().replace('T', ' ')}"`; }
      else if (dateFilter === '30d') { const d = new Date(); d.setDate(d.getDate() - 30); pbFilter += ` && sent_at >= "${d.toISOString().replace('T', ' ')}"`; }
      if (searchTerm) pbFilter += ` && (creator_name ~ "${searchTerm}" || phone ~ "${searchTerm}")`;

      const result = await pb.collection('message_history').getList(currentPage, itemsPerPage, { filter: pbFilter, sort: '-sent_at', $autoCancel: false });
      setMessages(result.items); setTotalPages(result.totalPages || 1); setTotalItems(result.totalItems);
    } catch (error) { toast.error('Erro ao carregar histórico.'); } finally { setLoading(false); setRefreshing(false); }
  }, [currentUser, currentPage, searchTerm, statusFilter, dateFilter]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);
  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter, dateFilter]);

  const handleViewMessage = (message) => { setSelectedMessage(message); setDialogOpen(true); };

  const handleResend = async (message) => {
    if (!window.confirm(`Criar novo envio (pendente) com a mesma mensagem para ${message.creator_name}?`)) return;
    try {
      await pb.collection('message_history').create({ user_id: currentUser.id, creator_id: message.creator_id, creator_name: message.creator_name, phone: message.phone, message_content: message.message_content, status: 'pending', sent_at: new Date().toISOString() }, { $autoCancel: false });
      toast.success('Mensagem enfileirada com sucesso!'); setDialogOpen(false); fetchMessages(true);
    } catch (error) { toast.error('Erro ao reenviar mensagem.'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este registro de envio?')) return;
    try {
      await pb.collection('message_history').delete(id, { $autoCancel: false });
      toast.success('Registro excluído com sucesso.');
      if (messages.length === 1 && currentPage > 1) setCurrentPage(p => p - 1); else fetchMessages(true);
      setDialogOpen(false);
    } catch (error) { toast.error('Erro ao excluir registro.'); }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'success': return 'bg-emerald-100 text-emerald-700';
      case 'failed': return 'bg-destructive/10 text-destructive';
      case 'pending': return 'bg-blue-100 text-blue-700';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) { case 'success': return 'Enviada'; case 'failed': return 'Falha'; case 'pending': return 'Na Fila'; default: return 'Desconhecido'; }
  };

  return (
    <>
      <Helmet><title>Histórico de Envios - TikTok Creator Manager</title></Helmet>
      <MainLayout>
        <div className="space-y-6 pb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Relatório de Envios</h1>
              <p className="text-muted-foreground mt-2">Acompanhe o log completo de mensagens na fila e enviadas.</p>
            </div>
            <Button onClick={() => fetchMessages(true)} disabled={refreshing || loading} variant="outline" className="bg-card">
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} /> Atualizar Log
            </Button>
          </div>

          <Card className="shadow-sm border-border">
            <CardHeader className="pb-3"><CardTitle className="text-lg">Filtros de Log</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Buscar por nome do criador ou telefone..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 bg-background" />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px] bg-background"><SelectValue placeholder="Status do Envio" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Qualquer Status</SelectItem>
                    <SelectItem value="pending">Na Fila (Pendente)</SelectItem>
                    <SelectItem value="success">Sucesso (Enviada)</SelectItem>
                    <SelectItem value="failed">Falha no Envio</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-full sm:w-[180px] bg-background"><SelectValue placeholder="Período" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todo o Período</SelectItem>
                    <SelectItem value="7d">Últimos 7 dias</SelectItem>
                    <SelectItem value="30d">Últimos 30 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted">
                  <TableRow>
                    <TableHead className="font-semibold">Destinatário</TableHead>
                    <TableHead className="font-semibold">Telefone</TableHead>
                    <TableHead className="font-semibold">Data da Ação</TableHead>
                    <TableHead className="font-semibold text-center">Status</TableHead>
                    <TableHead className="font-semibold">Resumo da Mensagem</TableHead>
                    <TableHead className="text-right font-semibold">Opções</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                    ))
                  ) : messages.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-16 text-muted-foreground">Nenhum envio registrado</TableCell></TableRow>
                  ) : (
                    messages.map((message) => (
                      <TableRow key={message.id} className="transition-colors">
                        <TableCell className="font-medium text-foreground">{message.creator_name}</TableCell>
                        <TableCell className="text-muted-foreground">{message.phone}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(message.sent_at)}</TableCell>
                        <TableCell align="center">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide ${getStatusStyle(message.status)}`}>
                            {getStatusLabel(message.status)}
                          </span>
                        </TableCell>
                        <TableCell><span className="text-muted-foreground text-sm line-clamp-1 max-w-[200px] md:max-w-[300px]">{message.message_content}</span></TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleViewMessage(message)} className="hover:bg-primary/10 hover:text-primary h-8 w-8 rounded-lg"><Eye className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(message.id)} className="hover:bg-destructive/10 hover:text-destructive h-8 w-8 rounded-lg"><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/30">
                <p className="text-sm text-muted-foreground font-medium">Exibindo <span className="text-foreground">{messages.length}</span> de <span className="text-foreground">{totalItems}</span> registros</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1 || loading} className="bg-background"><ChevronLeft className="h-4 w-4" /></Button>
                  <div className="flex items-center px-4 font-medium text-sm border border-border rounded-lg bg-background">{currentPage} / {totalPages}</div>
                  <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || loading} className="bg-background"><ChevronRight className="h-4 w-4" /></Button>
                </div>
              </div>
            )}
          </Card>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl sm:rounded-2xl">
            <DialogHeader className="border-b border-border pb-4">
              <DialogTitle className="text-xl">Log de Mensagem</DialogTitle>
            </DialogHeader>
            {selectedMessage && (
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-xl border border-border">
                  <div className="space-y-1"><p className="text-xs uppercase font-semibold text-muted-foreground">Destinatário</p><p className="text-sm font-medium">{selectedMessage.creator_name}</p></div>
                  <div className="space-y-1"><p className="text-xs uppercase font-semibold text-muted-foreground">Telefone</p><p className="text-sm font-medium">{selectedMessage.phone}</p></div>
                  <div className="space-y-1"><p className="text-xs uppercase font-semibold text-muted-foreground">Data da Ação</p><p className="text-sm font-medium">{formatDate(selectedMessage.sent_at)}</p></div>
                  <div className="space-y-1"><p className="text-xs uppercase font-semibold text-muted-foreground">Status Atual</p><span className={`inline-flex items-center px-2 py-0.5 mt-0.5 rounded-full text-xs font-semibold tracking-wide ${getStatusStyle(selectedMessage.status)}`}>{getStatusLabel(selectedMessage.status)}</span></div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs uppercase font-semibold text-muted-foreground">Conteúdo da Mensagem</p>
                  <div className="p-4 bg-muted/20 border border-border rounded-xl min-h-[100px]"><p className="text-sm whitespace-pre-wrap text-foreground leading-relaxed">{selectedMessage.message_content}</p></div>
                </div>
              </div>
            )}
            <div className="flex justify-between gap-2 border-t border-border pt-4">
              <Button variant="outline" onClick={() => handleDelete(selectedMessage?.id)} className="text-destructive hover:bg-destructive/10">Excluir Log</Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)} className="bg-background">Fechar</Button>
                <Button onClick={() => handleResend(selectedMessage)}><RefreshCw className="h-4 w-4 mr-2" /> Reenviar Novamente</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </MainLayout>
    </>
  );
};

export default MessageHistoryPage;
