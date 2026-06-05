
import React, { createContext, useContext, useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    if (pb.authStore.isValid) {
      console.log('AuthContext loaded. Current User:', pb.authStore.model);
      setCurrentUser(pb.authStore.model);
    } else {
      console.log('AuthContext loaded. No active session.');
    }
    setInitialLoading(false);
  }, []);

  const login = async (email, password) => {
    console.log('Attempting login for:', email);
    const authData = await pb.collection('users').authWithPassword(email, password, { $autoCancel: false });
    console.log('Login successful:', authData.record);
    setCurrentUser(authData.record);
    return authData;
  };

  const logout = () => {
    console.log('Logging out user:', currentUser?.id);
    pb.authStore.clear();
    setCurrentUser(null);
  };

  const register = async (email, password, passwordConfirm, name) => {
    console.log('Attempting registration for:', email);
    const userId = crypto.randomUUID();
    const record = await pb.collection('users').create({
      email,
      password,
      passwordConfirm,
      name,
      user_id: userId
    }, { $autoCancel: false });
    console.log('Registration successful:', record);
    return record;
  };

  const value = {
    currentUser,
    login,
    logout,
    register,
    signup: register, // Alias just in case
    isAuthenticated: !!currentUser,
    initialLoading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
