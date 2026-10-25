import { getSignalQuality, type SignalSample } from '../../simulation/wifiPropagation';
import { Wifi, X, ShieldAlert, Layers, MapPin, Gauge } from 'lucide-react';

interface SignalProbeProps {
  sample: (SignalSample & { worldX: number; worldZ: number }) | null;
  onClose: () => void;
}

export const SignalProbe = ({ sample, onClose }: SignalProbeProps) => {
  if (!sample) return null;

  const quality = getSignalQuality(sample.rssi);

  return (
    <div className="glass-panel signal-probe-card">
      <div className="probe-header">
        <div className="probe-header-title">
          <Wifi size={18} color={quality.badgeColor} />
          <h4>Inspeksi Sinyal Titik Lantai</h4>
        </div>
        <button className="btn-close" onClick={onClose}>
          <X size={16} />
        </button>
      </div>

      <div className="probe-main-metric">
        <div className="rssi-display">
          <span className="rssi-value" style={{ color: quality.badgeColor }}>
            {sample.rssi}
          </span>
          <span className="rssi-unit">dBm</span>
        </div>
        <div
          className="quality-badge"
          style={{
            backgroundColor: `${quality.badgeColor}22`,
            borderColor: quality.badgeColor,
            color: quality.badgeColor
          }}
        >
          {quality.label}
        </div>
      </div>

      <div className="probe-details-grid">
        <div className="detail-item">
          <span className="item-label">
            <Wifi size={13} /> Access Point Terbaik:
          </span>
          <span className="item-val font-semibold">
            {sample.bestAP ? `${sample.bestAP.name}` : 'Tidak Ada'}
          </span>
        </div>

        {sample.bestAP && (
          <div className="detail-item">
            <span className="item-label">Model & Beban Klien:</span>
            <span className="item-val font-semibold" style={{ color: '#0284c7' }}>
              {sample.bestAP.model} • {sample.bestAP.clientCount} Klien Aktif
            </span>
          </div>
        )}

        <div className="detail-item">
          <span className="item-label">
            <Gauge size={13} /> Jarak ke AP:
          </span>
          <span className="item-val">{sample.distanceMeters} meter</span>
        </div>

        <div className="detail-item">
          <span className="item-label">
            <Layers size={13} /> Redaman Tembok Ditembus:
          </span>
          <span className="item-val">
            {sample.penetratedWalls > 0 ? `${sample.penetratedWalls} Dinding` : 'Bebas Hambatan (LOS)'}
          </span>
        </div>

        <div className="detail-item">
          <span className="item-label">
            <ShieldAlert size={13} /> Tiang Beton Ditembus:
          </span>
          <span className="item-val">
            {sample.penetratedPillars > 0 ? (
              <span className="text-warning">{sample.penetratedPillars} Tiang Beton (-{sample.penetratedPillars * 14} dB)</span>
            ) : (
              '0 Tiang'
            )}
          </span>
        </div>

        <div className="detail-item">
          <span className="item-label">
            <MapPin size={13} /> Koordinat Titik 3D:
          </span>
          <span className="item-val">
            X = {sample.worldX.toFixed(1)}m, Z = {sample.worldZ.toFixed(1)}m
          </span>
        </div>

        <div className="detail-item">
          <span className="item-label">Estimasi SNR:</span>
          <span className="item-val">{sample.snr} dB</span>
        </div>
      </div>
    </div>
  );
};
