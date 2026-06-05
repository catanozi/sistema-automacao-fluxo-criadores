
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Helmet } from 'react-helmet';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [loading, setLoading] = useState(false);

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    passwordConfirm: '' 
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(loginData.email, loginData.password);
      toast.success('Login realizado com sucesso');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Falha no login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (registerData.password !== registerData.passwordConfirm) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (registerData.password.length < 8) {
      toast.error('A senha deve ter pelo menos 8 caracteres');
      return;
    }

    setLoading(true);

    try {
      await register(
        registerData.email, 
        registerData.password, 
        registerData.passwordConfirm,
        registerData.name
      );
      toast.success('Conta criada com sucesso. Faça login para continuar.');
      setRegisterData({ name: '', email: '', password: '', passwordConfirm: '' });
    } catch (error) {
      toast.error('Falha ao criar conta. Email pode já estar em uso.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Login - TikTok Creator Manager</title>
        <meta name="description" content="Faça login para gerenciar seus criadores do TikTok" />
      </Helmet>

      <div className="min-h-screen flex items-center justify-center p-4 bg-soft-gradient">
        <Card className="w-full max-w-md bg-card border-border shadow-lg rounded-2xl">
          <CardHeader className="space-y-2 pb-6">
            <CardTitle className="text-3xl font-bold text-center text-balance text-foreground">
              Creator Manager
            </CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              Gerencie seus criadores de forma simples e eficiente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-muted p-1 rounded-xl mb-6">
                <TabsTrigger value="login" className="rounded-lg">Login</TabsTrigger>
                <TabsTrigger value="register" className="rounded-lg">Registrar</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      required
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password">Senha</Label>
                      <a href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors">Esqueceu a senha?</a>
                    </div>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      required
                      className="bg-background"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full transition-all duration-200 active:scale-[0.98] rounded-xl h-11"
                    disabled={loading}
                  >
                    {loading ? 'Entrando...' : 'Entrar'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Nome</Label>
                    <Input
                      id="register-name"
                      type="text"
                      placeholder="Seu nome"
                      value={registerData.name}
                      onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                      required
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      required
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Senha</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="••••••••"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      required
                      minLength={8}
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password-confirm">Confirmar senha</Label>
                    <Input
                      id="register-password-confirm"
                      type="password"
                      placeholder="••••••••"
                      value={registerData.passwordConfirm}
                      onChange={(e) => setRegisterData({ ...registerData, passwordConfirm: e.target.value })}
                      required
                      minLength={8}
                      className="bg-background"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full transition-all duration-200 active:scale-[0.98] rounded-xl h-11"
                    disabled={loading}
                  >
                    {loading ? 'Criando conta...' : 'Criar conta'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default LoginPage;
