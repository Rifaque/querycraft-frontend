'use client';

import React, { useState, useEffect } from "react";
import { Settings, User, MessageSquare, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";

import styles from "./SettingsDialog.module.css";

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

type ThemePreference = 'light' | 'dark' | 'system';

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
  onDeleteSession: (sessionId: string) => void;
  onClearAllHistory: () => void;
}

export function SettingsDialog({
  open,
  onOpenChange,
  chatSessions,
  userProfile,
  onClearAllHistory
}: SettingsDialogProps) {
  const [profile, setProfile] = useState<UserProfile>(userProfile);
  const user = typeof window !== 'undefined' ? localStorage.getItem("qc_user") : null;

  useEffect(() => {
    setProfile(userProfile);
  }, [userProfile]);

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

  const handleThemeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newTheme = event.target.value as ThemePreference;
    setProfile(p => ({
      ...p,
      preferences: { ...p.preferences, theme: newTheme }
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={styles.dialogContent}>
        <DialogHeader>
          <DialogTitle className={styles.titleRow}>
            <Settings className={styles.icon} />
            <span>Settings</span>
          </DialogTitle>
          <DialogDescription className={styles.description}>
            Manage your account and chat history preferences.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="account" className={styles.tabsRoot}>
          <TabsList className={styles.tabsList}>
            <TabsTrigger value="account" className={styles.tabTrigger}><User className={styles.tabIcon} />Account</TabsTrigger>
            <TabsTrigger value="history" className={styles.tabTrigger}><MessageSquare className={styles.tabIcon} />Chat History</TabsTrigger>
          </TabsList>

          <TabsContent value="account" className={styles.tabsContent}>
            <ScrollArea className={styles.scroll}>
              <div className={styles.stack}>
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                  </CardHeader>
                  <CardContent className={styles.cardContent}>
                    <div className={styles.formGroup}>
                      <Label htmlFor="name">Display Name</Label>
                      <Input
                        id="name"
                        value={user ? JSON.parse(user).name : profile.name}
                        onChange={(e) => setProfile(p => ({ ...p, name: e.target.value }))}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={user ? JSON.parse(user).email : profile.email}
                        onChange={(e) => setProfile(p => ({ ...p, email: e.target.value }))}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Preferences</CardTitle>
                    <CardDescription>Customize your experience.</CardDescription>
                  </CardHeader>
                  <CardContent className={styles.cardContent}>
                    <div className={styles.rowBetween}>
                      <Label htmlFor="theme-select">Theme</Label>
                      <select
                        id="theme-select"
                        aria-label="Theme Preference"
                        value={profile.preferences.theme}
                        onChange={handleThemeChange}
                        className={styles.select}
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="system">System</option>
                      </select>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="history" className={styles.tabsContent}>
            <ScrollArea className={styles.scroll}>
              <div className={styles.stack}>
                <Card>
                  <CardHeader>
                    <CardTitle>Storage Overview</CardTitle>
                  </CardHeader>
                  <CardContent className={styles.storageGrid}>
                    <div className={styles.stat}>
                      <p className={styles.statValue}>{chatSessions.length}</p>
                      <p className={styles.statLabel}>Sessions</p>
                    </div>
                    <div className={styles.stat}>
                      <p className={styles.statValue}>{chatSessions.reduce((acc, s) => acc + s.messages.length, 0)}</p>
                      <p className={styles.statLabel}>Messages</p>
                    </div>
                    <div className={styles.stat}>
                      <p className={styles.statValue}>{formatStorageSize(chatSessions)}</p>
                      <p className={styles.statLabel}>Used</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className={styles.dangerTitle}>Danger Zone</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className={styles.fullWidthBtn}>
                          <AlertTriangle className={styles.alertIcon} />
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
