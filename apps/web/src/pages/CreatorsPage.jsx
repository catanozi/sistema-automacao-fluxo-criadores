
import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import MainLayout from '@/components/MainLayout.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Edit, Trash2, ChevronLeft, ChevronRight, RefreshCw, Users } from 'lucide-react';
import { toast } from 'sonner';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { cleanupDuplicates } from '@/lib/deduplicationUtils.js';

const CreatorsPage = () => {
  const { currentUser } = useAuth();
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState('-created_at');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  const [editingCreator, setEditingCreator] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const fetchCreators = useCallback(async (isManualRefresh = false) => {
    if (!currentUser) return;
    if (isManualRefresh) setRefreshing(true);
    else if (creators.length === 0) setLoading(true);

    try {
      let pbFilter = `user_id="${currentUser.id}"`;
      if (statusFilter !== 'all') pbFilter += ` && status="${statusFilter}"`;
      if (searchTerm) pbFilter += ` && (name ~ "${searchTerm}" || tiktok_username ~ "${searchTerm}" || phone ~ "${searchTerm}")`;

      const result = await pb.collection('creators').getList(currentPage, itemsPerPage, {
        filter: pbFilter, sort: sortField, $autoCancel: false
      });

      setCreators(result.items);
      setTotalPages(result.totalPages || 1);
      setTotalItems(result.totalItems);
    } catch (error) {
      toast.error('Erro ao carregar criadores.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUser, currentPage, searchTerm, statusFilter, sortField]);

  useEffect(() => {
    let mounted = true;
    const initCleanup = async () => {
      if (!currentUser) return;
      const deletedCount = await cleanupDuplicates(currentUser.id);
      if (mounted && deletedCount > 0) {
        toast.success(`${deletedCount} duplicatas removidas`);
        fetchCreators(true);
      }
    };
    initCleanup();
    return () => { mounted = false; };
  }, [currentUser, fetchCreators]);

  useEffect(() => { fetchCreators(); }, [fetchCreators]);
  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter, sortField]);

  const handleEdit = (creator) => { setEditingCreator({ ...creator }); setEditDialogOpen(true); };

  const handleSaveEdit = async () => {
    try {
      const updatedData = {
        name: editingCreator.name, tiktok_username: editingCreator.tiktok_username, phone: editingCreator.phone,
        hours_live: parseFloat(editingCreator.hours_live) || 0, battles: parseFloat(editingCreator.battles) || 0,
        diamonds: parseFloat(editingCreator.diamonds) || 0, goal: editingCreator.goal, result: editingCreator.result,
        observations: editingCreator.observations, status: (editingCreator.phone && editingCreator.phone.length >= 10) ? 'complete' : 'incomplete'
      };
      await pb.collection('creators').update(editingCreator.id, updatedData, { $autoCancel: false });
      toast.success('Criador atualizado com sucesso!');
      setEditDialogOpen(false);
      fetchCreators(true);
    } catch (error) { toast.error('Erro ao atualizar criador.'); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Tem certeza que deseja excluir permanentemente o criador ${name}?`)) return;
    try {
      await pb.collection('creators').delete(id, { $autoCancel: false });
      toast.success('Criador excluído com sucesso.');
      if (creators.length === 1 && currentPage > 1) setCurrentPage(p => p - 1);
      else fetchCreators(true);
    } catch (error) { toast.error('Erro ao excluir criador.'); }
  };

  return (
    <>
      <Helmet><title>Criadores - TikTok Creator Manager</title></Helmet>
      <MainLayout>
        <div className="space-y-6 pb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Base de Criadores</h1>
              <p className="text-muted-foreground mt-2">Listagem completa e gestão dos seus criadores cadastrados.</p>
            </div>
            <Button onClick={() => fetchCreators(true)} disabled={refreshing || loading} variant="outline" className="bg-card">
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} /> Atualizar
            </Button>
          </div>

          <Card className="shadow-sm">
            <CardHeader className="pb-3"><CardTitle className="text-lg">Filtros de Pesquisa</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Buscar por nome, usuário @ ou telefone..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 bg-background" />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48 bg-background"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="complete">Cadastro Completo</SelectItem>
                    <SelectItem value="incomplete">Pendente (Sem Tel)</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortField} onValueChange={setSortField}>
                  <SelectTrigger className="w-full sm:w-48 bg-background"><SelectValue placeholder="Ordenar por" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="-created_at">Mais Recentes</SelectItem>
                    <SelectItem value="name">Nome (A-Z)</SelectItem>
                    <SelectItem value="-hours_live">Mais Horas Live</SelectItem>
                    <SelectItem value="-diamonds">Mais Diamantes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted">
                  <TableRow>
                    <TableHead className="font-semibold">Nome</TableHead>
                    <TableHead className="font-semibold">Usuário TikTok</TableHead>
                    <TableHead className="font-semibold">Telefone</TableHead>
                    <TableHead className="font-semibold text-center">Status</TableHead>
                    <TableHead className="text-right font-semibold">Horas Live</TableHead>
                    <TableHead className="text-right font-semibold">Batalhas</TableHead>
                    <TableHead className="text-right font-semibold">Diamantes</TableHead>
                    <TableHead className="text-right font-semibold">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}><TableCell colSpan={8}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                    ))
                  ) : creators.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-16 text-muted-foreground">Nenhum criador encontrado</TableCell></TableRow>
                  ) : (
                    creators.map((creator) => (
                      <TableRow key={creator.id} className="transition-colors">
                        <TableCell className="font-medium text-foreground">{creator.name}</TableCell>
                        <TableCell className="text-muted-foreground">@{creator.tiktok_username}</TableCell>
                        <TableCell className="text-muted-foreground">{creator.phone || <span className="italic">Não informado</span>}</TableCell>
                        <TableCell align="center">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium tracking-wide ${creator.status === 'complete' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {creator.status === 'complete' ? 'Completo' : 'Pendente'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{creator.hours_live || 0}</TableCell>
                        <TableCell className="text-right tabular-nums">{creator.battles || 0}</TableCell>
                        <TableCell className="text-right tabular-nums">{creator.diamonds?.toLocaleString('pt-BR') || 0}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(creator)} className="hover:bg-primary/10 hover:text-primary h-8 w-8 rounded-lg"><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(creator.id, creator.name)} className="hover:bg-destructive/10 hover:text-destructive h-8 w-8 rounded-lg"><Trash2 className="h-4 w-4" /></Button>
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
                <p className="text-sm text-muted-foreground font-medium">Exibindo <span className="text-foreground">{creators.length}</span> de <span className="text-foreground">{totalItems}</span> registros</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1 || loading} className="bg-background"><ChevronLeft className="h-4 w-4" /></Button>
                  <div className="flex items-center px-4 font-medium text-sm border border-border rounded-lg bg-background">{currentPage} / {totalPages}</div>
                  <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || loading} className="bg-background"><ChevronRight className="h-4 w-4" /></Button>
                </div>
              </div>
            )}
          </Card>
        </div>

        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto sm:rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl">Editar Criador</DialogTitle>
              <DialogDescription>Atualize as informações completas do criador na base.</DialogDescription>
            </DialogHeader>
            {editingCreator && (
              <div className="grid gap-5 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Nome *</Label><Input value={editingCreator.name} onChange={(e) => setEditingCreator({ ...editingCreator, name: e.target.value })} className="bg-background" /></div>
                  <div className="space-y-2"><Label>Usuário TikTok *</Label><Input value={editingCreator.tiktok_username} onChange={(e) => setEditingCreator({ ...editingCreator, tiktok_username: e.target.value })} className="bg-background" /></div>
                </div>
                <div className="space-y-2"><Label>Telefone/WhatsApp</Label><Input value={editingCreator.phone || ''} onChange={(e) => setEditingCreator({ ...editingCreator, phone: e.target.value })} className="bg-background" /></div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2"><Label>Horas de Live</Label><Input type="number" value={editingCreator.hours_live || ''} onChange={(e) => setEditingCreator({ ...editingCreator, hours_live: e.target.value })} className="bg-background" /></div>
                  <div className="space-y-2"><Label>Batalhas</Label><Input type="number" value={editingCreator.battles || ''} onChange={(e) => setEditingCreator({ ...editingCreator, battles: e.target.value })} className="bg-background" /></div>
                  <div className="space-y-2"><Label>Diamantes</Label><Input type="number" value={editingCreator.diamonds || ''} onChange={(e) => setEditingCreator({ ...editingCreator, diamonds: e.target.value })} className="bg-background" /></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Meta</Label><Input value={editingCreator.goal || ''} onChange={(e) => setEditingCreator({ ...editingCreator, goal: e.target.value })} className="bg-background" /></div>
                  <div className="space-y-2"><Label>Resultado</Label><Input value={editingCreator.result || ''} onChange={(e) => setEditingCreator({ ...editingCreator, result: e.target.value })} className="bg-background" /></div>
                </div>
                <div className="space-y-2"><Label>Observações</Label><Input value={editingCreator.observations || ''} onChange={(e) => setEditingCreator({ ...editingCreator, observations: e.target.value })} className="bg-background" /></div>
              </div>
            )}
            <DialogFooter className="border-t border-border pt-4 mt-2">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="rounded-xl">Cancelar</Button>
              <Button onClick={handleSaveEdit} className="rounded-xl">Salvar Alterações</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </MainLayout>
    </>
  );
};

export default CreatorsPage;
