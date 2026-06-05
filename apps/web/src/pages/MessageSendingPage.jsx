
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import MainLayout from '@/components/MainLayout.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Send, Eye, Users, Search, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Input } from '@/components/ui/input';
import { useTemplates } from '@/hooks/useTemplates.js';

const MessageSendingPage = () => {
  const { currentUser } = useAuth();
  const { listTemplates } = useTemplates();
  
  const [creators, setCreators] = useState([]);
  const [filteredCreators, setFilteredCreators] = useState([]);
  const [searchCreator, setSearchCreator] = useState('');
  
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('custom');
  
  const [selectedCreators, setSelectedCreators] = useState([]);
  const [messageTemplate, setMessageTemplate] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [sendMode, setSendMode] = useState('multiple');

  useEffect(() => { fetchCreators(); loadTemplates(); }, [currentUser]);

  useEffect(() => {
    if (!searchCreator) setFilteredCreators(creators);
    else {
      const lower = searchCreator.toLowerCase();
      setFilteredCreators(creators.filter(c => c.name.toLowerCase().includes(lower) || c.tiktok_username.toLowerCase().includes(lower)));
    }
  }, [searchCreator, creators]);

  const fetchCreators = async () => {
    if (!currentUser) return;
    try {
      const records = await pb.collection('creators').getFullList({ filter: `user_id="${currentUser.id}" && status="complete"`, sort: 'name', $autoCancel: false });
      setCreators(records); setFilteredCreators(records);
    } catch (error) { toast.error('Erro ao carregar lista de criadores.'); } finally { setLoading(false); }
  };

  const loadTemplates = async () => {
    const fetchedTemplates = await listTemplates();
    setTemplates(fetchedTemplates);
    const defaultTemplate = fetchedTemplates.find(t => t.is_default);
    if (defaultTemplate) { setSelectedTemplateId(defaultTemplate.id); setMessageTemplate(defaultTemplate.template_content); }
  };

  const handleTemplateChange = (templateId) => {
    setSelectedTemplateId(templateId);
    if (templateId === 'custom') setMessageTemplate('');
    else { const selected = templates.find(t => t.id === templateId); if (selected) setMessageTemplate(selected.template_content); }
  };

  const handleSelectAll = (checked) => { setSelectedCreators(checked ? filteredCreators.map(c => c.id) : []); };
  const handleSelectCreator = (creatorId, checked) => { setSelectedCreators(prev => checked ? [...prev, creatorId] : prev.filter(id => id !== creatorId)); };
  const handleSingleSelect = (creatorId) => { setSelectedCreators(creatorId ? [creatorId] : []); };

  const insertVariable = (variable) => { setMessageTemplate(prev => prev + `{${variable}}`); if (selectedTemplateId !== 'custom') setSelectedTemplateId('custom'); };
  const handleTextareaChange = (e) => { setMessageTemplate(e.target.value); if (selectedTemplateId !== 'custom') setSelectedTemplateId('custom'); };

  const personalizeMessage = (creator) => {
    return messageTemplate.replace(/{nome}/g, creator.name || '').replace(/{usuario_tiktok}/g, creator.tiktok_username || '').replace(/{horas_live}/g, creator.hours_live || 0).replace(/{batalhas}/g, creator.battles || 0).replace(/{diamantes}/g, creator.diamonds || 0).replace(/{meta}/g, creator.goal || '').replace(/{resultado}/g, creator.result || '').replace(/{observacoes}/g, creator.observations || '');
  };

  const handleSendMessages = async () => {
    if (selectedCreators.length === 0) { toast.error('Selecione pelo menos um criador na lista.'); return; }
    if (!messageTemplate.trim()) { toast.error('O conteúdo da mensagem não pode estar vazio.'); return; }
    if (!window.confirm(`Você está prestes a enfileirar a mensagem para ${selectedCreators.length} criador(es). Confirmar?`)) return;

    setSending(true);
    let successQueueCount = 0, failCount = 0;

    try {
      for (const creatorId of selectedCreators) {
        const creator = creators.find(c => c.id === creatorId);
        if (!creator) continue;
        try {
          await pb.collection('message_history').create({ user_id: currentUser.id, creator_id: creator.id, creator_name: creator.name, phone: creator.phone, status: 'pending', message_content: personalizeMessage(creator), sent_at: new Date().toISOString() }, { $autoCancel: false });
          successQueueCount++;
        } catch (error) { failCount++; }
      }
      toast.success(`${successQueueCount} mensagens colocadas na fila de envio com sucesso!`);
      if (failCount > 0) toast.error(`${failCount} mensagens falharam ao entrar na fila.`);
      setSelectedCreators([]); setMessageTemplate(''); setSelectedTemplateId('custom'); setShowPreview(false);
    } catch (error) { toast.error('Ocorreu um erro crítico ao enfileirar as mensagens.'); } finally { setSending(false); }
  };

  const variables = [
    { key: 'nome', label: 'Nome' }, { key: 'usuario_tiktok', label: 'Usuário TikTok' }, { key: 'horas_live', label: 'Horas de Live' },
    { key: 'batalhas', label: 'Batalhas' }, { key: 'diamantes', label: 'Diamantes' }, { key: 'meta', label: 'Meta' },
    { key: 'resultado', label: 'Resultado' }, { key: 'observacoes', label: 'Observações' }
  ];

  return (
    <>
      <Helmet><title>Envio de Mensagens - TikTok Creator Manager</title></Helmet>
      <MainLayout>
        <div className="space-y-6 pb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Centro de Mensagens</h1>
              <p className="text-muted-foreground mt-2">Componha e envie mensagens personalizadas através de variáveis dinâmicas.</p>
            </div>
            <Button onClick={() => { fetchCreators(); loadTemplates(); }} disabled={loading} variant="outline" className="bg-card">
              <RefreshCw className="h-4 w-4 mr-2" /> Atualizar Dados
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-12">
            <Card className="lg:col-span-5 shadow-sm flex flex-col h-[calc(100vh-12rem)] min-h-[600px]">
              <CardHeader className="border-b border-border shrink-0">
                <CardTitle className="flex justify-between items-center text-lg">
                  <span>Destinatários</span>
                  <span className="text-xs font-normal px-2.5 py-1 bg-secondary text-secondary-foreground rounded-full">{selectedCreators.length} selecionado(s)</span>
                </CardTitle>
                <div className="flex gap-2 pt-2">
                  <Button variant={sendMode === 'multiple' ? 'default' : 'outline'} size="sm" className="flex-1 rounded-lg" onClick={() => { setSendMode('multiple'); setSelectedCreators([]); }}>Em Massa</Button>
                  <Button variant={sendMode === 'single' ? 'default' : 'outline'} size="sm" className="flex-1 rounded-lg" onClick={() => { setSendMode('single'); setSelectedCreators([]); }}>Individual</Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden flex flex-col p-0">
                {loading ? (
                  <div className="p-4 space-y-3">{Array.from({ length: 6 }).map((_, i) => (<Skeleton key={i} className="h-14 w-full rounded-lg" />))}</div>
                ) : creators.length === 0 ? (
                  <div className="flex flex-col items-center justify-center flex-1 p-8 text-center text-muted-foreground">
                    <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
                    <p className="font-medium">Nenhum destinatário disponível</p>
                  </div>
                ) : (
                  <div className="flex flex-col flex-1 overflow-hidden">
                    {sendMode === 'multiple' ? (
                      <>
                        <div className="p-4 border-b border-border space-y-3 shrink-0 bg-muted/30">
                          <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Buscar na lista..." value={searchCreator} onChange={(e) => setSearchCreator(e.target.value)} className="pl-9 h-9 text-sm rounded-lg bg-background" />
                          </div>
                          <div className="flex items-center space-x-2 px-1">
                            <Checkbox id="select-all" checked={filteredCreators.length > 0 && selectedCreators.length === filteredCreators.length} onCheckedChange={handleSelectAll} />
                            <Label htmlFor="select-all" className="font-semibold cursor-pointer text-sm">Selecionar todos exibidos ({filteredCreators.length})</Label>
                          </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                          {filteredCreators.map((creator) => (
                            <label key={creator.id} className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors border ${selectedCreators.includes(creator.id) ? 'bg-primary/5 border-primary/20' : 'bg-transparent border-transparent hover:bg-muted/50'}`}>
                              <Checkbox id={`creator-${creator.id}`} checked={selectedCreators.includes(creator.id)} onCheckedChange={(checked) => handleSelectCreator(creator.id, checked)} />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate text-foreground">{creator.name}</p>
                                <p className="text-xs text-muted-foreground truncate">@{creator.tiktok_username} • {creator.phone}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="p-4 flex-1">
                        <Label className="mb-2 block text-sm font-medium">Selecione o Criador</Label>
                        <Select value={selectedCreators[0] || ''} onValueChange={(val) => handleSingleSelect(val)}>
                          <SelectTrigger className="w-full bg-background"><SelectValue placeholder="Busque e selecione..." /></SelectTrigger>
                          <SelectContent>
                            {creators.map(c => (<SelectItem key={c.id} value={c.id}>{c.name} (@{c.tiktok_username})</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-7 shadow-sm flex flex-col min-h-[600px]">
              <CardHeader className="border-b border-border shrink-0">
                <CardTitle className="text-lg">Composição da Mensagem</CardTitle>
                <CardDescription>Escreva sua mensagem ou selecione um template salvo.</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto">
                <div className="space-y-2 shrink-0">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Carregar Template</Label>
                  <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
                    <SelectTrigger className="w-full bg-background"><SelectValue placeholder="Selecione um template..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">Mensagem Personalizada (Sem Template)</SelectItem>
                      {templates.map(t => (<SelectItem key={t.id} value={t.id}>{t.template_name} {t.is_default ? '(Padrão)' : ''}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3 shrink-0">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Variáveis Disponíveis</Label>
                  <div className="flex flex-wrap gap-2">
                    {variables.map((variable) => (
                      <Button key={variable.key} variant="secondary" size="sm" onClick={() => insertVariable(variable.key)} className="text-xs h-7 rounded-lg font-medium">{variable.label}</Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2 flex-1 flex flex-col min-h-[200px]">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Corpo da Mensagem</Label>
                  <Textarea placeholder="Olá {nome}..." value={messageTemplate} onChange={handleTextareaChange} className="flex-1 resize-none p-4 text-base rounded-xl bg-background" />
                </div>
                {showPreview && selectedCreators.length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-border shrink-0">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2"><Eye className="h-3.5 w-3.5" /> Prévia Dinâmica</Label>
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                      {selectedCreators.slice(0, 2).map((creatorId) => {
                        const creator = creators.find(c => c.id === creatorId);
                        if (!creator) return null;
                        return (
                          <div key={creator.id} className="p-4 bg-muted/50 rounded-xl border border-border shadow-sm">
                            <p className="font-semibold text-sm mb-2 pb-2 border-b border-border text-foreground">{creator.name} <span className="font-normal text-muted-foreground">(@{creator.tiktok_username})</span></p>
                            <p className="text-sm whitespace-pre-wrap text-foreground leading-relaxed">{personalizeMessage(creator)}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="border-t border-border shrink-0 gap-3 p-4 bg-muted/20">
                <Button onClick={() => setShowPreview(!showPreview)} variant="outline" className="flex-1 h-12 rounded-xl bg-background" disabled={selectedCreators.length === 0}>
                  <Eye className="h-4 w-4 mr-2" /> {showPreview ? 'Ocultar Prévia' : 'Ver Prévia'}
                </Button>
                <Button onClick={handleSendMessages} disabled={sending || selectedCreators.length === 0 || !messageTemplate.trim()} className="flex-1 h-12 rounded-xl shadow-sm text-base font-semibold">
                  <Send className="h-4 w-4 mr-2" /> {sending ? 'Enfileirando...' : `Disparar Envios (${selectedCreators.length})`}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </MainLayout>
    </>
  );
};

export default MessageSendingPage;
