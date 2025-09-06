"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Database, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AuthPageProps {
  onBack: () => void;
  onLogin: (email: string, password: string) => Promise<void>;
  onSignUp: (name: string, email: string, password: string) => Promise<void>;
}

export function AuthPage({ onBack, onLogin, onSignUp }: AuthPageProps) {
  const [isSignUp, setIsSignUp] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Sign up form state
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // call the handler provided by parent (Home)
      await onLogin(loginEmail, loginPassword);
      // parent is responsible for navigation/toasts/persistence
    } catch (err: any) {
      setError(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // call the handler provided by parent (Home)
      await onSignUp(signUpName, signUpEmail, signUpPassword);
      // parent is responsible for navigation/toasts/persistence
    } catch (err: any) {
      setError(err?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="w-full px-6 py-4 flex items-center justify-between backdrop-blur-sm bg-card/80 border-b border-border">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            disabled={loading}
          >
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
          {/* Sliding panel */}
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
                    {isSignUp
                      ? "To keep connected with us please login with your personal info"
                      : "Enter your personal details and start your journey with us"}
                  </p>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="bg-transparent border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary rounded-full px-10"
                    disabled={loading}
                  >
                    {isSignUp ? "Sign In" : "Sign Up"}
                  </Button>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Sign In */}
          <div
            className={`absolute inset-y-0 left-0 w-full md:w-1/2 flex flex-col justify-center p-6 md:p-12 transition-opacity duration-500 ${
              isSignUp ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
          >
            <h2 className="text-4xl font-bold text-foreground mb-10 text-center">
              Sign In
            </h2>
            {error && (
              <div className="mb-4 px-4 py-2 bg-red-600/10 border border-red-600 text-red-700 rounded">
                {error}
              </div>
            )}
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                type="email"
                placeholder="Email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="Password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
              <a
                href="#"
                className="block text-center text-sm text-primary hover:underline"
              >
                Forgot Your Password?
              </a>
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full text-lg py-6"
                disabled={loading}
              >
                {loading ? "Signing in..." : "SIGN IN"}
              </Button>
            </form>
          </div>

          {/* Sign Up */}
          <div
            className={`absolute inset-y-0 right-0 w-full md:w-1/2 flex flex-col justify-center p-6 md:p-12 transition-opacity duration-500 ${
              !isSignUp ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
          >
            <h2 className="text-4xl font-bold text-foreground mb-10 text-center">
              Create Account
            </h2>
            {error && (
              <div className="mb-4 px-4 py-2 bg-red-600/10 border border-red-600 text-red-700 rounded">
                {error}
              </div>
            )}
            <form onSubmit={handleSignUp} className="space-y-4">
              <Input
                type="text"
                placeholder="Name"
                value={signUpName}
                onChange={(e) => setSignUpName(e.target.value)}
                required
              />
              <Input
                type="email"
                placeholder="Email"
                value={signUpEmail}
                onChange={(e) => setSignUpEmail(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="Password"
                value={signUpPassword}
                onChange={(e) => setSignUpPassword(e.target.value)}
                required
              />
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full text-lg py-6"
                disabled={loading}
              >
                {loading ? "Creating account..." : "SIGN UP"}
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
