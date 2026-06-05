
import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import MainLayout from '@/components/MainLayout.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Save, Plus, Trash2, Edit, CheckCircle, RefreshCw } from 'lucide-react';
import { useTemplates } from '@/hooks/useTemplates.js';

const SettingsPage = () => {
  const { listTemplates, createTemplate, updateTemplate, deleteTemplate, setDefaultTemplate } = useTemplates();
  
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateContent, setNewTemplateContent] = useState('');
  const [creating, setCreating] = useState(false);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchTemplates = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else if (templates.length === 0) setLoading(true);
    try { const fetchedTemplates = await listTemplates(); setTemplates(fetchedTemplates); } finally { setLoading(false); setRefreshing(false); }
  }, [listTemplates, templates.length]);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const handleCreateTemplate = async () => {
    setCreating(true);
    const result = await createTemplate(newTemplateName, newTemplateContent);
    if (result) { setNewTemplateName(''); setNewTemplateContent(''); fetchTemplates(true); }
    setCreating(false);
  };

  const handleSetDefault = async (id) => { const success = await setDefaultTemplate(id); if (success) fetchTemplates(true); };
  const handleDelete = async (id, name) => { if (!window.confirm(`Tem certeza que deseja excluir o template "${name}"?`)) return; const success = await deleteTemplate(id); if (success) fetchTemplates(true); };
  const openEditDialog = (template) => { setEditingTemplate({ ...template }); setEditDialogOpen(true); };

  const handleSaveEdit = async () => {
    setSavingEdit(true);
    const result = await updateTemplate(editingTemplate.id, editingTemplate.template_name, editingTemplate.template_content);
    if (result) { setEditDialogOpen(false); fetchTemplates(true); }
    setSavingEdit(false);
  };

  const insertVariable = (variable, isEdit = false) => {
    const textToInsert = `{${variable}}`;
    if (isEdit) setEditingTemplate(prev => ({ ...prev, template_content: prev.template_content + textToInsert }));
    else setNewTemplateContent(prev => prev + textToInsert);
  };

  const variables = [
    { key: 'nome', label: 'Nome' }, { key: 'usuario_tiktok', label: 'Usuário TikTok' }, { key: 'horas_live', label: 'Horas de Live' },
    { key: 'batalhas', label: 'Batalhas' }, { key: 'diamantes', label: 'Diamantes' }, { key: 'meta', label: 'Meta' },
    { key: 'resultado', label: 'Resultado' }, { key: 'observacoes', label: 'Observações' }
  ];

  return (
    <>
      <Helmet><title>Configurações - TikTok Creator Manager</title></Helmet>
      <MainLayout>
        <div className="space-y-8 pb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
              <p className="text-muted-foreground mt-2">Crie e gerencie templates de mensagens para envios rápidos.</p>
            </div>
            <Button onClick={() => fetchTemplates(true)} disabled={refreshing || loading} variant="outline" className="bg-card">
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} /> Atualizar
            </Button>
          </div>

          <Card className="shadow-sm">
            <CardHeader className="border-b border-border">
              <CardTitle>Criar Novo Template</CardTitle>
              <CardDescription>Defina um padrão de mensagem utilizando variáveis dinâmicas.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nome do Template</Label>
                <Input placeholder="Ex: Boas-vindas, Lembrete de Meta..." value={newTemplateName} onChange={(e) => setNewTemplateName(e.target.value)} className="max-w-md bg-background" />
              </div>
              <div className="space-y-3">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Variáveis Disponíveis</Label>
                <div className="flex flex-wrap gap-2">
                  {variables.map((variable) => (
                    <Button key={variable.key} variant="secondary" size="sm" onClick={() => insertVariable(variable.key)} className="text-xs h-7 rounded-lg font-medium">{variable.label}</Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Conteúdo da Mensagem</Label>
                <Textarea placeholder="Olá {nome}..." value={newTemplateContent} onChange={(e) => setNewTemplateContent(e.target.value)} rows={5} className="resize-none rounded-xl bg-background" />
              </div>
              <Button onClick={handleCreateTemplate} disabled={creating || !newTemplateName.trim() || !newTemplateContent.trim()} className="rounded-xl">
                <Plus className="h-4 w-4 mr-2" /> {creating ? 'Salvando...' : 'Salvar Template'}
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-sm overflow-hidden">
            <CardHeader className="border-b border-border">
              <CardTitle>Templates Salvos</CardTitle>
              <CardDescription>Gerencie seus templates existentes.</CardDescription>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted">
                  <TableRow>
                    <TableHead className="font-semibold w-[250px]">Nome do Template</TableHead>
                    <TableHead className="font-semibold">Prévia do Conteúdo</TableHead>
                    <TableHead className="text-right font-semibold w-[200px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}><TableCell colSpan={3}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                    ))
                  ) : templates.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center py-12 text-muted-foreground">Nenhum template salvo ainda.</TableCell></TableRow>
                  ) : (
                    templates.map((template) => (
                      <TableRow key={template.id} className="transition-colors">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {template.template_name}
                            {template.is_default && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-secondary text-secondary-foreground border border-secondary/30">Padrão</span>}
                          </div>
                        </TableCell>
                        <TableCell><span className="text-muted-foreground text-sm line-clamp-2">{template.template_content}</span></TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {!template.is_default && <Button variant="outline" size="sm" onClick={() => handleSetDefault(template.id)} className="bg-background h-8 text-xs rounded-lg"><CheckCircle className="h-3.5 w-3.5 mr-1.5" /> Usar</Button>}
                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(template)} className="hover:bg-primary/10 hover:text-primary h-8 w-8 rounded-lg"><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(template.id, template.template_name)} className="hover:bg-destructive/10 hover:text-destructive h-8 w-8 rounded-lg"><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>

        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl sm:rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl">Editar Template</DialogTitle>
            </DialogHeader>
            {editingTemplate && (
              <div className="space-y-6 py-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nome do Template</Label>
                  <Input value={editingTemplate.template_name} onChange={(e) => setEditingTemplate({ ...editingTemplate, template_name: e.target.value })} className="bg-background" />
                </div>
                <div className="space-y-3">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Variáveis Disponíveis</Label>
                  <div className="flex flex-wrap gap-2">
                    {variables.map((variable) => (
                      <Button key={variable.key} variant="secondary" size="sm" onClick={() => insertVariable(variable.key, true)} className="text-xs h-7 rounded-lg font-medium">{variable.label}</Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Conteúdo da Mensagem</Label>
                  <Textarea value={editingTemplate.template_content} onChange={(e) => setEditingTemplate({ ...editingTemplate, template_content: e.target.value })} rows={6} className="resize-none rounded-xl bg-background" />
                </div>
              </div>
            )}
            <DialogFooter className="border-t border-border pt-4">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="rounded-xl">Cancelar</Button>
              <Button onClick={handleSaveEdit} disabled={savingEdit || !editingTemplate?.template_name.trim() || !editingTemplate?.template_content.trim()} className="rounded-xl">
                <Save className="h-4 w-4 mr-2" /> {savingEdit ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </MainLayout>
    </>
  );
};

export default SettingsPage;
