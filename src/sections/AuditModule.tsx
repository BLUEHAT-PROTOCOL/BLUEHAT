/**
 * MODULE 5: SECURITY AUDIT LOG
 * IP and Activity Monitoring
 */

import { useState, useEffect } from 'react';
import { 
  Activity, 
  Eye, 
  Server, 
  Clock,
  Globe,
  AlertTriangle,
  Loader2,
  Database,
  Shield,
  Terminal,
  Filter,
  RefreshCw,
  MapPin,
  Monitor,
  User,
  Lock,
  Unlock,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface LogEntry {
  id: number;
  ip_address: string;
  user_agent: string;
  endpoint: string;
  method: string;
  timestamp: string;
  country?: string;
  threat_level?: string;
}

interface AuditStats {
  total_requests: string;
  unique_ips: string;
  requests_24h: string;
}

interface AuditData {
  success: boolean;
  statistics: AuditStats;
  logs: LogEntry[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

export default function AuditModule() {
  const [data, setData] = useState<AuditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [terminalMode, setTerminalMode] = useState(true);

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/audit/logs?limit=50');
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch logs');
      }
      
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchLogs();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLogs();
  };

  const filteredLogs = data?.logs.filter(log => 
    log.ip_address.includes(filter) ||
    log.endpoint.toLowerCase().includes(filter.toLowerCase()) ||
    log.method.toLowerCase().includes(filter.toLowerCase())
  ) || [];

  const getThreatColor = (level?: string) => {
    switch (level) {
      case 'CRITICAL': return 'text-terminal-red bg-terminal-red/20';
      case 'HIGH': return 'text-terminal-red bg-terminal-red/10';
      case 'MEDIUM': return 'text-terminal-yellow bg-terminal-yellow/10';
      case 'LOW': return 'text-terminal-green bg-terminal-green/10';
      default: return 'text-terminal-white/50 bg-void-gray';
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'text-terminal-green';
      case 'POST': return 'text-terminal-yellow';
      case 'PUT': return 'text-terminal-cyan';
      case 'DELETE': return 'text-terminal-red';
      default: return 'text-terminal-white/50';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-terminal-green animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Alert */}
      <Alert className="cyber-alert cyber-alert-danger border-terminal-red">
        <Lock className="w-4 h-4 text-terminal-red" />
        <AlertDescription className="text-terminal-red font-mono text-sm">
          AUTHORIZED PERSONNEL ONLY - All access is logged and monitored
        </AlertDescription>
      </Alert>

      {/* Stats Cards */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="cyber-card text-center">
            <Database className="w-8 h-8 text-terminal-cyan mx-auto mb-2" />
            <p className="text-terminal-white/50 text-xs font-mono">TOTAL REQUESTS</p>
            <p className="text-terminal-cyan text-3xl font-bold font-mono">
              {parseInt(data.statistics.total_requests).toLocaleString()}
            </p>
          </div>
          <div className="cyber-card text-center">
            <Globe className="w-8 h-8 text-terminal-green mx-auto mb-2" />
            <p className="text-terminal-white/50 text-xs font-mono">UNIQUE IPs</p>
            <p className="text-terminal-green text-3xl font-bold font-mono">
              {parseInt(data.statistics.unique_ips).toLocaleString()}
            </p>
          </div>
          <div className="cyber-card text-center">
            <Clock className="w-8 h-8 text-terminal-yellow mx-auto mb-2" />
            <p className="text-terminal-white/50 text-xs font-mono">LAST 24H</p>
            <p className="text-terminal-yellow text-3xl font-bold font-mono">
              {parseInt(data.statistics.requests_24h).toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="cyber-card">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-terminal-green/50" />
            <Input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter by IP, endpoint, or method..."
              className="cyber-input pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setTerminalMode(!terminalMode)}
              className="border-void-border text-terminal-white hover:text-terminal-green hover:border-terminal-green"
            >
              <Terminal className="w-4 h-4 mr-2" />
              {terminalMode ? 'TABLE VIEW' : 'TERMINAL VIEW'}
            </Button>
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              className="cyber-btn"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              REFRESH
            </Button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <Alert className="cyber-alert cyber-alert-danger">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Logs Display */}
      {data && (
        <div className="cyber-card p-0 overflow-hidden">
          <div className="terminal-header">
            <div className="terminal-dot terminal-dot-red" />
            <div className="terminal-dot terminal-dot-yellow" />
            <div className="terminal-dot terminal-dot-green" />
            <span className="ml-2 text-xs text-terminal-white/60 font-mono">
              access_logs.db | {filteredLogs.length} entries
            </span>
          </div>

          {terminalMode ? (
            <ScrollArea className="h-[500px]">
              <div className="p-4 font-mono text-xs space-y-1">
                {filteredLogs.length === 0 ? (
                  <div className="text-terminal-white/50 text-center py-10">
                    No logs found matching filter
                  </div>
                ) : (
                  filteredLogs.map((log, index) => (
                    <div 
                      key={log.id}
                      className="flex items-start gap-3 py-2 border-b border-void-border/50 hover:bg-terminal-green/5 transition-colors"
                    >
                      <span className="text-terminal-white/30 w-8">{index + 1}</span>
                      <span className="text-terminal-white/50">{new Date(log.timestamp).toLocaleString()}</span>
                      <span className={getMethodColor(log.method)}>{log.method}</span>
                      <span className="text-terminal-cyan truncate max-w-[200px]">{log.endpoint}</span>
                      <span className="text-terminal-green">{log.ip_address}</span>
                      <span className={`px-2 rounded text-[10px] ${getThreatColor(log.threat_level)}`}>
                        {log.threat_level || 'LOW'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          ) : (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow className="border-void-border hover:bg-transparent">
                    <TableHead className="text-terminal-green font-mono text-xs">TIME</TableHead>
                    <TableHead className="text-terminal-green font-mono text-xs">METHOD</TableHead>
                    <TableHead className="text-terminal-green font-mono text-xs">ENDPOINT</TableHead>
                    <TableHead className="text-terminal-green font-mono text-xs">IP ADDRESS</TableHead>
                    <TableHead className="text-terminal-green font-mono text-xs">THREAT</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-terminal-white/50 py-10">
                        No logs found matching filter
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs.map((log) => (
                      <TableRow 
                        key={log.id} 
                        className="border-void-border hover:bg-terminal-green/5"
                      >
                        <TableCell className="text-terminal-white/60 text-xs font-mono">
                          {new Date(log.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell className={getMethodColor(log.method) + ' text-xs font-mono'}>
                          {log.method}
                        </TableCell>
                        <TableCell className="text-terminal-cyan text-xs font-mono truncate max-w-[200px]">
                          {log.endpoint}
                        </TableCell>
                        <TableCell className="text-terminal-green text-xs font-mono">
                          {log.ip_address}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-[10px] font-mono ${getThreatColor(log.threat_level)}`}>
                            {log.threat_level || 'LOW'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </div>
      )}

      {/* Log Details Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="cyber-card">
          <h4 className="text-terminal-green font-mono text-sm font-bold mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            LOGGED DATA
          </h4>
          <ul className="space-y-2 text-xs font-mono">
            <li className="flex items-center gap-2 text-terminal-white/70">
              <Globe className="w-3 h-3 text-terminal-green" />
              IP Address (IPv4/IPv6)
            </li>
            <li className="flex items-center gap-2 text-terminal-white/70">
              <Monitor className="w-3 h-3 text-terminal-green" />
              User Agent (Browser/OS)
            </li>
            <li className="flex items-center gap-2 text-terminal-white/70">
              <Clock className="w-3 h-3 text-terminal-green" />
              Timestamp (UTC)
            </li>
            <li className="flex items-center gap-2 text-terminal-white/70">
              <Server className="w-3 h-3 text-terminal-green" />
              Endpoint & HTTP Method
            </li>
            <li className="flex items-center gap-2 text-terminal-white/70">
              <MapPin className="w-3 h-3 text-terminal-green" />
              Geolocation (if available)
            </li>
          </ul>
        </div>

        <div className="cyber-card">
          <h4 className="text-terminal-yellow font-mono text-sm font-bold mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            RETENTION POLICY
          </h4>
          <ul className="space-y-2 text-xs font-mono">
            <li className="flex items-center gap-2 text-terminal-white/70">
              <Database className="w-3 h-3 text-terminal-yellow" />
              PostgreSQL: 90 days
            </li>
            <li className="flex items-center gap-2 text-terminal-white/70">
              <FileText className="w-3 h-3 text-terminal-yellow" />
              MongoDB: 1 year
            </li>
            <li className="flex items-center gap-2 text-terminal-white/70">
              <Lock className="w-3 h-3 text-terminal-yellow" />
              Encrypted at rest
            </li>
            <li className="flex items-center gap-2 text-terminal-white/70">
              <User className="w-3 h-3 text-terminal-yellow" />
              Access: Admin only
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
