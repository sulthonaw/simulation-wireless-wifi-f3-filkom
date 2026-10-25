import { getSignalQuality, type SignalSample } from '../../simulation/wifiPropagation';
import { X, ShieldAlert, Layers, MapPin, Gauge, Users, Activity } from 'lucide-react';

interface SignalProbeProps {
  sample: (SignalSample & { worldX: number; worldZ: number }) | null;
  onClose: () => void;
}

export const SignalProbe = ({ sample, onClose }: SignalProbeProps) => {
  if (!sample) return null;

  const quality = getSignalQuality(sample.rssi);

  return (
    <div className="glass-panel signal-probe-card">
      {/* Header */}
      <div className="probe-header">
        <div className="probe-header-title">
          <h4>Inspeksi Sinyal Titik</h4>
        </div>
        <button className="btn-close" onClick={onClose} title="Tutup Card">
          <X size={15} />
        </button>
      </div>

      {/* Main Metric Hero */}
      <div className="probe-hero">
        <div className="probe-hero-top">
          <div className="rssi-display">
            <span className="rssi-value" style={{ color: quality.badgeColor }}>
              {sample.rssi}
            </span>
            <span className="rssi-unit">dBm</span>
          </div>
          <div
            className="quality-badge"
            style={{
              backgroundColor: `${quality.badgeColor}18`,
              borderColor: `${quality.badgeColor}40`,
              color: quality.badgeColor
            }}
          >
            {quality.label}
          </div>
        </div>

        {/* Visual signal meter */}
        <div className="probe-signal-meter">
          <div
            className="probe-signal-fill"
            style={{
              width: `${Math.max(5, Math.min(100, ((sample.rssi - (-95)) / 65) * 100))}%`,
              backgroundColor: quality.badgeColor
            }}
          />
        </div>
      </div>

      {/* Connected Best AP Box */}
      {sample.bestAP ? (
        <div className="probe-ap-box">
          <div className="ap-box-header">
            <div className="ap-box-title">
              <span className="ap-color-dot" style={{ backgroundColor: sample.bestAP.color }} />
              <span className="ap-box-name">{sample.bestAP.name}</span>
            </div>
            <span className="ap-box-tag">
              {sample.bestAP.model.includes('R650') ? 'Ruckus R650' : 'Ruckus R510'}
            </span>
          </div>
          <div className="ap-box-meta">
            <span className="meta-pill">
              <Gauge size={12} /> {sample.distanceMeters} m
            </span>
            <span className="meta-pill">
              <Users size={12} /> {sample.bestAP.clientCount} Klien
            </span>
            <span className="meta-pill">
              Ch {sample.bestAP.channel} ({sample.bestAP.frequencyGhz} GHz)
            </span>
          </div>
        </div>
      ) : (
        <div className="probe-ap-box empty">
          <span>Tidak ada sinyal Access Point terdeteksi</span>
        </div>
      )}

      {/* 2x2 Grid for Details (Prevents horizontal text collisions) */}
      <div className="probe-stats-grid">
        <div className="stat-card">
          <div className="stat-label">
            <Layers size={12} /> Tembok Ditembus
          </div>
          <div className="stat-val">
            {sample.penetratedWalls > 0 ? `${sample.penetratedWalls} Dinding` : 'LOS (Bebas)'}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            <ShieldAlert size={12} /> Tiang Beton
          </div>
          <div className={`stat-val ${sample.penetratedPillars > 0 ? 'text-warn' : ''}`}>
            {sample.penetratedPillars > 0 ? (
              `${sample.penetratedPillars} Tiang (-${sample.penetratedPillars * 14}dB)`
            ) : (
              '0 Tiang'
            )}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            <Activity size={12} /> Estimasi SNR
          </div>
          <div className="stat-val font-mono">
            {sample.snr} dB
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            <MapPin size={12} /> Koordinat 3D
          </div>
          <div className="stat-val font-mono">
            X={sample.worldX.toFixed(1)}, Z={sample.worldZ.toFixed(1)}m
          </div>
        </div>
      </div>
    </div>
  );
};
