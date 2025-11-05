'use client';

import { useState } from "react";
import { Upload, FileText, Database as DatabaseIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import styles from "./DatabaseImportDialog.module.css";

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
    onOpenChange(false);
    setSelectedFile(null);
    setConnectionString("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={styles.dialogContent}>
        <DialogHeader>
          <DialogTitle className={styles.dialogTitle}>
            <DatabaseIcon className={styles.icon} />
            <span>Import Database</span>
          </DialogTitle>
          <DialogDescription className={styles.dialogDescription}>
            Upload a file or connect to an existing database.
          </DialogDescription>
        </DialogHeader>

        <div className={styles.content}>
          <div className={styles.methodGrid}>
            <Card
              className={`${styles.card} ${importMethod === 'file' ? styles.selected : styles.cardHover}`}
              onClick={() => setImportMethod('file')}
            >
              <CardContent className={styles.cardContent}>
                <FileText className={styles.cardIcon} />
                <span className={styles.cardTitle}>Upload File</span>
                <span className={styles.cardSubtitle}>SQL, CSV, JSON</span>
              </CardContent>
            </Card>

            <Card
              className={`${styles.card} ${importMethod === 'connection' ? styles.selected : styles.cardHover}`}
              onClick={() => setImportMethod('connection')}
            >
              <CardContent className={styles.cardContent}>
                <DatabaseIcon className={styles.cardIcon} />
                <span className={styles.cardTitle}>Connect DB</span>
                <span className={styles.cardSubtitle}>Connection String</span>
              </CardContent>
            </Card>
          </div>

          {importMethod === 'file' && (
            <div className={styles.formRow}>
              <Label htmlFor="database-file" className={styles.label}>Select Database File</Label>
              <Input id="database-file" type="file" onChange={handleFileChange} className={styles.fileInput} />
              {selectedFile && <div className={styles.fileName}>{selectedFile.name}</div>}
            </div>
          )}

          {importMethod === 'connection' && (
            <div className={styles.formRow}>
              <Label htmlFor="connection-string" className={styles.label}>Database Connection String</Label>
              <Input
                id="connection-string"
                type="text"
                placeholder="postgresql://user:pass@host:port/db"
                value={connectionString}
                onChange={(e) => setConnectionString(e.target.value)}
                className={styles.textInput}
              />
            </div>
          )}

          <div className={styles.actions}>
            <Button variant="outline" onClick={() => onOpenChange(false)} className={styles.cancelBtn}>
              Cancel
            </Button>
            <Button
              onClick={handleImportClick}
              disabled={
                (importMethod === 'file' && !selectedFile) ||
                (importMethod === 'connection' && !connectionString.trim())
              }
              className={styles.importBtn}
            >
              <Upload className={styles.uploadIcon} />
              Import
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
