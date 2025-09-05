import { Settings, Database, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
// We'll add a placeholder for the logo asset
// import queryCraftLogo from "@/assets/querycraft-logo.png";

interface ChatHeaderProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  onDatabaseImport: () => void;
  onSettingsClick: () => void;
  sidebarTrigger?: React.ReactNode;
}

export function ChatHeader({ selectedModel, onModelChange, onDatabaseImport, onSettingsClick, sidebarTrigger }: ChatHeaderProps) {
  return (
    <div className="sticky top-0 z-50 bg-card/95 backdrop-blur-lg border-b border-border shadow-sm">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-3">
          {sidebarTrigger && (
            <div className="lg:hidden">
              {sidebarTrigger}
            </div>
          )}
          <div className="w-10 h-10 flex items-center justify-center bg-primary rounded-lg">
             {/* <img 
              src={queryCraftLogo.src} 
              alt="QueryCraft AI" 
              className="w-8 h-8 object-contain"
            /> */}
             <Database className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">
            QueryCraft
          </h1>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Bot className="w-4 h-4 text-muted-foreground" />
            <Select value={selectedModel} onValueChange={onModelChange}>
              <SelectTrigger className="w-32 h-9 text-sm">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="merlin">Merlin AI</SelectItem>
                <SelectItem value="qwen">QWEN AI</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-muted-foreground"
                  onClick={onDatabaseImport}
                >
                  <Database className="w-5 h-5" />
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
                  className="text-muted-foreground"
                  onClick={onSettingsClick}
                >
                  <Settings className="w-5 h-5" />
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
