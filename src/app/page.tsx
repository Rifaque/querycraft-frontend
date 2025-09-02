'use client';

import { useState, useEffect } from "react";
import { IntroPage } from "@/components/pages/IntroPage";
import { AuthPage } from "@/components/pages/AuthPage";
import { ChatApp } from "@/components/pages/ChatApp";
import { toast } from "sonner";
//import { toast } from "@/components/ui/sonner";

// Define the structure for the user's profile
interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
    autoSave: boolean;
    defaultModel: string;
  };
}

// Define the possible views the app can be in
type AppView = 'intro' | 'auth' | 'chat';

export default function Home() {
  // State to track if the user is logged in
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // State to control which page component is shown
  const [currentView, setCurrentView] = useState<AppView>('intro');
  
  // Mock user profile data, just like in the original file
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: "QueryCraft User",
    email: "user@querycraft.ai",
    avatar: "https://images.unsplash.com/photo-1615843423179-bea071facf96?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx8fDE3NTY3MDA4MjR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    preferences: {
      theme: 'system',
      notifications: true,
      autoSave: true,
      defaultModel: 'merlin'
    }
  });

  // Automatically switch to the chat view when the user logs in
  useEffect(() => {
    if (isAuthenticated) {
      setCurrentView('chat');
    } else {
      // When logging out, go back to the intro page
      setCurrentView('intro');
    }
  }, [isAuthenticated]);

  // --- Handlers to switch between views ---
  const handleShowAuth = () => setCurrentView('auth');
  const handleBackToIntro = () => setCurrentView('intro');

  // --- Mock Authentication Logic ---
  const handleLogin = (email: string, password: string) => {
    if (email && password) {
      setUserProfile(prev => ({ ...prev, email: email }));
      setIsAuthenticated(true);
      toast("Successfully logged in", {
        description: "Welcome back to QueryCraft!",
      });
    } else {
      toast.error("Login failed", {
        description: "Please check your email and password.",
      });
    }
  };

  const handleSignUp = (name: string, email: string, password: string) => {
    if (name && email && password) {
      setUserProfile(prev => ({ ...prev, name: name, email: email }));
      setIsAuthenticated(true);
      toast.success("Account created successfully", {
        description: "Welcome to QueryCraft!",
      });
    } else {
      toast.error("Sign up failed", {
        description: "Please fill in all required fields.",
      });
    }
  };
  
  const handleLogout = () => {
    setIsAuthenticated(false);
    toast("Successfully logged out");
  };

  // --- Profile Update Logic ---
  const handleUpdateProfile = (profile: UserProfile) => {
    setUserProfile(profile);
    toast.success("Profile updated successfully");
  };

  // --- Render Logic ---
  const renderCurrentView = () => {
    switch (currentView) {
      case 'intro':
        return <IntroPage onShowAuth={handleShowAuth} />;
      case 'auth':
        return <AuthPage onLogin={handleLogin} onSignUp={handleSignUp} onBack={handleBackToIntro} />;
      case 'chat':
        return <ChatApp userProfile={userProfile} onUpdateProfile={handleUpdateProfile} onLogout={handleLogout} />;
      default:
        return <IntroPage onShowAuth={handleShowAuth} />;
    }
  };

  return (
    <main>
      {renderCurrentView()}
    </main>
  );
}

