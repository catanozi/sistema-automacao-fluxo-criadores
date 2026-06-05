
import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import MainLayout from '@/components/MainLayout.jsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, CheckCircle, RefreshCw, ChevronLeft, ChevronRight, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext.jsx';

const PendenciesPage = () => {
  const { currentUser } = useAuth();
  const [pendingCreators, setPendingCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  const [editingCreator, setEditingCreator] = useState(null);
  const [phoneValue, setPhoneValue] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchPendingCreators = useCallback(async (isManualRefresh = false) => {
    if (!currentUser) return;
    if (isManualRefresh) setRefreshing(true);
    else if (pendingCreators.length === 0) setLoading(true);

    try {
      const pbFilter = `user_id="${currentUser.id}" && (status="incomplete" || phone="" || phone=null)`;
      const result = await pb.collection('creators').getList(currentPage, itemsPerPage, {
        filter: pbFilter, sort: '-created_at', $autoCancel: false
      });
      setPendingCreators(result.items);
      setTotalPages(result.totalPages || 1);
      setTotalItems(result.totalItems);
    } catch (error) {
      toast.error('Erro ao carregar pendências.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUser, currentPage]);

  useEffect(() => { fetchPendingCreators(); }, [fetchPendingCreators]);

  const handleEdit = (creator) => {
    setEditingCreator(creator);
    setPhoneValue(creator.phone || '');
    setEditDialogOpen(true);
  };

  const handleSavePhone = async () => {
    const numericPhone = phoneValue.replace(/\D/g, '');
    if (numericPhone.length < 10) { toast.error('O telefone deve ter pelo menos 10 dígitos (com DDD).'); return; }
    setSaving(true);
    try {
      await pb.collection('creators').update(editingCreator.id, { phone: numericPhone, status: 'complete' }, { $autoCancel: false });
      toast.success('Telefone adicionado e pendência resolvida!');
      setEditDialogOpen(false);
      if (pendingCreators.length === 1 && currentPage > 1) setCurrentPage(p => p - 1);
      else fetchPendingCreators(true);
    } catch (error) { toast.error('Erro ao salvar telefone.'); } finally { setSaving(false); }
  };

  return (
    <>
      <Helmet><title>Pendências de Cadastro - TikTok Creator Manager</title></Helmet>
      <MainLayout>
        <div className="space-y-6 pb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Pendências de Cadastro</h1>
              <p className="text-muted-foreground mt-2">Criadores importados que estão sem número de Telefone/WhatsApp.</p>
            </div>
            <Button onClick={() => fetchPendingCreators(true)} disabled={refreshing || loading} variant="outline" className="bg-card">
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} /> Atualizar
            </Button>
          </div>

          <Card className="shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted">
                  <TableRow>
                    <TableHead className="font-semibold">Nome do Criador</TableHead>
                    <TableHead className="font-semibold">Usuário TikTok</TableHead>
                    <TableHead className="font-semibold">Telefone</TableHead>
                    <TableHead className="font-semibold text-center">Status</TableHead>
                    <TableHead className="text-right font-semibold">Ação Necessária</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                    ))
                  ) : pendingCreators.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-16 text-muted-foreground">
                        <div className="flex flex-col items-center justify-center">
                          <CheckCircle className="h-12 w-12 text-emerald-500 mb-4" />
                          <p className="text-xl font-semibold text-foreground">Nenhuma pendência!</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    pendingCreators.map((creator) => (
                      <TableRow key={creator.id} className="transition-colors">
                        <TableCell className="font-medium">{creator.name}</TableCell>
                        <TableCell className="text-muted-foreground">@{creator.tiktok_username}</TableCell>
                        <TableCell><span className="text-muted-foreground italic text-sm">Ausente</span></TableCell>
                        <TableCell align="center">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium tracking-wide bg-amber-100 text-amber-700">
                            <AlertCircle className="h-3 w-3" /> Incompleto
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="secondary" onClick={() => handleEdit(creator)} className="font-medium rounded-xl">
                            <Edit2 className="h-4 w-4 mr-2" /> Resolver Pendência
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/30">
                <p className="text-sm text-muted-foreground font-medium">Exibindo <span className="text-foreground">{pendingCreators.length}</span> de <span className="text-foreground">{totalItems}</span> pendências</p>
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
          <DialogContent className="max-w-md sm:rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl">Resolver Pendência</DialogTitle>
              <DialogDescription>Adicione o número de Telefone/WhatsApp para <span className="font-semibold text-foreground">{editingCreator?.name}</span>.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Número de Telefone (com DDD) *</Label>
                <Input type="tel" value={phoneValue} onChange={(e) => setPhoneValue(e.target.value)} className="h-12 text-lg bg-background" autoFocus />
              </div>
            </div>
            <DialogFooter className="border-t border-border pt-4">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="rounded-xl">Cancelar</Button>
              <Button onClick={handleSavePhone} disabled={saving} className="rounded-xl shadow-sm">
                {saving ? 'Salvando...' : 'Salvar e Resolver'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </MainLayout>
    </>
  );
};

export default PendenciesPage;
