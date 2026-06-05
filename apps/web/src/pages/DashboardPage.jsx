
import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import MainLayout from '@/components/MainLayout.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, CheckCircle, AlertCircle, Send, RefreshCw } from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext.jsx';

const DashboardPage = () => {
  const { currentUser } = useAuth();
  const [metrics, setMetrics] = useState({
    totalCreators: 0,
    completeCreators: 0,
    pendingCreators: 0,
    messagesSent: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMetrics = useCallback(async (isManualRefresh = false) => {
    if (!currentUser) return;
    
    if (isManualRefresh) {
      setRefreshing(true);
    }
    
    try {
      const [totalRes, completeRes, pendingRes, sentRes] = await Promise.all([
        pb.collection('creators').getList(1, 1, { filter: `user_id="${currentUser.id}"`, $autoCancel: false }),
        pb.collection('creators').getList(1, 1, { filter: `user_id="${currentUser.id}" && status="complete"`, $autoCancel: false }),
        pb.collection('creators').getList(1, 1, { filter: `user_id="${currentUser.id}" && (status="incomplete" || phone="" || phone=null)`, $autoCancel: false }),
        pb.collection('message_history').getList(1, 1, { filter: `user_id="${currentUser.id}" && status="success"`, $autoCancel: false })
      ]);
      
      setMetrics({
        totalCreators: totalRes.totalItems,
        completeCreators: completeRes.totalItems,
        pendingCreators: pendingRes.totalItems,
        messagesSent: sentRes.totalItems
      });
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const metricCards = [
    { title: 'Total de Criadores', value: metrics.totalCreators, icon: Users, iconColor: 'text-primary', bgColor: 'bg-primary/10' },
    { title: 'Cadastros Completos', value: metrics.completeCreators, icon: CheckCircle, iconColor: 'text-emerald-600', bgColor: 'bg-emerald-100' },
    { title: 'Pendências de Cadastro', value: metrics.pendingCreators, icon: AlertCircle, iconColor: 'text-amber-600', bgColor: 'bg-amber-100' },
    { title: 'Mensagens Enviadas', value: metrics.messagesSent, icon: Send, iconColor: 'text-secondary-foreground', bgColor: 'bg-secondary' }
  ];

  return (
    <>
      <Helmet>
        <title>Dashboard - TikTok Creator Manager</title>
      </Helmet>

      <MainLayout>
        <div className="space-y-6 pb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
              <p className="text-muted-foreground mt-2">Acompanhe o desempenho e status da sua base de criadores.</p>
            </div>
            <Button 
              onClick={() => fetchMetrics(true)} 
              disabled={refreshing || loading}
              variant="outline"
              className="w-full sm:w-auto transition-all duration-200 active:scale-95 bg-card"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-10 w-10 rounded-xl" />
                  </CardHeader>
                  <CardContent><Skeleton className="h-8 w-16" /></CardContent>
                </Card>
              ))
            ) : (
              metricCards.map((metric, index) => {
                const Icon = metric.icon;
                return (
                  <Card key={index} className="shadow-sm transition-all duration-300 hover:shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">{metric.title}</CardTitle>
                      <div className={`p-2 rounded-xl ${metric.bgColor}`}>
                        <Icon className={`h-5 w-5 ${metric.iconColor}`} />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-foreground tabular-nums">
                        {metric.value.toLocaleString('pt-BR')}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </MainLayout>
    </>
  );
};

export default DashboardPage;
