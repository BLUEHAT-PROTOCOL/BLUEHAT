/**
 * MODULE 4: IDENTITY LEAK CHECKER
 * Simulated Data Breach Scanner
 */

import { useState } from 'react';
import { 
  ShieldAlert, 
  Search, 
  Mail, 
  AlertTriangle,
  CheckCircle,
  Loader2,
  Database,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Shield,
  AlertOctagon,
  FileWarning,
  Key,
  UserX
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';

interface Breach {
  name: string;
  breachDate: string;
  recordsExposed: string;
  compromisedData: string[];
}

interface LeakResult {
  success: boolean;
  email: string;
  scanId: string;
  timestamp: string;
  summary: {
    totalBreaches: number;
    riskScore: number;
    riskLevel: string;
    compromisedDataTypes: string[];
    totalExposedRecords: number;
  };
  breaches: Breach[];
  recommendations: string[];
  disclaimer: string;
}

export default function LeakModule() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LeakResult | null>(null);
  const [error, setError] = useState('');

  const handleCheck = async () => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/leak/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Leak check failed');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'text-terminal-red';
      case 'HIGH': return 'text-terminal-red';
      case 'MEDIUM': return 'text-terminal-yellow';
      case 'LOW': return 'text-terminal-green';
      default: return 'text-terminal-white';
    }
  };

  const getRiskBg = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'bg-terminal-red/20 border-terminal-red';
      case 'HIGH': return 'bg-terminal-red/10 border-terminal-red/50';
      case 'MEDIUM': return 'bg-terminal-yellow/10 border-terminal-yellow/50';
      case 'LOW': return 'bg-terminal-green/10 border-terminal-green/50';
      default: return 'bg-void-gray border-void-border';
    }
  };

  const dataTypeIcons: Record<string, any> = {
    'email': Mail,
    'password': Lock,
    'username': UserX,
    'phone': Database,
    'default': Eye
  };

  return (
    <div className="space-y-6">
      {/* Warning */}
      <Alert className="cyber-alert cyber-alert-warning border-terminal-yellow">
        <AlertTriangle className="w-4 h-4 text-terminal-yellow" />
        <AlertDescription className="text-terminal-yellow font-mono text-sm">
          SIMULATION MODE: This is a demonstration. Use Have I Been Pwned for real checks.
        </AlertDescription>
      </Alert>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="cyber-card text-center">
          <Database className="w-8 h-8 text-terminal-cyan mx-auto mb-2" />
          <h4 className="text-terminal-white font-mono text-sm font-bold">8 BILLION+</h4>
          <p className="text-terminal-white/50 text-xs mt-1">
            Records in breach databases
          </p>
        </div>
        <div className="cyber-card text-center">
          <AlertOctagon className="w-8 h-8 text-terminal-red mx-auto mb-2" />
          <h4 className="text-terminal-white font-mono text-sm font-bold">500+</h4>
          <p className="text-terminal-white/50 text-xs mt-1">
            Known data breaches
          </p>
        </div>
        <div className="cyber-card text-center">
          <Shield className="w-8 h-8 text-terminal-green mx-auto mb-2" />
          <h4 className="text-terminal-white font-mono text-sm font-bold">PROTECTION</h4>
          <p className="text-terminal-white/50 text-xs mt-1">
            Check and secure your accounts
          </p>
        </div>
      </div>

      {/* Email Input */}
      <div className="cyber-card">
        <Label className="text-terminal-green font-mono text-sm mb-2 block">
          EMAIL ADDRESS TO SCAN
        </Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-terminal-green/50" />
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="cyber-input pl-10"
            />
          </div>
          <Button
            onClick={handleCheck}
            disabled={loading || !email}
            className="cyber-btn"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                SCAN
              </>
            )}
          </Button>
        </div>
        <p className="text-terminal-white/40 text-xs font-mono mt-2">
          * Email is hashed before processing. We never store your email.
        </p>
      </div>

      {/* Error */}
      {error && (
        <Alert className="cyber-alert cyber-alert-danger">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4 animate-in fade-in">
          {/* Summary Card */}
          <div className={`cyber-card border-2 ${getRiskBg(result.summary.riskLevel)}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {result.summary.riskLevel === 'LOW' ? (
                  <CheckCircle className="w-6 h-6 text-terminal-green" />
                ) : (
                  <ShieldAlert className={`w-6 h-6 ${getRiskColor(result.summary.riskLevel)}`} />
                )}
                <span className={`text-xl font-bold font-mono ${getRiskColor(result.summary.riskLevel)}`}>
                  {result.summary.riskLevel} RISK
                </span>
              </div>
              <div className="text-right">
                <span className="text-terminal-white/50 text-xs font-mono">SCAN ID</span>
                <p className="text-terminal-cyan font-mono text-xs">{result.scanId}</p>
              </div>
            </div>

            {/* Risk Score */}
            <div className="mb-4">
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-terminal-white/50">RISK SCORE</span>
                <span className={getRiskColor(result.summary.riskLevel)}>
                  {result.summary.riskScore}/100
                </span>
              </div>
              <Progress 
                value={result.summary.riskScore} 
                className="cyber-progress"
              >
                <div 
                  className={`h-full transition-all duration-300 ${
                    result.summary.riskScore > 60 
                      ? 'bg-terminal-red shadow-[0_0_10px_#ff0040]' 
                      : result.summary.riskScore > 40 
                        ? 'bg-terminal-yellow' 
                        : 'bg-terminal-green shadow-[0_0_10px_#00ff41]'
                  }`}
                  style={{ width: `${result.summary.riskScore}%` }}
                />
              </Progress>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-void-black/50 p-3 rounded">
                <p className="text-terminal-white/50 text-xs font-mono">BREACHES FOUND</p>
                <p className={`text-2xl font-bold ${getRiskColor(result.summary.riskLevel)}`}>
                  {result.summary.totalBreaches}
                </p>
              </div>
              <div className="bg-void-black/50 p-3 rounded">
                <p className="text-terminal-white/50 text-xs font-mono">EXPOSED RECORDS</p>
                <p className="text-terminal-cyan text-2xl font-bold">
                  {result.summary.totalExposedRecords.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Compromised Data Types */}
          {result.summary.compromisedDataTypes.length > 0 && (
            <div className="cyber-card">
              <h4 className="text-terminal-white font-mono text-sm font-bold mb-3">
                COMPROMISED DATA TYPES
              </h4>
              <div className="flex flex-wrap gap-2">
                {result.summary.compromisedDataTypes.map((type, index) => {
                  const Icon = dataTypeIcons[type] || dataTypeIcons.default;
                  return (
                    <div 
                      key={index}
                      className="flex items-center gap-2 px-3 py-2 bg-terminal-red/10 border border-terminal-red/30 rounded"
                    >
                      <Icon className="w-4 h-4 text-terminal-red" />
                      <span className="text-terminal-red text-xs font-mono uppercase">{type}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Breach List */}
          {result.breaches.length > 0 && (
            <div className="cyber-card">
              <h4 className="text-terminal-red font-mono text-sm font-bold mb-3 flex items-center gap-2">
                <FileWarning className="w-4 h-4" />
                BREACHES DETECTED
              </h4>
              <div className="space-y-3">
                {result.breaches.map((breach, index) => (
                  <div 
                    key={index}
                    className="p-3 bg-void-black border border-void-border rounded"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-terminal-white font-mono font-bold">
                        {breach.name}
                      </span>
                      <span className="text-terminal-white/50 text-xs font-mono">
                        {breach.breachDate}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-terminal-red text-xs font-mono">
                        {breach.recordsExposed} records
                      </span>
                      <div className="flex gap-1">
                        {breach.compromisedData.map((data, i) => (
                          <span 
                            key={i}
                            className="px-2 py-0.5 bg-terminal-red/20 text-terminal-red text-[10px] font-mono rounded"
                          >
                            {data}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          <div className="cyber-card border-terminal-green">
            <h4 className="text-terminal-green font-mono text-sm font-bold mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              SECURITY RECOMMENDATIONS
            </h4>
            <ul className="space-y-2">
              {result.recommendations.map((rec, index) => (
                <li 
                  key={index}
                  className="flex items-start gap-2 text-terminal-white/70 text-sm font-mono"
                >
                  <span className="text-terminal-green mt-1">{'>'}</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>

          {/* Disclaimer */}
          <Alert className="cyber-alert cyber-alert-info border-terminal-cyan/50">
            <Info className="w-4 h-4 text-terminal-cyan" />
            <AlertDescription className="text-terminal-cyan/70 font-mono text-xs">
              {result.disclaimer}
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
}
