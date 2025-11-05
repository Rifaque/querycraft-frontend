"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Database, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./AuthPage.module.css";

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

  const extractErrorMessage = (err: unknown, fallback = "Network error") => {
    if (err instanceof Error && err.message) return err.message;
    if (typeof err === "string" && err) return err;
    try {
      return JSON.stringify(err) || fallback;
    } catch {
      return fallback;
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await onLogin(loginEmail, loginPassword);
    } catch (err: unknown) {
      setError(extractErrorMessage(err, "Login failed"));
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await onSignUp(signUpName, signUpEmail, signUpPassword);
    } catch (err: unknown) {
      setError(extractErrorMessage(err, "Signup failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageRoot}>
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <Button variant="ghost" size="sm" onClick={onBack} disabled={loading} className={styles.backBtn}>
            <ArrowLeft className={styles.iconSmall} /> Back
          </Button>

          <div className={styles.brand}>
            <div className={styles.brandIcon}>
              <Database className={styles.dbIcon} />
            </div>
            <span className={styles.brandTitle}>QueryCraft</span>
          </div>
        </div>
      </nav>

      <main className={styles.main}>
        <div className={styles.card}>
          {/* Colored overlapping panels (kept inline styles & motion logic) */}
          <motion.div
            className={`${styles.panel} ${styles.panelTop} ${styles.hiddenMd}`}
            initial={{ x: "100%" }}
            animate={{ x: isSignUp ? "0%" : "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{
              background: "linear-gradient(135deg, #512DA8 0%, #673AB7 50%, #7E57C2 100%)",
              clipPath: isSignUp
                ? "polygon(25% 0%, 100% 0%, 100% 100%, 0% 100%)"
                : "polygon(0% 0%, 75% 0%, 100% 100%, 0% 100%)",
            }}
          />

          <motion.div
            className={`${styles.panel} ${styles.panel2} ${styles.hiddenMd}`}
            initial={{ x: "100%" }}
            animate={{ x: isSignUp ? "0%" : "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.1 }}
            style={{
              background: "linear-gradient(135deg, #0891B2 0%, #0284C7 50%, #0EA5E9 100%)",
              clipPath: isSignUp
                ? "polygon(30% 0%, 100% 0%, 100% 100%, 5% 100%)"
                : "polygon(5% 0%, 70% 0%, 95% 100%, 0% 100%)",
            }}
          />

          <motion.div
            className={`${styles.panel} ${styles.panel3} ${styles.hiddenMd}`}
            initial={{ x: "100%" }}
            animate={{ x: isSignUp ? "0%" : "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.2 }}
            style={{
              background: "linear-gradient(135deg, #059669 0%, #0D9488 50%, #10B981 100%)",
              clipPath: isSignUp
                ? "polygon(35% 0%, 100% 0%, 100% 100%, 10% 100%)"
                : "polygon(10% 0%, 65% 0%, 90% 100%, 0% 100%)",
            }}
          />

          <motion.div
            className={`${styles.panel} ${styles.panel4} ${styles.hiddenMd}`}
            initial={{ x: "100%" }}
            animate={{ x: isSignUp ? "0%" : "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.3 }}
            style={{
              background: "linear-gradient(135deg, #DC2626 0%, #EA580C 50%, #F59E0B 100%)",
              clipPath: isSignUp
                ? "polygon(40% 0%, 100% 0%, 100% 100%, 15% 100%)"
                : "polygon(15% 0%, 60% 0%, 85% 100%, 0% 100%)",
            }}
          />

          {/* Text content layer */}
          <div className={`${styles.sideText} ${styles.hiddenMd}`}>
            <motion.div
              className={styles.sideTextInner}
              initial={{ x: "100%" }}
              animate={{ x: isSignUp ? "0%" : "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={isSignUp ? "signin" : "signup"}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  <h2 className={styles.sideHeading}>{isSignUp ? "Welcome Back!" : "Hello, Friend!"}</h2>
                  <p className={styles.sideLead}>
                    {isSignUp
                      ? "To keep connected with us please login with your personal info"
                      : "Enter your personal details and start your journey with us"}
                  </p>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className={styles.toggleBtn}
                    disabled={loading}
                  >
                    {isSignUp ? "Sign In" : "Sign Up"}
                  </Button>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Sign In */}
          <div
            className={`${styles.formPanel} ${isSignUp ? styles.hidden : styles.visible}`}
            aria-hidden={isSignUp}
          >
            <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: isSignUp ? 0 : 1, x: isSignUp ? -50 : 0 }} transition={{ delay: isSignUp ? 0.2 : 0.3 }}>
              <h2 className={styles.formTitle}>Sign In</h2>

              {error && <div className={styles.errorBox}>{error}</div>}

              <form onSubmit={handleLogin} className={styles.formStack}>
                <Input
                  type="email"
                  placeholder="Email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className={styles.input}
                  required
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className={styles.input}
                  required
                />

                <div className={styles.forgotWrap}>
                  <a href="#" className={styles.forgotLink}>Forgot Your Password?</a>
                </div>

                <Button
                  type="submit"
                  className={styles.primaryBtn}
                  disabled={loading}
                >
                  {loading ? "Signing in..." : "SIGN IN"}
                </Button>
              </form>
            </motion.div>
          </div>

          {/* Sign Up */}
          <div
            className={`${styles.formPanel} ${!isSignUp ? styles.hidden : styles.visible} ${styles.rightSide}`}
            aria-hidden={!isSignUp}
          >
            <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: isSignUp ? 1 : 0, x: isSignUp ? 0 : 50 }} transition={{ delay: isSignUp ? 0.3 : 0 }}>
              <h2 className={styles.formTitle}>Create Account</h2>

              {error && <div className={styles.errorBox}>{error}</div>}

              <form onSubmit={handleSignUp} className={styles.formStack}>
                <Input
                  type="text"
                  placeholder="Name"
                  value={signUpName}
                  onChange={(e) => setSignUpName(e.target.value)}
                  className={styles.input}
                  required
                />
                <Input
                  type="email"
                  placeholder="Email"
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                  className={styles.input}
                  required
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                  className={styles.input}
                  required
                />

                <Button type="submit" className={styles.primaryBtn} disabled={loading}>
                  {loading ? "Creating account..." : "SIGN UP"}
                </Button>
              </form>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
