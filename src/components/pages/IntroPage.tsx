'use client';

import { Button } from "@/components/ui/button";
import { Database, MessageSquare, Zap, Shield, ArrowRight, Sparkles } from "lucide-react";
// Note: We are using framer-motion for better React integration.
import { motion } from "framer-motion";

interface IntroPageProps {
  onShowAuth: () => void;
}

export function IntroPage({ onShowAuth }: IntroPageProps) {
  const features = [
    {
      icon: <Database className="w-8 h-8" />,
      title: "Smart Database Queries",
      description: "Transform natural language into optimized SQL queries with AI-powered intelligence."
    },
    {
      icon: <MessageSquare className="w-8 h-8" />,
      title: "Interactive Chat Interface",
      description: "Chat with your database using our intuitive conversational interface."
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Lightning Fast Results",
      description: "Get instant insights and responses powered by advanced AI models."
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Secure & Reliable",
      description: "Enterprise-grade security with reliable data processing and storage."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--background)' }}>
      {/* Navigation Header */}
      <nav className="w-full px-6 py-4 flex items-center justify-between backdrop-blur-sm bg-card/80 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <Database className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold text-foreground">
            QueryCraft
          </span>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button 
            variant="ghost" 
            onClick={onShowAuth}
          >
            Sign In
          </Button>
          <Button 
            onClick={onShowAuth}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
          >
            Get Started
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-6xl mx-auto text-center">
          
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-16"
          >
            <div className="inline-flex items-center px-4 py-2 bg-secondary rounded-full mb-8 border">
              <Sparkles className="w-4 h-4 text-primary mr-2" />
              <span className="text-sm font-medium text-secondary-foreground">
                AI-Powered Database Assistant
              </span>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold mb-6 text-foreground leading-tight">
              Chat with Your
              <br />
              <span className="text-primary">
                Database
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
              Transform complex database queries into simple conversations. 
              QueryCraft makes data analysis accessible to everyone through the power of AI.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                size="lg"
                onClick={onShowAuth}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 text-lg font-semibold shadow-2xl"
              >
                Start Chatting Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                className="p-8 bg-card rounded-2xl border transition-all duration-300 hover:border-primary/50 hover:shadow-xl"
              >
                <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-6 mx-auto text-primary-foreground">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-4 text-foreground">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="bg-primary rounded-3xl p-12 text-primary-foreground"
          >
            <h2 className="text-4xl font-bold mb-4">
              Ready to Transform Your Data Experience?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of users who have revolutionized their database workflows with QueryCraft.
            </p>
            <Button 
              size="lg"
              onClick={onShowAuth}
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 px-8 text-lg font-semibold shadow-xl"
            >
              Get Started for Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full px-6 py-8 border-t bg-card/50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center space-x-3 mb-4 md:mb-0">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Database className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-muted-foreground">
              QueryCraft
            </span>
          </div>
          
          <div className="text-sm text-muted-foreground">
            © 2025 QueryCraft. All Rights Reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

    

