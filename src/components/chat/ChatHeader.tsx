import { Settings, Database, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import styles from "./ChatHeader.module.css";

interface ChatHeaderProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  onDatabaseImport: () => void;
  onSettingsClick: () => void;
  onWelcomeClick: () => void;
  sidebarTrigger?: React.ReactNode;
}

export function ChatHeader({ selectedModel, onModelChange, onDatabaseImport, onSettingsClick, onWelcomeClick, sidebarTrigger }: ChatHeaderProps) {
  return (
    <div className={styles.header}>
      <div className={styles.container}>
        <div className={styles.left}>
          {sidebarTrigger && (
            <div className="lg:hidden">
              {sidebarTrigger}
            </div>
          )}
          <div className={styles.logoContainer}>
             <Database className={styles.logoIcon} />
          </div>
          <h1 className={styles.title} onClick={onWelcomeClick}>
            QueryCraft
          </h1>
        </div>
        
        <div className={styles.right}>
          <div className={styles.modelSelector}>
            <Bot className={styles.modelIcon} />
            <Select value={selectedModel} onValueChange={onModelChange}>
              <SelectTrigger className={styles.selectTrigger}>
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SelectItem value="qwen:4b">Qwen AI</SelectItem>
                    </TooltipTrigger>
                    <TooltipContent side="right" align="center" className={styles.tooltipContent}>
                      <strong>Qwen (4B)</strong> — faster, smaller model with a lower context window; great for quick, low-latency replies.
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SelectItem value="mistral:7b-instruct">Mistral AI</SelectItem>
                    </TooltipTrigger>
                    <TooltipContent side="right" align="center" className={styles.tooltipContent}>
                      <strong>Mistral (7B)</strong> — larger and more capable with a bigger context window; slightly slower but better for complex prompts.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </SelectContent>
            </Select>
          </div>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={styles.iconButton}
                  onClick={onDatabaseImport}
                >
                  <Database className={styles.icon} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Import Database</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={styles.iconButton}
                  onClick={onSettingsClick}
                >
                  <Settings className={styles.icon} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Settings</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}
