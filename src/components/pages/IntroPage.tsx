"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Database,
  MessageSquare,
  Zap,
  Shield,
  ArrowRight,
  Sparkles,
  Github,
  Play,
  Star,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Canvas } from "@react-three/fiber";
import type { GLTF } from "three-stdlib";
import { Float, ContactShadows, useGLTF } from "@react-three/drei";

import styles from "./IntroPageV2.module.css";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";

// ------------------------ Utilities ---------------------------------
function useTypingStream(text: string, ms = 30) {
  const [output, setOutput] = useState("");
  useEffect(() => {
    let i = 0;
    let stopped = false;
    setOutput("");
    const t = setInterval(() => {
      if (stopped) return;
      i++;
      setOutput(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(t);
      }
    }, ms);
    return () => {
      stopped = true;
      clearInterval(t);
    };
  }, [text, ms]);
  return output;
}

// ------------------------ Particles Canvas -----------------------------
function ParticlesBackground() {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    let dpr = Math.max(1, window.devicePixelRatio || 1);
    let w = (canvas.width = canvas.offsetWidth * dpr);
    let h = (canvas.height = canvas.offsetHeight * dpr);
    const particles = Array.from({ length: 30 }).map(() => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 0.6 + Math.random() * 2.6,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
    }));
    let raf = 0;
    function resize() {
      dpr = Math.max(1, window.devicePixelRatio || 1);
      w = canvas.width = canvas.offsetWidth * dpr;
      h = canvas.height = canvas.offsetHeight * dpr;
    }
    function tick() {
      ctx.clearRect(0, 0, w, h);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20;
        if (p.y > h + 20) p.y = -20;
        ctx.beginPath();
        ctx.globalAlpha = 0.08;
        ctx.fillStyle = "#ffffff";
        ctx.arc(p.x, p.y, p.r * dpr, 0, Math.PI * 2);
        ctx.fill();
      });
      raf = requestAnimationFrame(tick);
    }
    window.addEventListener("resize", resize);
    tick();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);
  return <canvas ref={ref} className={styles.particlesCanvas} />;
}

// ------------------------ 3D Model & fallback --------------------------
function QueryCraftModel({ modelUrl }: { modelUrl?: string }) {
  try {
    const gltf = useGLTF(modelUrl || "/models/querycraft.glb") as GLTF;
    return <primitive object={gltf.scene} dispose={null} />;
  } catch {
    return (
      <group rotation={[0.4, 0.8, 0.1]}>
        <Float speed={1.1} floatIntensity={1.2} rotationIntensity={0.6}>
          <mesh position={[0, 0.35, 0]}>
            <torusGeometry args={[1.2, 0.22, 64, 128]} />
            <meshStandardMaterial roughness={0.12} metalness={0.9} emissive={[0.01, 0.02, 0.04]} />
          </mesh>
        </Float>
        <Float speed={0.9} floatIntensity={1.6} rotationIntensity={0.4}>
          <mesh position={[2.1, 0.5, -0.6]} scale={[0.82, 0.82, 0.82]}>
            <boxGeometry args={[0.9, 0.9, 0.9]} />
            <meshStandardMaterial roughness={0.25} metalness={0.85} />
          </mesh>
        </Float>
        <Float speed={1.4} floatIntensity={0.9} rotationIntensity={0.5}>
          <mesh position={[-2.2, -0.7, -0.8]} scale={[0.6, 0.6, 0.6]}>
            <icosahedronGeometry args={[0.74, 0]} />
            <meshStandardMaterial roughness={0.15} metalness={0.9} />
          </mesh>
        </Float>
      </group>
    );
  }
}

function Hero3D({ modelUrl }: { modelUrl?: string }) {
  return (
    <div className={styles.hero3dWrapper}>
      <Canvas camera={{ position: [0, 0, 8], fov: 42 }}>
        <ambientLight intensity={0.6} />
        <directionalLight intensity={0.95} position={[5, 6, 5]} />
        <directionalLight intensity={0.2} position={[-5, -5, -2]} />
        <Suspense fallback={null}>
          <QueryCraftModel modelUrl={modelUrl || "/models/querycraft.glb"} />
          <ContactShadows position={[0, -1.7, 0]} opacity={0.45} blur={2.6} />
        </Suspense>
      </Canvas>
    </div>
  );
}

// -------------------------- Feature Card --------------------------------
function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <motion.div whileHover={{ scale: 1.03, y: -6 }} className={styles.featureCard}>
      <div className={styles.featureIcon}>{icon}</div>
      <h4 className={styles.featureTitle}>{title}</h4>
      <p className={styles.featureDesc}>{desc}</p>
    </motion.div>
  );
}

