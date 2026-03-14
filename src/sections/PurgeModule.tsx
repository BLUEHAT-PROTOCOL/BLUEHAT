/**
 * MODULE 2: METADATA PURGE
 * EXIF Data Removal Tool
 */

import { useState, useCallback } from 'react';
import { 
  FileSearch, 
  Upload, 
  FileImage, 
  FileText, 
  CheckCircle, 
  AlertTriangle,
  Loader2,
  Download,
  Shield,
  Eye,
  EyeOff,
  Trash2,
  Info,
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';

interface PurgeResult {
  success: boolean;
  originalFilename: string;
  removedFields: number;
  removedFieldNames: string[];
  downloadUrl: string;
  expiresAt: string;
}

export default function PurgeModule() {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PurgeResult | null>(null);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      validateAndSetFile(droppedFile);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    const validTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/tiff', 'image/webp',
      'application/pdf'
    ];
    
    if (!validTypes.includes(file.type)) {
      setError('Invalid file type. Supported: JPG, PNG, TIFF, WebP, PDF');
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setError('File too large. Maximum size: 100MB');
      return;
    }

    setFile(file);
    setError('');
    setResult(null);
  };

  const handlePurge = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    setProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 20;
      });
    }, 500);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const endpoint = file.type === 'application/pdf' 
        ? '/api/purge/pdf' 
        : '/api/purge/image';

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Purge failed');
      }

      setProgress(100);
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      clearInterval(progressInterval);
      setLoading(false);
    }
  };

  const getFileIcon = () => {
    if (!file) return <Upload className="w-12 h-12" />;
    if (file.type === 'application/pdf') return <FileText className="w-12 h-12 text-terminal-red" />;
    return <FileImage className="w-12 h-12 text-terminal-green" />;
  };

  const commonMetadata = [
    { name: 'GPS Location', icon: Eye, risk: 'HIGH' },
    { name: 'Camera Model', icon: Eye, risk: 'MEDIUM' },
    { name: 'Date/Time Taken', icon: Eye, risk: 'MEDIUM' },
    { name: 'Author/Creator', icon: Eye, risk: 'HIGH' },
    { name: 'Software Used', icon: Eye, risk: 'LOW' },
    { name: 'Device Info', icon: Eye, risk: 'HIGH' },
  ];

  return (
    <div className="space-y-6">
      {/* Warning Alert */}
      <Alert className="cyber-alert cyber-alert-warning border-terminal-yellow">
        <AlertTriangle className="w-4 h-4 text-terminal-yellow" />
        <AlertDescription className="text-terminal-yellow font-mono text-sm">
          WARNING: Metadata can reveal your identity, location, and device information.
        </AlertDescription>
      </Alert>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="cyber-card text-center">
          <Eye className="w-8 h-8 text-terminal-red mx-auto mb-2" />
          <h4 className="text-terminal-white font-mono text-sm font-bold">EXPOSED</h4>
          <p className="text-terminal-white/50 text-xs mt-1">
            GPS, camera info, timestamps, author data
          </p>
        </div>
        <div className="cyber-card text-center">
          <Shield className="w-8 h-8 text-terminal-green mx-auto mb-2" />
          <h4 className="text-terminal-white font-mono text-sm font-bold">PROTECTED</h4>
          <p className="text-terminal-white/50 text-xs mt-1">
            All identifying metadata removed
          </p>
        </div>
        <div className="cyber-card text-center">
          <Lock className="w-8 h-8 text-terminal-cyan mx-auto mb-2" />
          <h4 className="text-terminal-white font-mono text-sm font-bold">ANONYMOUS</h4>
          <p className="text-terminal-white/50 text-xs mt-1">
            File content preserved, identity hidden
          </p>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
          dragActive 
            ? 'border-terminal-green bg-terminal-green/10' 
            : 'border-void-border hover:border-terminal-green/50'
        }`}
      >
        <input
          type="file"
          onChange={handleFileChange}
          accept=".jpg,.jpeg,.png,.tiff,.webp,.pdf"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="text-terminal-green/60">
          {getFileIcon()}
        </div>
        
        {file ? (
          <div className="mt-4">
            <p className="text-terminal-green font-mono font-bold">{file.name}</p>
            <p className="text-terminal-white/50 text-sm">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        ) : (
          <div className="mt-4">
            <p className="text-terminal-white font-mono">
              DRAG & DROP or CLICK to upload
            </p>
            <p className="text-terminal-white/50 text-sm mt-2">
              Supports: JPG, PNG, TIFF, WebP, PDF (max 100MB)
            </p>
          </div>
        )}
      </div>

      {/* Metadata Risks */}
      {!file && (
        <div className="cyber-card">
          <h4 className="text-terminal-green font-mono text-sm font-bold mb-4 flex items-center gap-2">
            <Info className="w-4 h-4" />
            POTENTIALLY EXPOSED METADATA
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {commonMetadata.map((item) => (
              <div 
                key={item.name}
                className="flex items-center gap-2 p-2 bg-void-black rounded border border-void-border"
              >
                <item.icon className={`w-4 h-4 ${
                  item.risk === 'HIGH' ? 'text-terminal-red' : 
                  item.risk === 'MEDIUM' ? 'text-terminal-yellow' : 'text-terminal-green'
                }`} />
                <span className="text-terminal-white/70 text-xs font-mono">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Purge Button */}
      {file && (
        <Button
          onClick={handlePurge}
          disabled={loading}
          className="w-full cyber-btn-danger py-4 text-base"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              PURGING METADATA...
            </>
          ) : (
            <>
              <Trash2 className="w-5 h-5 mr-2" />
              PURGE METADATA
            </>
          )}
        </Button>
      )}

      {/* Progress */}
      {loading && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-terminal-red">REMOVING METADATA...</span>
            <span className="text-terminal-red">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="cyber-progress">
            <div 
              className="cyber-progress-bar cyber-progress-bar-danger" 
              style={{ width: `${progress}%` }} 
            />
          </Progress>
        </div>
      )}

      {/* Error */}
      {error && (
        <Alert className="cyber-alert cyber-alert-danger">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Result */}
      {result && (
        <div className="cyber-card cyber-card-active animate-in fade-in border-terminal-green">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-terminal-green" />
            <span className="text-terminal-green font-bold font-mono">PURGE COMPLETE</span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-void-black p-3 rounded border border-void-border">
              <p className="text-terminal-white/50 text-xs font-mono">FIELDS REMOVED</p>
              <p className="text-terminal-green text-2xl font-bold">{result.removedFields}</p>
            </div>
            <div className="bg-void-black p-3 rounded border border-void-border">
              <p className="text-terminal-white/50 text-xs font-mono">FILE SIZE</p>
              <p className="text-terminal-green text-2xl font-bold">
                {(file!.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>

          {result.removedFieldNames.length > 0 && (
            <div className="mb-4">
              <p className="text-terminal-white/50 text-xs font-mono mb-2">REMOVED FIELDS:</p>
              <div className="flex flex-wrap gap-2">
                {result.removedFieldNames.map((field, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 bg-terminal-red/20 text-terminal-red text-xs font-mono rounded"
                  >
                    {field}
                  </span>
                ))}
              </div>
            </div>
          )}

          <Separator className="bg-void-border my-4" />

          <div className="flex items-center justify-between text-xs font-mono text-terminal-white/50 mb-4">
            <span>Expires: {new Date(result.expiresAt).toLocaleString()}</span>
          </div>

          <a
            href={result.downloadUrl}
            download
            className="cyber-btn w-full flex items-center justify-center"
          >
            <Download className="w-4 h-4 mr-2" />
            DOWNLOAD CLEAN FILE
          </a>
        </div>
      )}
    </div>
  );
}
