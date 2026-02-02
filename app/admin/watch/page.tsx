/**
 * Admin Watch page: displays a tutorial video from public/video folder
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { Play, Pause, Volume2, VolumeX, Maximize, ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/branding';

export default function AdminWatchPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);
    const handleEnded = () => setIsPlaying(false);

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch(() => setError('Failed to play video. Please check the file.'));
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const newTime = (parseFloat(e.target.value) / 100) * duration;
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="min-h-screen bg-background-secondary dark:bg-background-tertiary">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="bg-card rounded-lg p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-4">
            <Link href="/admin" className="p-2 text-text-secondary hover:text-foreground transition-colors rounded-md hover:bg-accent/5">
              <ArrowLeft className="w-5 h-5" />
            </Link>

            <Logo href="/admin" size="md" className="shrink-0" />

            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-2xl md:text-3xl font-extrabold text-foreground leading-tight truncate">
                How to Use the Admin Dashboard
              </h1>
              <p className="text-sm text-text-secondary mt-1 truncate">
                Watch a quick tutorial to get started — tips, navigation and common tasks.
              </p>
            </div>

            <div className="hidden sm:flex items-center gap-3">
              <Link href="/admin/guide" className="text-sm text-foreground/80 hover:text-foreground transition-colors">
                View Guide
              </Link>
            </div>
          </div>
        </div>

        {/* Video Container */}
        <div className="bg-card rounded-lg shadow-lg overflow-hidden">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <div className="relative bg-black aspect-video">
            <video
              ref={videoRef}
              className="w-full h-full"
              src="/video/admin-tutorial.mp4"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onError={() => setError('Video failed to load. Please ensure /video/admin-tutorial.mp4 exists.')}
            >
              Your browser does not support the video tag.
            </video>

            {/* Custom Controls Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent p-4">
              {/* Progress Bar */}
              <div className="mb-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progressPercent}
                  onChange={handleSeek}
                  className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, white ${progressPercent}%, rgba(255,255,255,0.3) ${progressPercent}%)`,
                  }}
                />
                <div className="flex justify-between text-xs text-white/80 mt-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={togglePlay}
                    className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors text-white"
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={toggleMute}
                    className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors text-white"
                    aria-label={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                </div>

                <button
                  onClick={() => videoRef.current?.requestFullscreen()}
                  className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors text-white"
                  aria-label="Fullscreen"
                >
                  <Maximize className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-6 sm:mt-8 bg-card rounded-lg shadow-lg p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-foreground mb-3">Tutorial Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-text-secondary">
            <div className="bg-background rounded-md p-3 transition-shadow hover:shadow-md hover:-translate-y-0.5 transform">
              <h3 className="font-medium text-foreground mb-1">Dashboard Navigation</h3>
              <p>Learn to navigate the admin dashboard and understand the layout.</p>
            </div>
            <div className="bg-background rounded-md p-3 transition-shadow hover:shadow-md hover:-translate-y-0.5 transform">
              <h3 className="font-medium text-foreground mb-1">Managing Products</h3>
              <p>Add, edit, and organize products with categories and pricing.</p>
            </div>
            <div className="bg-background rounded-md p-3 transition-shadow hover:shadow-md hover:-translate-y-0.5 transform">
              <h3 className="font-medium text-foreground mb-1">Orders & Payments</h3>
              <p>Track orders, manage payments, and handle customer transactions.</p>
            </div>
            <div className="bg-background rounded-md p-3 transition-shadow hover:shadow-md hover:-translate-y-0.5 transform">
              <h3 className="font-medium text-foreground mb-1">Customer Management</h3>
              <p>View customer profiles, manage accounts, and support requests.</p>
            </div>
            <div className="bg-background rounded-md p-3 transition-shadow hover:shadow-md hover:-translate-y-0.5 transform">
              <h3 className="font-medium text-foreground mb-1">Analytics & Reports</h3>
              <p>Monitor sales, view reports, and gain insights into your business.</p>
            </div>
            <div className="bg-background rounded-md p-3 transition-shadow hover:shadow-md hover:-translate-y-0.5 transform">
              <h3 className="font-medium text-foreground mb-1">Settings & Configuration</h3>
              <p>Configure store settings, payment methods, and business details.</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Link href="/admin/guide" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto">
              View Written Guide
            </Button>
          </Link>
          <Link href="/admin" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto">
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          background: white;
          border-radius: 50%;
          cursor: pointer;
        }
        .slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          background: white;
          border-radius: 50%;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
}
