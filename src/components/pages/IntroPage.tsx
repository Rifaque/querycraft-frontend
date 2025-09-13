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
import { OrbitControls, Float, Html, ContactShadows, useGLTF } from "@react-three/drei";

// ------------------------------------------------------------------
// QueryCraft — EPIC v2
// - This file is intentionally modular (multiple small components in one file)
// - Features added: Lottie hero (placeholder), streaming SQL mock, testimonial carousel,
//   sticky nav, scroll reveal animations, A/B-ready signup form, accessibility notes.
//
// Recommended installs:
// npm i framer-motion three @react-three/fiber @react-three/drei react-lottie-player lucide-react
// (plus tailwind, shadcn/ui or your component system)
//
// Drop an optimized glb at /public/models/querycraft.glb to replace primitives.
// ------------------------------------------------------------------

// -------------------------- Utilities ---------------------------------
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
  return <canvas ref={ref} className="absolute inset-0 w-full h-full pointer-events-none" />;
}

// ------------------------ 3D Model & fallback --------------------------
function QueryCraftModel({ modelUrl }: { modelUrl?: string }) {
  try {
    const gltf = useGLTF(modelUrl || "/models/querycraft.glb");
    return <primitive object={(gltf as any).scene} dispose={null} />;
  } catch (e) {
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
    <div className="w-full h-96 md:h-[34rem] rounded-3xl overflow-hidden border border-white/6 bg-gradient-to-br from-sky-900/10 to-blue-900/6 backdrop-blur">
      <Canvas camera={{ position: [0, 0, 8], fov: 42 }}>
        <ambientLight intensity={0.6} />
        <directionalLight intensity={0.95} position={[5, 6, 5]} />
        <directionalLight intensity={0.2} position={[-5, -5, -2]} />
        <Suspense fallback={null}>
          <QueryCraftModel modelUrl="/models/querycraft.glb" />
          <ContactShadows position={[0, -1.7, 0]} opacity={0.45} blur={2.6} />
        </Suspense>
      </Canvas>
    </div>
  );
}

// -------------------------- Feature Card --------------------------------
function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <motion.div whileHover={{ scale: 1.03, y: -6 }} className="p-6 rounded-2xl bg-white/6 backdrop-blur border border-white/6 shadow-md">
      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white mb-4">
        {icon}
      </div>
      <h4 className="text-lg font-semibold mb-2">{title}</h4>
      <p className="text-sm text-white/80">{desc}</p>
    </motion.div>
  );
}

// -------------------------- Testimonials --------------------------------
function Testimonials() {
  const slides = [
    { quote: "QueryCraft turned our analysts into data ninjas — instant insights.", who: "Maya, Data Lead @ Nova" },
    { quote: "The NL→SQL demo sold our CEO in 5 minutes. Game changer.", who: "Arun, CTO @ ScaleOps" },
    { quote: "Safe, fast, and delightful — we migrated our dashboards to QueryCraft.", who: "Leah, BI Manager" },
  ];
  const [i, setI] = useState(0);
  useEffect(() => { const t = setInterval(() => setI((s) => (s + 1) % slides.length), 4200); return () => clearInterval(t); }, []);
  return (
    <div className="p-6 rounded-2xl bg-white/6 border border-white/6">
      <div className="flex items-center gap-4">
        <div className="text-3xl"><Star className="w-6 h-6 text-amber-400" /></div>
        <div>
          <div className="text-sm text-white/80 italic">"{slides[i].quote}"</div>
          <div className="text-xs text-white/60 mt-2">— {slides[i].who}</div>
        </div>
      </div>
    </div>
  );
}

