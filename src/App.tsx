/**
 * VOID-X PLATFORM - MAIN APPLICATION
 * Code-Name: VANILLA
 * UI: Hyper-Dark Terminal Theme
 */

import { useState, useEffect } from 'react';
import { 
  Terminal, 
  Download, 
  FileSearch, 
  Globe, 
  ShieldAlert, 
  Activity,
  Cpu,
  Lock,
  Eye,
  Server,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  FileImage,
  FileText,
  Search,
  Database,
  Zap,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

// Module Components
import ReaperModule from './sections/ReaperModule';
import PurgeModule from './sections/PurgeModule';
import ShadowModule from './sections/ShadowModule';
import LeakModule from './sections/LeakModule';
import AuditModule from './sections/AuditModule';

interface SystemStatus {
  status: string;
  modules: {
    reaper: string;
    purge: string;
    shadow: string;
    leakCheck: string;
    audit: string;
  };
  timestamp: string;
}

function App() {
  const [activeTab, setActiveTab] = useState('reaper');
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [terminalLines, setTerminalLines] = useState<string[]>([]);

  // Boot sequence
  useEffect(() => {
    const bootSequence = [
      '[BOOT] Initializing VOID-X Kernel...',
      '[BOOT] Loading security modules...',
      '[BOOT] Mounting filesystems...',
      '[BOOT] Starting PostgreSQL connection...',
      '[BOOT] Starting MongoDB connection...',
      '[BOOT] Initializing yt-dlp engine...',
      '[BOOT] Loading EXIF tools...',
      '[BOOT] Starting proxy services...',
      '[BOOT] All systems operational.',
      '[SYSTEM] Welcome to VOID-X Platform'
    ];

    let delay = 0;
    bootSequence.forEach((line, index) => {
      setTimeout(() => {
        setTerminalLines(prev => [...prev, line]);
      }, delay);
      delay += index < 3 ? 200 : 150;
    });

    // Check system health
    setTimeout(() => {
      checkHealth();
    }, 2000);
  }, []);

  const checkHealth = async () => {
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      setSystemStatus(data);
    } catch (error) {
      console.error('Health check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const modules = [
    { id: 'reaper', name: 'THE REAPER', icon: Download, desc: 'Media Downloader' },
    { id: 'purge', name: 'METADATA PURGE', icon: FileSearch, desc: 'EXIF Cleaner' },
    { id: 'shadow', name: 'SHADOW FETCH', icon: Globe, desc: 'Proxy Request' },
    { id: 'leak', name: 'LEAK CHECK', icon: ShieldAlert, desc: 'Breach Scanner' },
    { id: 'audit', name: 'AUDIT LOG', icon: Activity, desc: 'Security Monitor' },
  ];

  const renderModule = () => {
    switch (activeTab) {
      case 'reaper':
        return <ReaperModule />;
      case 'purge':
        return <PurgeModule />;
      case 'shadow':
        return <ShadowModule />;
      case 'leak':
        return <LeakModule />;
      case 'audit':
        return <AuditModule />;
      default:
        return <ReaperModule />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-void-black flex items-center justify-center">
        <div className="terminal-window w-full max-w-2xl mx-4">
          <div className="terminal-header">
            <div className="terminal-dot terminal-dot-red" />
            <div className="terminal-dot terminal-dot-yellow" />
            <div className="terminal-dot terminal-dot-green" />
            <span className="ml-2 text-xs text-terminal-white/60 font-mono">boot_sequence.sh</span>
          </div>
          <div className="terminal-body min-h-[300px]">
            <div className="flex items-center gap-2 mb-4">
              <Terminal className="w-5 h-5 text-terminal-green" />
              <span className="text-terminal-green font-bold">VOID-X BOOT SEQUENCE</span>
            </div>
            <ScrollArea className="h-[250px]">
              {terminalLines.map((line, index) => (
                <div key={index} className="text-sm font-mono mb-1">
                  <span className="text-terminal-green">{'>'}</span>
                  <span className="text-terminal-white ml-2">{line}</span>
                </div>
              ))}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-terminal-green">{'>'}</span>
                <span className="w-3 h-5 bg-terminal-green animate-blink" />
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void-black scan-lines">
      {/* Header */}
      <header className="border-b border-void-border bg-void-dark/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 border-2 border-terminal-green flex items-center justify-center">
                  <span className="text-terminal-green font-bold text-lg">V</span>
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-terminal-green animate-pulse" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-terminal-green tracking-wider">
                  VOID-X
                </h1>
                <p className="text-xs text-terminal-white/50 font-mono">
                  CODE-NAME: VANILLA
                </p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {modules.map((mod) => (
                <button
                  key={mod.id}
                  onClick={() => setActiveTab(mod.id)}
                  className={`px-4 py-2 text-xs font-mono uppercase tracking-wider transition-all duration-300 flex items-center gap-2 ${
                    activeTab === mod.id
                      ? 'text-terminal-green border-b-2 border-terminal-green bg-terminal-green/10'
                      : 'text-terminal-white/60 hover:text-terminal-green hover:bg-terminal-green/5'
                  }`}
                >
                  <mod.icon className="w-4 h-4" />
                  {mod.name}
                </button>
              ))}
            </nav>

            {/* Status Indicator */}
            <div className="hidden md:flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1 bg-void-gray rounded">
                <div className="status-dot status-online" />
                <span className="text-xs font-mono text-terminal-green">
                  {systemStatus?.status || 'UNKNOWN'}
                </span>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-terminal-green"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-void-border bg-void-dark">
            {modules.map((mod) => (
              <button
                key={mod.id}
                onClick={() => {
                  setActiveTab(mod.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full px-4 py-3 text-left text-sm font-mono uppercase flex items-center gap-3 ${
                  activeTab === mod.id
                    ? 'text-terminal-green bg-terminal-green/10'
                    : 'text-terminal-white/60'
                }`}
              >
                <mod.icon className="w-4 h-4" />
                {mod.name}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Module Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            {modules.find(m => m.id === activeTab)?.icon && (
              <div className="w-12 h-12 border border-terminal-green/30 flex items-center justify-center bg-terminal-green/5">
                {(() => {
                  const Icon = modules.find(m => m.id === activeTab)?.icon || Terminal;
                  return <Icon className="w-6 h-6 text-terminal-green" />;
                })()}
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold text-terminal-white font-mono">
                {modules.find(m => m.id === activeTab)?.name}
              </h2>
              <p className="text-terminal-white/50 text-sm font-mono">
                {modules.find(m => m.id === activeTab)?.desc}
              </p>
            </div>
          </div>
          <Separator className="bg-void-border mt-4" />
        </div>

        {/* Module Content */}
        <div className="animate-in fade-in duration-300">
          {renderModule()}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-void-border bg-void-dark mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-xs font-mono text-terminal-white/40">
              <span>VOID-X v1.0.0</span>
              <span>|</span>
              <span>PROTOCOL: VANILLA</span>
              <span>|</span>
              <span className="text-terminal-green">{systemStatus?.timestamp ? new Date(systemStatus.timestamp).toLocaleString() : '--'}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs font-mono">
                <Lock className="w-3 h-3 text-terminal-green" />
                <span className="text-terminal-white/40">ENCRYPTED CONNECTION</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
