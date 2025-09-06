'use client';

import React, { useState, useEffect } from "react"; // 1. Added 'React' import
import { Settings, User, MessageSquare, Download, Upload, Save, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
// import { Separator } from "@/components/ui/separator";
// import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

// Define structures - repeated for component self-containment
interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  lastActive: string;
}

type ThemePreference = 'light' | 'dark' | 'system'; // 2. Created a specific type for theme

interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
  preferences: {
    theme: ThemePreference;
    notifications: boolean;
    autoSave: boolean;
    defaultModel: string;
  };
}

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chatSessions: ChatSession[];
  currentSessionId: string;
  userProfile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  onDeleteSession: (sessionId: string) => void;
  onExportSessions: () => void;
  onImportSessions: (file: File) => void;
  onClearAllHistory: () => void;
}

export function SettingsDialog({
  open,
  onOpenChange,
  chatSessions,
  userProfile,
  onUpdateProfile,
  onImportSessions,
  onExportSessions,
  onClearAllHistory
}: SettingsDialogProps) {
  const [profile, setProfile] = useState<UserProfile>(userProfile);

  // Sync state when dialog opens or userProfile prop changes
  useEffect(() => {
    setProfile(userProfile);
  }, [userProfile]);

  const handleProfileUpdate = () => {
    onUpdateProfile(profile);
    try {
      localStorage.setItem('qc_user', JSON.stringify(profile));
    } catch (e) {
      // ignore storage errors in strict environments
      console.warn('Could not persist qc_user to localStorage', e);
    }
    // close dialog on save for a clearer flow
    onOpenChange(false);
  };


  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImportSessions(file);
    }
  };

  const formatStorageSize = (sessions: ChatSession[]) => {
    try {
      const dataSize = JSON.stringify(sessions).length;
      const sizeInKB = (dataSize / 1024).toFixed(2);
      return `${sizeInKB} KB`;
    } catch (error) {
      console.error(error);
      return '0 KB';
    }
  };

  // 3. Extracted theme change handler for clarity and type safety
  const handleThemeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newTheme = event.target.value as ThemePreference;
    setProfile(p => ({
      ...p,
      preferences: { ...p.preferences, theme: newTheme }
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </DialogTitle>
          <DialogDescription>
            Manage your account and chat history preferences.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="account" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="account"><User className="w-4 h-4 mr-2" />Account</TabsTrigger>
            <TabsTrigger value="history"><MessageSquare className="w-4 h-4 mr-2" />Chat History</TabsTrigger>
          </TabsList>

          <TabsContent value="account" className="flex-1 mt-4 min-h-0">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>Update your personal information.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Display Name</Label>
                        <Input id="name" value={profile.name} onChange={(e) => setProfile(p => ({ ...p, name: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" type="email" value={profile.email} onChange={(e) => setProfile(p => ({ ...p, email: e.target.value }))} />
                      </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Preferences</CardTitle>
                    <CardDescription>Customize your experience.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="theme-select">Theme</Label> 
                      <select 
                        id="theme-select" 
                        aria-label="Theme Preference"
                        value={profile.preferences.theme} 
                        onChange={handleThemeChange} 
                        className="bg-transparent border rounded-md p-2"
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="system">System</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Notifications</Label>
                      <Switch checked={profile.preferences.notifications} onCheckedChange={(c) => setProfile(p => ({ ...p, preferences: { ...p.preferences, notifications: c } }))} />
                    </div>
                  </CardContent>
                </Card>
                <div className="flex justify-end">
                  <Button onClick={handleProfileUpdate}><Save className="w-4 h-4 mr-2" />Save Changes</Button>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="history" className="flex-1 mt-4 min-h-0">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Storage Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold">{chatSessions.length}</p>
                      <p className="text-sm text-muted-foreground">Sessions</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{chatSessions.reduce((acc, s) => acc + s.messages.length, 0)}</p>
                      <p className="text-sm text-muted-foreground">Messages</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{formatStorageSize(chatSessions)}</p>
                      <p className="text-sm text-muted-foreground">Used</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Backup & Restore</CardTitle>
                  </CardHeader>
                  <CardContent className="flex space-x-2">
                    <Button onClick={onExportSessions} variant="outline" className="flex-1">
                      <Download className="w-4 h-4 mr-2" /> Export
                    </Button>
                    <Button asChild variant="outline" className="flex-1">
                      <label htmlFor="import-file" className="cursor-pointer flex items-center justify-center w-full h-full">
                        <Upload className="w-4 h-4 mr-2" /> Import
                        <input type="file" id="import-file" className="sr-only" onChange={handleFileImport} accept=".json" />
                      </label>
                    </Button>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-destructive">Danger Zone</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="w-full">
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          Clear All Chat History
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete all your chat sessions.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={onClearAllHistory}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}