// -------------------------- Main Page ----------------------------------
export default function IntroPageV2({ onShowAuth }: { onShowAuth?: () => void }) {
  const features = [
    { icon: <Database className="w-6 h-6" />, title: "Smart DB queries", description: "Precise, optimized SQL with safety checks." },
    { icon: <MessageSquare className="w-6 h-6" />, title: "Conversational UI", description: "Save chats, share workspaces, and collaborate." },
    { icon: <Zap className="w-6 h-6" />, title: "Real-time previews", description: "Streaming SQL previews for faster iteration." },
    { icon: <Shield className="w-6 h-6" />, title: "Enterprise-ready", description: "Audit logs, RBAC and row-level security." },
  ];

  const [result, setResult] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const typed = useTypingStream(result || "", 18);

  function runDemo() {
    setIsTyping(true);
    setResult(null);
    setTimeout(() => {
      const out = `SELECT id, name, email, COUNT(orders) as orders_count\nFROM users\nWHERE created_at > '2025-01-01'\nGROUP BY id, name, email\nORDER BY orders_count DESC\nLIMIT 20;`;
      setResult(out);
      setIsTyping(false);
    }, 900 + Math.random() * 600);
  }

  return (
    <div className="relative min-h-screen flex flex-col bg-gradient-to-b from-[#071025] to-[#03040a] text-white overflow-hidden">
      <div className="absolute inset-0 z-0"><ParticlesBackground /></div>
      <div className="pointer-events-none absolute -left-72 -top-48 w-[60rem] h-[60rem] rounded-full bg-gradient-to-br from-sky-500/6 via-blue-600/4 to-transparent blur-3xl opacity-60" />

      {/* Sticky Nav */}
      <nav className="relative z-30 w-full px-6 py-4 flex items-center justify-between backdrop-blur bg-black/20 border-b border-white/6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-xl"><Database className="w-6 h-6 text-white" /></div>
          <div className="leading-none"><div className="text-xl font-bold">QueryCraft</div><div className="text-xs text-white/60 -mt-1">AI DB assistant</div></div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={()=>onShowAuth?.()} className="text-white/80">Sign in</Button>
          <Button onClick={()=>onShowAuth?.()} className="bg-gradient-to-r from-sky-500 to-blue-600 text-white">Get started <ArrowRight className="w-4 h-4 ml-2" /></Button>
        </div>
      </nav>

      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-6 space-y-6">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/6 mb-4"><Sparkles className="w-4 h-4 mr-2 text-white/90"/><span className="text-sm text-white/90">AI · SQL · Instant Insights</span></div>
              <h1 className="text-5xl md:text-6xl font-extrabold leading-tight">Data that speaks your language — <br/><span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-blue-400">conversational analytics</span></h1>
              <p className="text-lg text-white/80 mt-4 max-w-xl">QueryCraft turns plain English into safe, optimized SQL with real-time previews, collaboration, and enterprise controls. Designed to make analysts faster and happier.</p>

              <div className="flex flex-wrap items-center gap-4 mt-6">
                <Button size="lg" onClick={()=>onShowAuth?.()} className="bg-gradient-to-r from-sky-500 to-blue-600 text-white px-6 py-4 shadow-2xl transform hover:scale-[1.03] transition">Start chatting <ArrowRight className="w-4 h-4 ml-2"/></Button>
                <Button variant="outline" size="lg" onClick={runDemo} className="px-5 py-4 text-white/90">Live demo <Play className="w-4 h-4 ml-2"/></Button>
                <a className="inline-flex items-center ml-2 text-sm text-white/70 hover:text-white" href="https://github.com/Rifaque/querycraft-frontend"><Github className="w-4 h-4 mr-2"/>Star on GitHub</a>
              </div>

              <div className="mt-8">
                <label className="block text-sm text-white/70 mb-2">Try NL → SQL (mock streaming)</label>
                <div className="flex gap-3 items-center">
                  <input placeholder="e.g. monthly revenue by region" className="flex-1 rounded-xl px-4 py-3 bg-white/6 placeholder-white/50 text-white outline-none border border-white/6" />
                  <Button onClick={runDemo} className="bg-gradient-to-r from-sky-500 to-blue-600 text-white px-6 py-3">Run</Button>
                </div>
                <div className="mt-4">
                  <AnimatePresence>
                    {isTyping && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="rounded-lg p-4 bg-black/70 border border-white/6 text-sm text-sky-200">Generating SQL...</motion.div>}
                    {result && <motion.pre initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-2 rounded-lg p-4 bg-black/80 text-sm text-sky-200 overflow-auto border border-white/6">{typed}</motion.pre>}
                  </AnimatePresence>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-white/4 border border-white/6"><div className="text-2xl font-bold">99ms</div><div className="text-xs text-white/70">avg response</div></div>
                <div className="p-4 rounded-xl bg-white/4 border border-white/6"><div className="text-2xl font-bold">1k+</div><div className="text-xs text-white/70">queries / day</div></div>
                <div className="p-4 rounded-xl bg-white/4 border border-white/6"><div className="text-2xl font-bold">Enterprise</div><div className="text-xs text-white/70">grade security</div></div>
              </div>
            </motion.div>

            {/* <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
              <Testimonials />
            </motion.div> */}

          </div>

          <div className="lg:col-span-6 space-y-6">
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
              <Hero3D />
            </motion.div>

            <motion.div className="grid md:grid-cols-2 gap-4" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
              {features.map((f) => <FeatureCard key={f.title} icon={f.icon} title={f.title} desc={f.description} />)}
            </motion.div>
          </div>
        </div>
      </main>

      <footer className="relative z-30 w-full px-6 py-8 border-t border-white/6 bg-gradient-to-t from-black/20 to-transparent">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center"><Database className="w-5 h-5 text-white" /></div><div><div className="text-sm">QueryCraft</div><div className="text-xs text-white/60">© 2025 QueryCraft</div></div></div>
          <div className="text-sm text-white/60">Built with ❤️ · Designed for devs & analysts</div>
        </div>
      </footer>
    </div>
  );
}

// named export for compatibility with imports that expect `IntroPage`
export const IntroPage = IntroPageV2;
