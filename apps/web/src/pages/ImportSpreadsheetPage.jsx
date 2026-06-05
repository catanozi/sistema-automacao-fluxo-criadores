import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import MainLayout from '@/components/MainLayout.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext.jsx';
import * as XLSX from 'xlsx';
import { normalizeString, normalizePhone, normalizeTikTok } from '@/lib/deduplicationUtils.js';

const REQUIRED_COLUMNS = ['Nome do criador', 'Diamantes', 'Duração da LIVE', 'Batalhas'];

const normalizeHeader = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');

const parseNumber = (value) => {
  if (value === undefined || value === null || value === '') return 0;
  if (typeof value === 'number') return value;

  const clean = String(value)
    .replace(/%/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .replace(/[^0-9.-]/g, '');

  const parsed = parseFloat(clean);
  return Number.isFinite(parsed) ? parsed : 0;
};

const parseLiveDurationToHours = (value) => {
  if (value === undefined || value === null || value === '') return 0;
  if (typeof value === 'number') return value;

  const text = String(value).toLowerCase().trim();
  const hours = parseFloat((text.match(/(\d+(?:[.,]\d+)?)\s*h/) || [])[1]?.replace(',', '.') || 0);
  const minutes = parseFloat((text.match(/(\d+(?:[.,]\d+)?)\s*m/) || [])[1]?.replace(',', '.') || 0);
  const seconds = parseFloat((text.match(/(\d+(?:[.,]\d+)?)\s*s/) || [])[1]?.replace(',', '.') || 0);

  if (hours || minutes || seconds) {
    return Number((hours + minutes / 60 + seconds / 3600).toFixed(2));
  }

  return parseNumber(value);
};

const getCellValue = (rowObject, possibleHeaders) => {
  for (const header of possibleHeaders) {
    const value = rowObject[header];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return value;
    }
  }
  return '';
};

const buildRowObject = (headers, row) => {
  const rowObject = {};
  headers.forEach((header, index) => {
    rowObject[header] = row[index];
  });
  return rowObject;
};

const ImportSpreadsheetPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [parsedData, setParsedData] = useState([]);
  const [previewData, setPreviewData] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [missingColumns, setMissingColumns] = useState([]);

  const handleReset = () => {
    setFile(null);
    setHeaders([]);
    setParsedData([]);
    setPreviewData([]);
    setImportResult(null);
    setMissingColumns([]);
    toast.success('Formulário limpo.');
  };

  const getColumnByName = (headerMap, possibleNames) => {
    for (const name of possibleNames) {
      const found = headerMap.get(normalizeHeader(name));
      if (found) return found;
    }
    return null;
  };

  const transformRow = (rowObject, headerMap) => {
    const creatorIdHeader = getColumnByName(headerMap, ['ID do criador', 'Creator ID', 'ID']);
    const creatorNameHeader = getColumnByName(headerMap, ['Nome do criador', 'Creator name', 'Criador', 'Nome']);
    const phoneHeader = getColumnByName(headerMap, ['Telefone/WhatsApp', 'Telefone', 'WhatsApp', 'Phone']);
    const diamondsHeader = getColumnByName(headerMap, ['Diamantes', 'Diamonds']);
    const durationHeader = getColumnByName(headerMap, ['Duração da LIVE', 'Duracao da LIVE', 'LIVE duration']);
    const battlesHeader = getColumnByName(headerMap, ['Batalhas', 'Battles']);
    const groupHeader = getColumnByName(headerMap, ['Grupo']);
    const agentHeader = getColumnByName(headerMap, ['Agente']);
    const periodHeader = getColumnByName(headerMap, ['Período dos dados', 'Periodo dos dados']);

    const creatorName = String(getCellValue(rowObject, [creatorNameHeader]) || '').trim();
    const creatorId = String(getCellValue(rowObject, [creatorIdHeader]) || '').trim();
    const rawPhone = String(getCellValue(rowObject, [phoneHeader]) || '').trim();
    const group = String(getCellValue(rowObject, [groupHeader]) || '').trim();
    const agent = String(getCellValue(rowObject, [agentHeader]) || '').trim();
    const period = String(getCellValue(rowObject, [periodHeader]) || '').trim();

    const phone = normalizePhone(rawPhone);
    const observations = [
      creatorId ? `ID do criador: ${creatorId}` : null,
      group ? `Grupo: ${group}` : null,
      agent ? `Agente: ${agent}` : null,
      period ? `Período: ${period}` : null,
    ].filter(Boolean).join(' | ');

    return {
      user_id: currentUser.id,
      name: creatorName || creatorId,
      tiktok_username: normalizeTikTok(creatorName || creatorId),
      phone,
      hours_live: parseLiveDurationToHours(getCellValue(rowObject, [durationHeader])),
      battles: parseNumber(getCellValue(rowObject, [battlesHeader])),
      diamonds: parseNumber(getCellValue(rowObject, [diamondsHeader])),
      goal: '',
      result: '',
      observations,
      status: phone && phone.length >= 10 ? 'complete' : 'incomplete',
    };
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setImportResult(null);
    setMissingColumns([]);

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        if (jsonData.length <= 1) {
          toast.error('A planilha não possui dados para importar.');
          return;
        }

        const headerRow = jsonData[0].map((header) => String(header || '').trim());
        const bodyRows = jsonData.slice(1).filter((row) => row.some((cell) => String(cell || '').trim() !== ''));
        const headerMap = new Map(headerRow.map((header) => [normalizeHeader(header), header]));

        const missing = REQUIRED_COLUMNS.filter((column) => !headerMap.has(normalizeHeader(column)));
        setMissingColumns(missing);

        const transformedRows = bodyRows.map((row) => transformRow(buildRowObject(headerRow, row), headerMap));

        setHeaders(headerRow);
        setParsedData(transformedRows);
        setPreviewData(transformedRows.slice(0, 5));

        if (missing.length > 0) {
          toast.warning(`Planilha carregada, mas faltam colunas esperadas: ${missing.join(', ')}`);
        } else {
          toast.success(`Arquivo carregado: ${transformedRows.length} criadores encontrados.`);
        }
      } catch (error) {
        console.error(error);
        toast.error('Erro ao processar arquivo. Verifique se é um Excel válido.');
      }
    };

    reader.readAsArrayBuffer(selectedFile);
  };

  const handleImport = async () => {
    if (!parsedData.length) return;
    if (!currentUser) {
      toast.error('Usuário não autenticado.');
      return;
    }

    const validationErrors = [];
    const rowsToProcess = parsedData.map((creatorData, index) => {
      const nName = normalizeString(creatorData.name);
      const nPhone = normalizePhone(creatorData.phone);
      const nTikTok = normalizeTikTok(creatorData.tiktok_username);

      if (!nName) validationErrors.push(`Linha ${index + 2}: Nome do criador não pode estar vazio.`);
      if (!nTikTok) validationErrors.push(`Linha ${index + 2}: Identificador do criador não pode estar vazio.`);

      return {
        data: {
          ...creatorData,
          name: creatorData.name || '',
          tiktok_username: nTikTok,
          phone: nPhone,
          status: nPhone && nPhone.length >= 10 ? 'complete' : 'incomplete',
        },
        nName,
        nPhone,
        nTikTok,
      };
    });

    if (validationErrors.length > 0) {
      toast.error(`Corrija os erros antes de importar:\n${validationErrors.slice(0, 3).join('\n')}`);
      return;
    }

    setImporting(true);
    let created = 0;
    let updated = 0;
    let failed = 0;

    try {
      for (const item of rowsToProcess) {
        try {
          const { data, nName, nPhone, nTikTok } = item;
          const safeName = nName || 'NO_MATCH_NAME_123';
          const safePhone = nPhone || 'NO_MATCH_PHONE_123';
          const safeTikTok = nTikTok || 'NO_MATCH_TIKTOK_123';

          const pbFilter = `(name~"${safeName}" || phone="${safePhone}" || tiktok_username="${safeTikTok}") && user_id="${currentUser.id}"`;
          const existing = await pb.collection('creators').getList(1, 1, { filter: pbFilter, $autoCancel: false });

          if (existing.items.length > 0) {
            await pb.collection('creators').update(existing.items[0].id, data, { $autoCancel: false });
            updated++;
          } else {
            await pb.collection('creators').create(data, { $autoCancel: false });
            created++;
          }
        } catch (error) {
          console.error('Falha ao importar linha:', error);
          failed++;
        }
      }

      await pb.collection('imports').create({
        user_id: currentUser.id,
        file_name: file.name,
        total_records: parsedData.length,
        successful_records: created + updated,
        failed_records: failed,
        notes: `Importação concluída: ${created} criados, ${updated} atualizados, ${failed} falhas`,
      }, { $autoCancel: false });

      setImportResult({ created, updated, failed, total: parsedData.length });
      toast.success(`${created} criados e ${updated} atualizados com sucesso!`);
      setTimeout(() => navigate('/creators'), 2000);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao processar importação.');
    } finally {
      setImporting(false);
    }
  };

  const incompleteCount = parsedData.filter((creator) => creator.status === 'incomplete').length;

  return (
    <>
      <Helmet><title>Importar planilha - TikTok Creator Manager</title></Helmet>
      <MainLayout>
        <div className="space-y-6 pb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Importar Planilha</h1>
              <p className="text-muted-foreground mt-2">Importe a planilha real do TikTok. O sistema usa somente as colunas necessárias.</p>
            </div>
            <Button onClick={handleReset} variant="outline" disabled={importing || (!file && parsedData.length === 0)} className="bg-card">
              <RefreshCw className="h-4 w-4 mr-2" /> Limpar Formulário
            </Button>
          </div>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Upload de Arquivo</CardTitle>
              <CardDescription>Selecione o arquivo Excel (.xlsx, .xls) exportado do TikTok.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <div className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary/90 transition-all shadow-sm">
                    <Upload className="h-5 w-5" /> Selecionar Arquivo
                  </div>
                  <Input id="file-upload" type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} className="hidden" />
                </Label>
                {file && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted px-4 py-2 rounded-lg border border-border">
                    <FileSpreadsheet className="h-4 w-4 text-primary" /> {file.name}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {headers.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Colunas utilizadas</CardTitle>
                <CardDescription>O mapeamento agora é automático. As outras colunas da planilha são ignoradas.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {missingColumns.length > 0 ? (
                  <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
                    <AlertCircle className="h-5 w-5 mt-0.5" />
                    <div>
                      <p className="font-semibold">Colunas esperadas não encontradas:</p>
                      <p>{missingColumns.join(', ')}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
                    <CheckCircle className="h-5 w-5" />
                    <p className="font-medium">Planilha reconhecida com sucesso.</p>
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-lg border p-3"><span className="text-xs text-muted-foreground">Nome</span><p className="font-medium">Nome do criador</p></div>
                  <div className="rounded-lg border p-3"><span className="text-xs text-muted-foreground">Usuário TikTok</span><p className="font-medium">Nome do criador</p></div>
                  <div className="rounded-lg border p-3"><span className="text-xs text-muted-foreground">Diamantes</span><p className="font-medium">Diamantes</p></div>
                  <div className="rounded-lg border p-3"><span className="text-xs text-muted-foreground">Horas de live</span><p className="font-medium">Duração da LIVE</p></div>
                  <div className="rounded-lg border p-3"><span className="text-xs text-muted-foreground">Batalhas</span><p className="font-medium">Batalhas</p></div>
                  <div className="rounded-lg border p-3"><span className="text-xs text-muted-foreground">Telefone</span><p className="font-medium">Não vem na planilha; entra como pendente</p></div>
                </div>
              </CardContent>
            </Card>
          )}

          {parsedData.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Pré-visualização</CardTitle>
                <CardDescription>
                  {parsedData.length} criadores encontrados. {incompleteCount} ficarão como pendentes por falta de telefone.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border border-border overflow-hidden bg-card">
                  <Table>
                    <TableHeader className="bg-muted">
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Usuário TikTok</TableHead>
                        <TableHead className="text-right">Horas Live</TableHead>
                        <TableHead className="text-right">Batalhas</TableHead>
                        <TableHead className="text-right">Diamantes</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.map((creator, index) => (
                        <TableRow key={index}>
                          <TableCell>{creator.name}</TableCell>
                          <TableCell>@{creator.tiktok_username}</TableCell>
                          <TableCell className="text-right">{creator.hours_live}</TableCell>
                          <TableCell className="text-right">{creator.battles}</TableCell>
                          <TableCell className="text-right">{creator.diamonds.toLocaleString('pt-BR')}</TableCell>
                          <TableCell>{creator.status === 'complete' ? 'Completo' : 'Pendente'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {importResult && (
                  <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
                    <p className="font-semibold">Importação concluída</p>
                    <p>{importResult.created} criados, {importResult.updated} atualizados e {importResult.failed} falhas.</p>
                  </div>
                )}

                <div className="mt-8 flex justify-end">
                  <Button onClick={handleImport} disabled={importing || missingColumns.length > 0} className="px-8 py-6 rounded-xl text-base font-semibold shadow-sm">
                    {importing ? 'Processando...' : `Importar ${parsedData.length} Registros`}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </MainLayout>
    </>
  );
};

export default ImportSpreadsheetPage;
