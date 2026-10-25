import { Wifi, Info } from 'lucide-react';

export const SignalLegend = () => {
  return (
    <div className="glass-panel signal-legend">
      <div className="legend-title">
        <Wifi size={14} color="#0284c7" />
        <span>Kekuatan Sinyal Wi-Fi (RSSI dBm)</span>
      </div>

      <div className="gradient-bar-wrapper">
        <div className="gradient-bar" />
        <div className="gradient-labels">
          <span>-90 dBm (Mati)</span>
          <span>-75 dBm (Cukup)</span>
          <span>-60 dBm (Baik)</span>
          <span>-30 dBm (Sangat Kuat)</span>
        </div>
      </div>

      <div className="legend-hint">
        <Info size={12} />
        <span>Tips: Klik di area lantai gedung mana saja untuk mengetes kekuatan sinyal spesifik.</span>
      </div>
    </div>
  );
};
