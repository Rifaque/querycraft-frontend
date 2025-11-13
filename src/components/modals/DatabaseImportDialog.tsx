'use client';

import { useState } from "react";
import { Upload, FileText, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://apiquerycraft.hubzero.in';

type FileMeta = {
  id: string;
  originalName: string;
  path: string;
  size: number;
  uploadedAt: string;
  ext: string;
  type: string;
};

type UploadResponse = {
  success: true;
  file: FileMeta;
};

type ConnectionSaveResult = {
  saved: true;
  key: string;
};

type OnImportResult = UploadResponse | ConnectionSaveResult;

interface DatabaseImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Called after a successful import/save.
   * - For file uploads: onImport({ file: <serverFileMeta> })
   * - For connection save: onImport({ saved: true, key: '<localStorageKey>' })
   */
  onImport: (result: OnImportResult, connectionString?: string) => void;
}

function extractErrorMessage(err: unknown): string {
  if (!err) return 'Unknown error';
  if (err instanceof Error) return err.message;
  try {
    return String(err);
  } catch {
    return 'Unknown error';
  }
}

export function DatabaseImportDialog({ open, onOpenChange, onImport }: DatabaseImportDialogProps) {
  const [importMethod, setImportMethod] = useState<'file' | 'connection'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [connectionString, setConnectionString] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    setError(null);
    setSuccessMsg(null);
  };

  const uploadFileToServer = async (file: File): Promise<UploadResponse> => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`${API_BASE}/api/db/upload`, {
      method: 'POST',
      body: fd
    });
    const json = await res.json();
    if (!res.ok) {
      const msg = (json && (json.message || json.error)) ? (json.message || json.error) : `Upload failed (${res.status})`;
      throw new Error(msg);
    }
    return json as UploadResponse; // expected shape enforced by runtime response
  };

  const handleImportClick = async () => {
    setError(null);
    setSuccessMsg(null);

    if (importMethod === 'file') {
      if (!selectedFile) {
        setError('No file selected');
        return;
      }

      setLoading(true);
      try {
        const uploadResp = await uploadFileToServer(selectedFile);
        setSuccessMsg('File uploaded successfully');
        onImport(uploadResp);
      } catch (err: unknown) {
        console.error('upload error', err);
        setError(extractErrorMessage(err));
      } finally {
        setLoading(false);
        onOpenChange(false);
        setSelectedFile(null);
      }
    } else {
      // connection method: save connection string locally (convenience)
      const cs = connectionString.trim();
      if (!cs) {
        setError('Connection string is empty');
        return;
      }
      try {
        const key = 'qc_conn_default';
        localStorage.setItem(key, cs);
        setSuccessMsg('Connection saved locally');
        onImport({ saved: true, key }, cs);
      } catch (err: unknown) {
        console.error('save conn error', err);
        setError(extractErrorMessage(err));
      } finally {
        onOpenChange(false);
        setConnectionString("");
      }
    }
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
              onClick={() => { setImportMethod('file'); setError(null); setSuccessMsg(null); }}
            >
              <CardContent className="flex flex-col items-center p-4">
                <FileText className="w-8 h-8 text-muted-foreground mb-2" />
                <span className="text-sm font-medium">Upload File</span>
                <span className="text-xs text-muted-foreground text-center">SQL, CSV, JSON, SQLite</span>
              </CardContent>
            </Card>

            <Card
              className={`cursor-pointer transition-all ${importMethod === 'connection' ? 'ring-2 ring-primary' : 'hover:bg-accent'}`}
              onClick={() => { setImportMethod('connection'); setError(null); setSuccessMsg(null); }}
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
              <p className="text-xs text-muted-foreground">Supported: .sql, .csv, .json, .sqlite, .db</p>
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
              <p className="text-xs text-muted-foreground">
                We will save this string locally for convenience. For production, avoid storing raw credentials in the browser.
              </p>
            </div>
          )}

          {error && <div className="text-sm text-red-400">{error}</div>}
          {successMsg && <div className="text-sm text-green-400">{successMsg}</div>}

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={handleImportClick}
              disabled={
                loading ||
                (importMethod === 'file' && !selectedFile) ||
                (importMethod === 'connection' && !connectionString.trim())
              }
            >
              <Upload className="w-4 h-4 mr-2" />
              {loading ? 'Importing...' : 'Import'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
