import { useState } from 'react';

const LEVEL_CONFIG = {
  safe:     { color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: 'Safe',     emoji: '🟢', border: '#10b981' },
  warning:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'Warning',  emoji: '🟡', border: '#f59e0b' },
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  label: 'Cheating', emoji: '🔴', border: '#ef4444' },
};

export default function ProctoringOverlay({ violations, violationCount, level, proctorReady, lastViolation, videoRef, detectionStats }) {
  const cfg = LEVEL_CONFIG[level] || LEVEL_CONFIG.safe;
  const { face } = detectionStats || { face: false };

  return (
    <>
      {/* ── Floating Live Camera Feed (ALWAYS visible) ── */}
      <div style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        width: '220px',
        height: '170px',
        zIndex: 2147483647,
        borderRadius: '16px',
        overflow: 'hidden',
        background: '#0f172a',
        border: `3px solid ${cfg.border}`,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}>
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          onPlay={() => console.log('[PROCTOR] Camera feed started.')}
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover',
            transform: 'scaleX(-1)',
            background: '#0f172a',
          }}
        />
        
        {/* Loading spinner when camera not ready */}
        {!proctorReady && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: '8px', background: '#0f172a', color: '#94a3b8'
          }}>
            <span className="spinner" style={{ width: '24px', height: '24px', border: '3px solid #334155', borderTopColor: '#6366f1' }} />
            <span style={{ fontSize: '11px', fontWeight: 600 }}>Starting Camera...</span>
          </div>
        )}

        {/* LIVE badge */}
        <div style={{
          position: 'absolute',
          top: '8px',
          left: '8px',
          padding: '2px 8px',
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          pointerEvents: 'none'
        }}>
          <span style={{ 
            width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444',
            animation: 'pulse 1s infinite'
          }} />
          <span style={{ fontSize: '10px', fontWeight: 700, color: 'white', letterSpacing: '0.5px' }}>LIVE</span>
        </div>

        {/* Violation count badge */}
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          padding: '2px 10px',
          background: cfg.border,
          borderRadius: '12px',
          pointerEvents: 'none'
        }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: 'white' }}>
            {cfg.emoji} {violationCount}
          </span>
        </div>
        
        {/* Bottom status */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '4px 8px',
          background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
          color: 'white',
          fontSize: '10px',
          fontWeight: 600,
          pointerEvents: 'none'
        }}>
          {proctorReady ? (face ? '👤 Face Detected' : '⚠️ No Face') : '⏳ Initializing...'}
        </div>
      </div>

      {/* ── Live Violation Popup Alert (bottom-right, above camera) ── */}
      {lastViolation && (
        <div style={{
          position: 'fixed',
          bottom: '210px',
          right: '24px',
          zIndex: 2147483647,
          background: '#1a1d2e',
          border: `2px solid ${cfg.border}`,
          borderRadius: '12px',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          maxWidth: '280px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          animation: 'slideInUp 0.3s ease-out',
        }}>
          <span style={{ fontSize: '18px' }}>{lastViolation.icon}</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '12px', color: cfg.color }}>
              ⚠️ Violation
            </div>
            <div style={{ fontSize: '11px', color: '#e8eaf0', marginTop: '2px' }}>
              {lastViolation.label}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes slideInUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </>
  );
}
