
import React from 'react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, Menu } from 'lucide-react';
import pb from '@/lib/pocketbaseClient';

const Header = ({ onMenuClick }) => {
  const { currentUser, logout } = useAuth();

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const avatarUrl = currentUser?.avatar 
    ? pb.files.getUrl(currentUser, currentUser.avatar)
    : null;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-soft-gradient">
      <div className="flex h-16 items-center gap-4 px-4 lg:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-foreground hover:bg-white/50"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">TikTok Creator Manager</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3">
            <Avatar className="h-9 w-9 rounded-xl border border-white/50 shadow-sm">
              <AvatarImage src={avatarUrl} alt={currentUser?.name} />
              <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-semibold">
                {getInitials(currentUser?.name)}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block text-foreground">
              <p className="text-sm font-medium leading-none">{currentUser?.name || 'Usuário'}</p>
              <p className="text-xs text-muted-foreground mt-1">{currentUser?.email}</p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            className="text-muted-foreground hover:bg-white/50 hover:text-foreground transition-all duration-200 active:scale-95"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
