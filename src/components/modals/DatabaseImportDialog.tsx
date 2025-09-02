'use client';

import { useState } from "react";
import { Upload, FileText, Database, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

interface DatabaseImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (file: File | null, connectionString?: string) => void;
}

export function DatabaseImportDialog({ open, onOpenChange, onImport }: DatabaseImportDialogProps) {
  const [importMethod, setImportMethod] = useState<'file' | 'connection'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [connectionString, setConnectionString] = useState("");

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
  };

  const handleImportClick = () => {
    if (importMethod === 'file') {
      onImport(selectedFile);
    } else {
      onImport(null, connectionString);
    }
    // Reset state and close dialog
    onOpenChange(false);
    setSelectedFile(null);
    setConnectionString("");
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Database className="w-5 h-5" />
            <span>Import Database</span>
          </DialogTitle>
          <DialogDescription>
            Upload a file or connect to an existing database.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-3">
            <Card 
              className={`cursor-pointer transition-all ${importMethod === 'file' ? 'ring-2 ring-primary' : 'hover:bg-accent'}`}
              onClick={() => setImportMethod('file')}
            >
              <CardContent className="flex flex-col items-center p-4">
                <FileText className="w-8 h-8 text-muted-foreground mb-2" />
                <span className="text-sm font-medium">Upload File</span>
                <span className="text-xs text-muted-foreground text-center">SQL, CSV, JSON</span>
              </CardContent>
            </Card>
            
            <Card 
              className={`cursor-pointer transition-all ${importMethod === 'connection' ? 'ring-2 ring-primary' : 'hover:bg-accent'}`}
              onClick={() => setImportMethod('connection')}
            >
              <CardContent className="flex flex-col items-center p-4">
                <Database className="w-8 h-8 text-muted-foreground mb-2" />
                <span className="text-sm font-medium">Connect DB</span>
                <span className="text-xs text-muted-foreground text-center">Connection String</span>
              </CardContent>
            </Card>
          </div>

          {importMethod === 'file' && (
            <div className="space-y-2">
              <Label htmlFor="database-file">Select Database File</Label>
              <Input id="database-file" type="file" onChange={handleFileChange} />
            </div>
          )}

          {importMethod === 'connection' && (
            <div className="space-y-2">
              <Label htmlFor="connection-string">Database Connection String</Label>
              <Input
                id="connection-string"
                type="text"
                placeholder="postgresql://user:pass@host:port/db"
                value={connectionString}
                onChange={(e) => setConnectionString(e.target.value)}
              />
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleImportClick}
              disabled={
                (importMethod === 'file' && !selectedFile) || 
                (importMethod === 'connection' && !connectionString.trim())
              }
            >
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
