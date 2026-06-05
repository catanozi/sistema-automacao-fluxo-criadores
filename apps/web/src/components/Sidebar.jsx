
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Upload, 
  Users, 
  AlertCircle, 
  Send, 
  History, 
  Settings,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/import', label: 'Importar Planilha', icon: Upload },
    { path: '/creators', label: 'Criadores', icon: Users },
    { path: '/pendencies', label: 'Pendências', icon: AlertCircle },
    { path: '/send-messages', label: 'Envio de Mensagens', icon: Send },
    { path: '/message-history', label: 'Histórico', icon: History },
    { path: '/settings', label: 'Configurações', icon: Settings }
  ];

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-[#F0F5FB] border-r border-border transition-transform duration-300 lg:translate-x-0 lg:static",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-border lg:hidden">
          <h2 className="font-semibold text-foreground">Menu</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-muted-foreground hover:bg-white/50">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-primary/10 hover:text-foreground active:scale-95"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
