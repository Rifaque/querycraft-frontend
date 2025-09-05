'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Database, ArrowLeft } from "lucide-react";
// Note: We are using framer-motion instead of the base 'motion' package for better React integration.
import { motion, AnimatePresence } from "framer-motion";

interface AuthPageProps {
  onLogin: (email: string, password: string) => void;
  onSignUp: (name: string, email: string, password: string) => void;
  onBack: () => void;
}

export function AuthPage({ onLogin, onSignUp, onBack }: AuthPageProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Sign up form state
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(loginEmail, loginPassword);
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    onSignUp(signUpName, signUpEmail, signUpPassword);
  };

  const socialIcons = [
    { name: "Google", icon: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z", color: "hover:text-red-500" },
    { name: "Facebook", icon: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z", color: "hover:text-blue-600" },
    { name: "LinkedIn", icon: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z", color: "hover:text-blue-700" }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="w-full px-6 py-4 flex items-center justify-between backdrop-blur-sm bg-card/80 border-b border-border">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Database className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">QueryCraft</span>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="relative w-full max-w-5xl h-[600px] bg-card rounded-3xl shadow-2xl overflow-hidden border">
          <motion.div
            className="absolute inset-y-0 w-1/2 z-10 hidden md:block"
            animate={{ x: isSignUp ? "0%" : "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{ background: "hsl(var(--primary))" }}
          >
            <div className="h-full flex flex-col items-center justify-center p-12 text-primary-foreground text-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={isSignUp ? "signin" : "signup"}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  <h2 className="text-4xl font-bold mb-6">
                    {isSignUp ? "Welcome Back!" : "Hello, Friend!"}
                  </h2>
                  <p className="text-xl mb-10 opacity-90 leading-relaxed max-w-md">
                    {isSignUp ? "To keep connected with us please login with your personal info" : "Enter your personal details and start your journey with us"}
                  </p>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="bg-transparent border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary rounded-full px-10"
                  >
                    {isSignUp ? "Sign In" : "Sign Up"}
                  </Button>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Sign In Form */}
          <div className={`absolute inset-y-0 left-0 w-full md:w-1/2 flex flex-col justify-center p-6 md:p-12 transition-opacity duration-500 ${isSignUp ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
            <h2 className="text-4xl font-bold text-foreground mb-10 text-center">Sign In</h2>
            <div className="flex justify-center space-x-4 mb-8">
              {socialIcons.map(social => (
                <Button key={social.name} variant="outline" size="icon" className="rounded-full w-14 h-14">
                  <svg className={`w-6 h-6 text-muted-foreground ${social.color}`} viewBox="0 0 24 24" fill="currentColor">
                    <path d={social.icon} />
                  </svg>
                </Button>
              ))}
            </div>
            <p className="text-center text-muted-foreground mb-8">or use your email account</p>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input type="email" placeholder="Email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required />
              <Input type="password" placeholder="Password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required />
              <a href="#" className="block text-center text-sm text-primary hover:underline">Forgot Your Password?</a>
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full text-lg py-6">SIGN IN</Button>
            </form>
          </div>

          {/* Sign Up Form */}
          <div className={`absolute inset-y-0 right-0 w-full md:w-1/2 flex flex-col justify-center p-6 md:p-12 transition-opacity duration-500 ${!isSignUp ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
            <h2 className="text-4xl font-bold text-foreground mb-10 text-center">Create Account</h2>
            <div className="flex justify-center space-x-4 mb-8">
              {socialIcons.map(social => (
                <Button key={social.name} variant="outline" size="icon" className="rounded-full w-14 h-14">
                  <svg className={`w-6 h-6 text-muted-foreground ${social.color}`} viewBox="0 0 24 24" fill="currentColor">
                    <path d={social.icon} />
                  </svg>
                </Button>
              ))}
            </div>
            <p className="text-center text-muted-foreground mb-8">or use your email for registration</p>
            <form onSubmit={handleSignUp} className="space-y-4">
              <Input type="text" placeholder="Name" value={signUpName} onChange={e => setSignUpName(e.target.value)} required />
              <Input type="email" placeholder="Email" value={signUpEmail} onChange={e => setSignUpEmail(e.target.value)} required />
              <Input type="password" placeholder="Password" value={signUpPassword} onChange={e => setSignUpPassword(e.target.value)} required />
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full text-lg py-6">SIGN UP</Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