// -------------------------- Main Page ----------------------------------
export default function IntroPageV2({ onShowAuth }: { onShowAuth?: () => void }) {
  const features = [
    { icon: <Database className={styles.iconSize} />, title: "Smart DB queries", description: "Precise, optimized SQL with safety checks." },
    { icon: <MessageSquare className={styles.iconSize} />, title: "Conversational UI", description: "Save chats, share workspaces, and collaborate." },
    { icon: <Zap className={styles.iconSize} />, title: "Real-time previews", description: "Streaming SQL previews for faster iteration." },
    { icon: <Shield className={styles.iconSize} />, title: "Enterprise-ready", description: "Audit logs, RBAC and row-level security." },
  ];

  const [queryInput, setQueryInput] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const typed = useTypingStream(result || "", 18);
  const inFlightRef = useRef(false);

  async function runDemo() {
    if (!queryInput.trim()) return;
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setIsTyping(true);
    setResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/query/demo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: queryInput,
          model: "llama3.2:1b",
        }),
      });
      const data = await res.json();

      let output = data.response || "-- no output --";
      output = String(output).trim();

      try {
        const parsed = JSON.parse(output);
        if (parsed && parsed.query) output = parsed.query;
      } catch {}

      const fence = output.match(/```(?:sql|mongodb|query)?\n([\s\S]*?)\n```/i);
      if (fence) output = fence[1].trim();
      else {
        const sqlMatch = output.match(/((?:SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|WITH)[\s\S]{0,2000}?;)/i);
        if (sqlMatch) output = sqlMatch[1].trim();
      }

      setResult(output);
    } catch (err) {
      setResult("-- error running demo --");
    } finally {
      setIsTyping(false);
      inFlightRef.current = false;
    }
  }

  return (
    <div className={styles.pageRoot}>
      <div className={styles.absoluteBackdrop}><ParticlesBackground /></div>
      <div className={styles.gradientBlob} />

      <nav className={styles.stickyNav}>
        <div className={styles.brandRow}>
          <div className={styles.brandIcon}><Database className={styles.dbIcon} /></div>
          <div className={styles.brandText}>
            <div className={styles.brandTitle}>QueryCraft</div>
            <div className={styles.brandSubtitle}>AI DB assistant</div>
          </div>
        </div>

        <div className={styles.navActions}>
          <Button variant="ghost" onClick={() => onShowAuth?.()} className={styles.signInBtn}>Sign in</Button>
          <Button onClick={() => onShowAuth?.()} className={styles.getStartedBtn}>Get started <ArrowRight className={styles.arrowIcon} /></Button>
        </div>
      </nav>

      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.leftCol}>
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
              <div className={styles.pill}><Sparkles className={styles.sparkIcon} /><span>AI · SQL · Instant Insights</span></div>

              <h1 className={styles.heroTitle}>
                Data that speaks your language — <br />
                <span className={styles.gradientText}>conversational analytics</span>
              </h1>

              <p className={styles.heroSubtitle}>QueryCraft turns plain English into safe, optimized SQL with real-time previews, collaboration, and enterprise controls. Designed to make analysts faster and happier.</p>

              <div className={styles.heroActions}>
                <Button size="lg" onClick={() => onShowAuth?.()} className={styles.primaryAction}>Start chatting <ArrowRight className={styles.arrowIcon} /></Button>
                <Button variant="outline" size="lg" onClick={runDemo} disabled={isTyping} aria-busy={isTyping} className={styles.demoAction}>Live demo <Play className={styles.playIcon} /></Button>
                <a className={styles.githubLink} href="https://github.com/Rifaque/querycraft-frontend" target="_blank" rel="noopener noreferrer"><Github className={styles.githubIcon} />Star on GitHub</a>
              </div>

              <div className={styles.demoBox}>
                <label className={styles.inputLabel}>Try NL → SQL</label>
                <div className={styles.inputRow}>
                  <input
                    value={queryInput}
                    onChange={(e) => setQueryInput(e.target.value)}
                    placeholder="e.g. monthly revenue by region"
                    className={styles.input}
                  />
                  <Button onClick={runDemo} disabled={isTyping} aria-busy={isTyping} className={styles.runBtn}>Run</Button>
                </div>

                <div className={styles.resultArea}>
                  <AnimatePresence>
                    {isTyping && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={styles.generating}>Generating SQL...</motion.div>}
                    {result && <motion.pre initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={styles.resultPre}>{typed}</motion.pre>}
                  </AnimatePresence>
                </div>
              </div>

              <div className={styles.targetsGrid}>
                <div className={styles.targetCard}>
                  <svg className={styles.targetSvg} viewBox="0 0 36 36">
                    <path stroke="currentColor" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" strokeDasharray="65,100" className={styles.targetDash} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  </svg>
                  <div className={styles.targetValue}>99ms</div>
                  <div className={styles.targetLabel}>avg response</div>
                </div>

                <div className={styles.targetCard}>
                  <svg className={styles.targetSvg} viewBox="0 0 36 36">
                    <path stroke="currentColor" strokeWidth="3" fill="none" d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"/>
                    <path stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" strokeDasharray="75,100" className={styles.targetDashGreen} d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"/>
                  </svg>
                  <div className={styles.targetValue}>1k+</div>
                  <div className={styles.targetLabel}>queries / day</div>
                </div>

                <div className={styles.targetCard}>
                  <svg className={styles.targetSvg} viewBox="0 0 36 36">
                    <path stroke="currentColor" strokeWidth="3" fill="none" d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"/>
                    <path stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" strokeDasharray="90,100" className={styles.targetDashAmber} d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"/>
                  </svg>
                  <div className={styles.targetValue}>Enterprise</div>
                  <div className={styles.targetLabel}>grade security</div>
                </div>
              </div>
            </motion.div>
          </div>

          <div className={styles.rightCol}>
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
              <Hero3D />
            </motion.div>

            <motion.div className={styles.featuresGrid} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
              {features.map((f) => <FeatureCard key={f.title} icon={f.icon} title={f.title} desc={f.description} />)}
            </motion.div>
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <div className={styles.footerIcon}><Database className={styles.dbIconSmall} /></div>
            <div>
              <div className={styles.footerTitle}>QueryCraft</div>
              <div className={styles.footerSub}>© 2025 QueryCraft</div>
            </div>
          </div>
          <div className={styles.footerNote}>Built by <a href="https://hubzero.in/" className={styles.link} target="_blank" rel="noopener noreferrer">Hub Zero</a> · Designed for devs & analysts</div>
        </div>
      </footer>
    </div>
  );
}

// named export for compatibility with imports that expect `IntroPage`
export const IntroPage = IntroPageV2;
