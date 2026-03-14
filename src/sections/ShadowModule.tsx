/**
 * MODULE 3: SHADOW FETCH (PROXY)
 * Anonymous Request Forwarding
 */

import { useState } from 'react';
import { 
  Globe, 
  Send, 
  Shield, 
  Eye, 
  EyeOff,
  Server,
  Clock,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Copy,
  Check,
  Terminal,
  Lock,
  Unlock,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ProxyResponse {
  success: boolean;
  proxyInfo: {
    proxyIP: string;
    serverIP: string;
    responseTime: string;
    timestamp: string;
  };
  targetResponse: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    contentType: string;
    isBase64: boolean;
    size: number;
    data: string;
  };
  anonymityStatus: string;
}

export default function ShadowModule() {
  const [url, setUrl] = useState('');
  const [method, setMethod] = useState('GET');
  const [headers, setHeaders] = useState('{}');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ProxyResponse | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  const handleFetch = async () => {
    if (!url) {
      setError('Please enter a target URL');
      return;
    }

    setLoading(true);
    setError('');
    setResponse(null);

    try {
      let parsedHeaders = {};
      try {
        parsedHeaders = JSON.parse(headers);
      } catch {
        setError('Invalid JSON in headers field');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/shadow/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          method,
          headers: parsedHeaders,
          body: body || undefined,
          timeout: 30000
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Proxy fetch failed');
      }

      setResponse(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatJson = (data: any) => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];

  return (
    <div className="space-y-6">
      {/* Info Alert */}
      <Alert className="cyber-alert cyber-alert-info border-terminal-cyan">
        <Shield className="w-4 h-4 text-terminal-cyan" />
        <AlertDescription className="text-terminal-cyan font-mono text-sm">
          Your real IP is hidden. Target server only sees our proxy IP.
        </AlertDescription>
      </Alert>

      {/* Anonymity Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="cyber-card text-center">
          <EyeOff className="w-8 h-8 text-terminal-green mx-auto mb-2" />
          <h4 className="text-terminal-white font-mono text-sm font-bold">HIDDEN IP</h4>
          <p className="text-terminal-white/50 text-xs mt-1">
            Your real IP is masked
          </p>
        </div>
        <div className="cyber-card text-center">
          <Server className="w-8 h-8 text-terminal-cyan mx-auto mb-2" />
          <h4 className="text-terminal-white font-mono text-sm font-bold">PROXY SERVER</h4>
          <p className="text-terminal-white/50 text-xs mt-1">
            Request routed through our servers
          </p>
        </div>
        <div className="cyber-card text-center">
          <Lock className="w-8 h-8 text-terminal-green mx-auto mb-2" />
          <h4 className="text-terminal-white font-mono text-sm font-bold">ENCRYPTED</h4>
          <p className="text-terminal-white/50 text-xs mt-1">
            HTTPS encryption active
          </p>
        </div>
      </div>

      {/* Request Configuration */}
      <div className="cyber-card">
        <Label className="text-terminal-green font-mono text-sm mb-2 block">
          TARGET URL
        </Label>
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://api.example.com/data"
          className="cyber-input mb-4"
        />

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <Label className="text-terminal-white/60 font-mono text-xs mb-2 block">
              METHOD
            </Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger className="cyber-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-void-dark border-void-border">
                {methods.map(m => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-terminal-white/60 font-mono text-xs mb-2 block">
              TIMEOUT (ms)
            </Label>
            <Input
              value="30000"
              disabled
              className="cyber-input opacity-50"
            />
          </div>
        </div>

        <Tabs defaultValue="headers" className="w-full">
          <TabsList className="bg-void-gray border border-void-border">
            <TabsTrigger 
              value="headers"
              className="data-[state=active]:bg-terminal-green data-[state=active]:text-void-black font-mono text-xs"
            >
              HEADERS (JSON)
            </TabsTrigger>
            <TabsTrigger 
              value="body"
              className="data-[state=active]:bg-terminal-green data-[state=active]:text-void-black font-mono text-xs"
            >
              BODY
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="headers" className="mt-2">
            <Textarea
              value={headers}
              onChange={(e) => setHeaders(e.target.value)}
              placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
              className="cyber-input min-h-[100px] font-mono text-xs"
            />
          </TabsContent>
          
          <TabsContent value="body" className="mt-2">
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder='{"key": "value"}'
              className="cyber-input min-h-[100px] font-mono text-xs"
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Fetch Button */}
      <Button
        onClick={handleFetch}
        disabled={loading || !url}
        className="w-full cyber-btn py-4 text-base"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            FETCHING...
          </>
        ) : (
          <>
            <Send className="w-5 h-5 mr-2" />
            SHADOW FETCH
          </>
        )}
      </Button>

      {/* Error */}
      {error && (
        <Alert className="cyber-alert cyber-alert-danger">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Response */}
      {response && (
        <div className="space-y-4 animate-in fade-in">
          {/* Proxy Info */}
          <div className="cyber-card border-terminal-green">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-terminal-green" />
              <span className="text-terminal-green font-bold font-mono">PROXY INFORMATION</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 font-mono text-sm">
              <div>
                <span className="text-terminal-white/50">Response Time:</span>
                <span className="text-terminal-green ml-2">{response.proxyInfo.responseTime}</span>
              </div>
              <div>
                <span className="text-terminal-white/50">Timestamp:</span>
                <span className="text-terminal-white ml-2">
                  {new Date(response.proxyInfo.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
            
            <div className="mt-3 p-2 bg-terminal-green/10 rounded border border-terminal-green/30">
              <span className="text-terminal-green text-xs font-mono">
                {response.anonymityStatus}
              </span>
            </div>
          </div>

          {/* Target Response */}
          <div className="cyber-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-terminal-cyan" />
                <span className="text-terminal-cyan font-bold font-mono">TARGET RESPONSE</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs font-mono ${
                  response.targetResponse.status < 400 
                    ? 'bg-terminal-green/20 text-terminal-green' 
                    : 'bg-terminal-red/20 text-terminal-red'
                }`}>
                  {response.targetResponse.status} {response.targetResponse.statusText}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4 font-mono text-xs">
              <div>
                <span className="text-terminal-white/50">Content-Type:</span>
                <span className="text-terminal-white ml-2">{response.targetResponse.contentType}</span>
              </div>
              <div>
                <span className="text-terminal-white/50">Size:</span>
                <span className="text-terminal-white ml-2">
                  {(response.targetResponse.size / 1024).toFixed(2)} KB
                </span>
              </div>
            </div>

            <Separator className="bg-void-border my-4" />

            {/* Response Headers */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-terminal-white/50 text-xs font-mono">RESPONSE HEADERS</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(formatJson(response.targetResponse.headers))}
                  className="h-6 text-terminal-green hover:text-terminal-green hover:bg-terminal-green/10"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                </Button>
              </div>
              <div className="code-block max-h-[150px]">
                <pre className="text-xs">{formatJson(response.targetResponse.headers)}</pre>
              </div>
            </div>

            {/* Response Body */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-terminal-white/50 text-xs font-mono">RESPONSE BODY</span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowRaw(!showRaw)}
                    className="h-6 text-terminal-white/50 hover:text-terminal-green"
                  >
                    {showRaw ? 'PARSED' : 'RAW'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(response.targetResponse.data)}
                    className="h-6 text-terminal-green hover:text-terminal-green hover:bg-terminal-green/10"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
              </div>
              <div className="code-block max-h-[300px]">
                <pre className="text-xs break-all whitespace-pre-wrap">
                  {response.targetResponse.isBase64 
                    ? `[Base64 encoded - ${response.targetResponse.data.length} chars]`
                    : showRaw 
                      ? response.targetResponse.data
                      : (() => {
                          try {
                            return formatJson(JSON.parse(response.targetResponse.data));
                          } catch {
                            return response.targetResponse.data;
                          }
                        })()
                  }
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
