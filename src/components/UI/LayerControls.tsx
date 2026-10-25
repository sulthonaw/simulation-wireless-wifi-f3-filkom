import type { SimulationConfig } from '../../types/floorplan';
import { Radio, Shield, Waves, MapPin, Activity, DoorOpen, ChevronLeft } from 'lucide-react';

interface LayerControlsProps {
  config: SimulationConfig;
  onChangeConfig: (updates: Partial<SimulationConfig>) => void;
  isOpen: boolean;
  onToggleCollapse: () => void;
}

export const LayerControls = ({ config, onChangeConfig, isOpen, onToggleCollapse }: LayerControlsProps) => {
  return (
    <aside className={`glass-panel layer-controls ${isOpen ? 'open' : 'collapsed'}`}>
      <div className="panel-header">
        <div className="panel-header-title">
          <Activity size={18} color="#0284c7" />
          <h3>Lapisan Simulasi</h3>
        </div>
        <button
          className="btn-collapse-panel"
          onClick={onToggleCollapse}
          title="Sembunyikan Panel Lapisan"
        >
          <ChevronLeft size={16} />
        </button>
      </div>

      <div className="layers-list">
        {/* Heatmap Toggle */}
        <div className="layer-item">
          <div className="layer-info">
            <Radio size={16} color="#0284c7" />
            <span>Heatmap Sinyal Wi-Fi</span>
          </div>
          <label className="switch-toggle" title="Nyalakan/Matikan Heatmap Sinyal">
            <input
              type="checkbox"
              checked={config.showHeatmap}
              onChange={(e) => onChangeConfig({ showHeatmap: e.target.checked })}
            />
            <span className="switch-slider" />
          </label>
        </div>

        {/* Heatmap Opacity Slider */}
        {config.showHeatmap && (
          <div className="layer-sub-control">
            <span className="sub-label">Transparansi Heatmap: {Math.round(config.heatmapOpacity * 100)}%</span>
            <input
              type="range"
              min="0.2"
              max="1.0"
              step="0.05"
              value={config.heatmapOpacity}
              onChange={(e) => onChangeConfig({ heatmapOpacity: Number(e.target.value) })}
              className="slider-range"
            />
          </div>
        )}

        {/* Radio Waves Animation Toggle */}
        <div className="layer-item">
          <div className="layer-info">
            <Waves size={16} color="#10b981" />
            <span>Pancaran Gelombang AP</span>
          </div>
          <label className="switch-toggle" title="Nyalakan/Matikan Animasi Gelombang">
            <input
              type="checkbox"
              checked={config.showWaves}
              onChange={(e) => onChangeConfig({ showWaves: e.target.checked })}
            />
            <span className="switch-slider" />
          </label>
        </div>

        {/* Concrete Pillars Toggle */}
        <div className="layer-item">
          <div className="layer-info">
            <Shield size={16} color="#64748b" />
            <span>Tiang Beton (Columns)</span>
          </div>
          <label className="switch-toggle" title="Tampilkan/Sembunyikan Tiang Beton">
            <input
              type="checkbox"
              checked={config.showPillars}
              onChange={(e) => onChangeConfig({ showPillars: e.target.checked })}
            />
            <span className="switch-slider" />
          </label>
        </div>

        {/* Walls Toggle */}
        <div className="layer-item">
          <div className="layer-info">
            <span className="wall-icon-box"></span>
            <span>Dinding / Tembok</span>
          </div>
          <label className="switch-toggle" title="Tampilkan/Sembunyikan Dinding">
            <input
              type="checkbox"
              checked={config.showWalls}
              onChange={(e) => onChangeConfig({ showWalls: e.target.checked })}
            />
            <span className="switch-slider" />
          </label>
        </div>

        {/* Doors & Openings Toggle */}
        <div className="layer-item">
          <div className="layer-info">
            <DoorOpen size={16} color="#0284c7" />
            <span>Pintu & Bukaan 3D</span>
          </div>
          <label className="switch-toggle" title="Tampilkan/Sembunyikan Pintu">
            <input
              type="checkbox"
              checked={config.showDoors}
              onChange={(e) => onChangeConfig({ showDoors: e.target.checked })}
            />
            <span className="switch-slider" />
          </label>
        </div>

        {/* Room Labels Toggle */}
        <div className="layer-item">
          <div className="layer-info">
            <MapPin size={16} color="#f59e0b" />
            <span>Nama & Level Ruangan</span>
          </div>
          <label className="switch-toggle" title="Tampilkan/Sembunyikan Label Ruangan">
            <input
              type="checkbox"
              checked={config.showLabels}
              onChange={(e) => onChangeConfig({ showLabels: e.target.checked })}
            />
            <span className="switch-slider" />
          </label>
        </div>
      </div>

      {/* Frequency Band Selector */}
      <div className="freq-selector">
        <label className="section-title">Frekuensi Propagasi RF:</label>
        <div className="freq-buttons">
          <button
            className={`btn-freq ${config.freqMhz === 5200 ? 'active' : ''}`}
            onClick={() => onChangeConfig({ freqMhz: 5200 })}
          >
            5.0 GHz (Cepat)
          </button>
          <button
            className={`btn-freq ${config.freqMhz === 2400 ? 'active' : ''}`}
            onClick={() => onChangeConfig({ freqMhz: 2400 })}
          >
            2.4 GHz (Luas)
          </button>
        </div>
      </div>
    </aside>
  );
};
