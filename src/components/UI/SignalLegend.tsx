import { Wifi } from 'lucide-react';

export const SignalLegend = () => {
  return (
    <div className="glass-panel signal-legend" title="Kekuatan Sinyal Wi-Fi (Klik di lantai 3D untuk inspeksi sinyal spesifik)">
      <div className="legend-label">
        <Wifi size={13} color="#0284c7" />
        <span>Sinyal:</span>
      </div>

      <div className="legend-scale">
        <span className="scale-val">-90 dBm</span>
        <div className="gradient-bar" />
        <span className="scale-val">-30 dBm</span>
      </div>
    </div>
  );
};
