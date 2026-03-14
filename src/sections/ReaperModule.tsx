/**
 * MODULE 1: THE REAPER DOWNLOADER
 * Media Downloader using yt-dlp
 */

import { useState } from 'react';
import { 
  Download, 
  Link, 
  FileVideo, 
  Music, 
  Film, 
  CheckCircle, 
  AlertTriangle,
  Loader2,
  ExternalLink,
  Clock,
  User,
  Eye,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface VideoInfo {
  title: string;
  description: string;
  duration: number;
  uploader: string;
  uploadDate: string;
  viewCount: number;
  likeCount: number;
  thumbnail: string;
  formats: Array<{
    formatId: string;
    ext: string;
    quality: string;
    filesize: number;
    vcodec: string;
    acodec: string;
  }>;
}

interface DownloadResult {
  success: boolean;
  filename: string;
  title: string;
  duration: number;
  uploader: string;
  size: number;
  downloadUrl: string;
  expiresAt: string;
}

export default function ReaperModule() {
  const [url, setUrl] = useState('');
  const [format, setFormat] = useState('video');
  const [quality, setQuality] = useState('1080');
  const [loading, setLoading] = useState(false);
  const [fetchingInfo, setFetchingInfo] = useState(false);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [downloadResult, setDownloadResult] = useState<DownloadResult | null>(null);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);

  const supportedPlatforms = [
    'YouTube', 'Facebook', 'Twitter/X', 'Instagram', 'TikTok',
    'Reddit', 'Vimeo', 'Dailymotion', 'Twitch', 'SoundCloud', 'Bilibili'
  ];

  const fetchVideoInfo = async () => {
    if (!url) {
      setError('Please enter a URL');
      return;
    }

    setFetchingInfo(true);
    setError('');
    setVideoInfo(null);

    try {
      const response = await fetch('/api/reaper/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch video info');
      }

      setVideoInfo(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setFetchingInfo(false);
    }
  };

  const handleDownload = async () => {
    if (!url) {
      setError('Please enter a URL');
      return;
    }

    setLoading(true);
    setError('');
    setDownloadResult(null);
    setProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 1000);

    try {
      const response = await fetch('/api/reaper/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, format, quality })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Download failed');
      }

      setProgress(100);
      setDownloadResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      clearInterval(progressInterval);
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return 'Unknown';
    const mb = bytes / (1024 * 1024);
    if (mb < 1) return `${(bytes / 1024).toFixed(1)} KB`;
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(1)} GB`;
  };

  return (
    <div className="space-y-6">
      {/* Info Alert */}
      <Alert className="cyber-alert cyber-alert-info border-terminal-cyan">
        <Download className="w-4 h-4 text-terminal-cyan" />
        <AlertDescription className="text-terminal-cyan font-mono text-sm">
          The Reaper supports: {supportedPlatforms.join(', ')}
        </AlertDescription>
      </Alert>

      {/* URL Input */}
      <div className="cyber-card">
        <Label className="text-terminal-green font-mono text-sm mb-2 block">
          TARGET URL
        </Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-terminal-green/50" />
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="cyber-input pl-10"
            />
          </div>
          <Button
            onClick={fetchVideoInfo}
            disabled={fetchingInfo || !url}
            className="cyber-btn"
          >
            {fetchingInfo ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <FileVideo className="w-4 h-4 mr-2" />
                FETCH INFO
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Video Info Display */}
      {videoInfo && (
        <div className="cyber-card cyber-card-active animate-in fade-in slide-in-from-top-2">
          <div className="flex flex-col md:flex-row gap-4">
            {videoInfo.thumbnail && (
              <div className="w-full md:w-48 flex-shrink-0">
                <img
                  src={videoInfo.thumbnail}
                  alt={videoInfo.title}
                  className="w-full rounded border border-void-border"
                />
              </div>
            )}
            <div className="flex-1 space-y-2">
              <h3 className="text-terminal-white font-bold text-lg">{videoInfo.title}</h3>
              <p className="text-terminal-white/60 text-sm line-clamp-2">{videoInfo.description}</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                <div className="flex items-center gap-2 text-xs font-mono">
                  <Clock className="w-3 h-3 text-terminal-green" />
                  <span className="text-terminal-white/60">{formatDuration(videoInfo.duration)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <User className="w-3 h-3 text-terminal-green" />
                  <span className="text-terminal-white/60 truncate">{videoInfo.uploader}</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <Eye className="w-3 h-3 text-terminal-green" />
                  <span className="text-terminal-white/60">{videoInfo.viewCount?.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <Calendar className="w-3 h-3 text-terminal-green" />
                  <span className="text-terminal-white/60">{videoInfo.uploadDate}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Format Selection */}
      <div className="cyber-card">
        <Label className="text-terminal-green font-mono text-sm mb-4 block">
          OUTPUT FORMAT
        </Label>
        <RadioGroup value={format} onValueChange={setFormat} className="flex gap-4">
          <div className={`flex items-center space-x-2 p-4 border rounded cursor-pointer transition-all ${
            format === 'video' ? 'border-terminal-green bg-terminal-green/10' : 'border-void-border'
          }`}>
            <RadioGroupItem value="video" id="video" className="border-terminal-green text-terminal-green" />
            <Label htmlFor="video" className="cursor-pointer flex items-center gap-2">
              <Film className="w-4 h-4 text-terminal-green" />
              <span className="text-terminal-white font-mono text-sm">VIDEO</span>
            </Label>
          </div>
          <div className={`flex items-center space-x-2 p-4 border rounded cursor-pointer transition-all ${
            format === 'audio' ? 'border-terminal-green bg-terminal-green/10' : 'border-void-border'
          }`}>
            <RadioGroupItem value="audio" id="audio" className="border-terminal-green text-terminal-green" />
            <Label htmlFor="audio" className="cursor-pointer flex items-center gap-2">
              <Music className="w-4 h-4 text-terminal-green" />
              <span className="text-terminal-white font-mono text-sm">AUDIO ONLY</span>
            </Label>
          </div>
        </RadioGroup>

        {format === 'video' && (
          <div className="mt-4">
            <Label className="text-terminal-white/60 font-mono text-xs mb-2 block">
              QUALITY
            </Label>
            <Select value={quality} onValueChange={setQuality}>
              <SelectTrigger className="cyber-input w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-void-dark border-void-border">
                <SelectItem value="2160">4K (2160p)</SelectItem>
                <SelectItem value="1440">2K (1440p)</SelectItem>
                <SelectItem value="1080">Full HD (1080p)</SelectItem>
                <SelectItem value="720">HD (720p)</SelectItem>
                <SelectItem value="480">SD (480p)</SelectItem>
                <SelectItem value="360">Low (360p)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Download Button */}
      <Button
        onClick={handleDownload}
        disabled={loading || !url}
        className="w-full cyber-btn py-4 text-base"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            DOWNLOADING...
          </>
        ) : (
          <>
            <Download className="w-5 h-5 mr-2" />
            INITIATE DOWNLOAD
          </>
        )}
      </Button>

      {/* Progress */}
      {loading && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-terminal-green">DOWNLOADING...</span>
            <span className="text-terminal-green">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="cyber-progress" />
        </div>
      )}

      {/* Error */}
      {error && (
        <Alert className="cyber-alert cyber-alert-danger">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Download Result */}
      {downloadResult && (
        <div className="cyber-card cyber-card-active animate-in fade-in">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-terminal-green" />
            <span className="text-terminal-green font-bold font-mono">DOWNLOAD COMPLETE</span>
          </div>
          
          <div className="space-y-3 font-mono text-sm">
            <div className="flex justify-between">
              <span className="text-terminal-white/60">Filename:</span>
              <span className="text-terminal-white">{downloadResult.filename}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-terminal-white/60">Title:</span>
              <span className="text-terminal-white">{downloadResult.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-terminal-white/60">Size:</span>
              <span className="text-terminal-green">{formatFileSize(downloadResult.size)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-terminal-white/60">Duration:</span>
              <span className="text-terminal-white">{formatDuration(downloadResult.duration)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-terminal-white/60">Expires:</span>
              <span className="text-terminal-yellow">{new Date(downloadResult.expiresAt).toLocaleString()}</span>
            </div>
          </div>

          <Separator className="bg-void-border my-4" />

          <a
            href={downloadResult.downloadUrl}
            download
            className="cyber-btn w-full flex items-center justify-center"
          >
            <Download className="w-4 h-4 mr-2" />
            DOWNLOAD FILE
          </a>
        </div>
      )}
    </div>
  );
}
