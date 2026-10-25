import type { SimulationConfig } from '../../types/floorplan';
import { Eye, EyeOff, Radio, Shield, Waves, MapPin, Activity, DoorOpen } from 'lucide-react';

interface LayerControlsProps {
  config: SimulationConfig;
  onChangeConfig: (updates: Partial<SimulationConfig>) => void;
}

export const LayerControls = ({ config, onChangeConfig }: LayerControlsProps) => {
  return (
    <aside className="glass-panel layer-controls">
      <div className="panel-header">
        <Activity size={18} color="#0284c7" />
        <h3>Lapisan Simulasi (Layers)</h3>
      </div>

      <div className="layers-list">
        {/* Heatmap Toggle */}
        <div className="layer-item">
          <div className="layer-info">
            <Radio size={16} color="#0284c7" />
            <span>Heatmap Sinyal Wi-Fi</span>
          </div>
          <button
            className={`btn-toggle ${config.showHeatmap ? 'on' : 'off'}`}
            onClick={() => onChangeConfig({ showHeatmap: !config.showHeatmap })}
          >
            {config.showHeatmap ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
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
          <button
            className={`btn-toggle ${config.showWaves ? 'on' : 'off'}`}
            onClick={() => onChangeConfig({ showWaves: !config.showWaves })}
          >
            {config.showWaves ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
        </div>

        {/* Concrete Pillars Toggle */}
        <div className="layer-item">
          <div className="layer-info">
            <Shield size={16} color="#64748b" />
            <span>Tiang Beton (Columns)</span>
          </div>
          <button
            className={`btn-toggle ${config.showPillars ? 'on' : 'off'}`}
            onClick={() => onChangeConfig({ showPillars: !config.showPillars })}
          >
            {config.showPillars ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
        </div>

        {/* Walls Toggle */}
        <div className="layer-item">
          <div className="layer-info">
            <span className="wall-icon-box"></span>
            <span>Dinding / Tembok</span>
          </div>
          <button
            className={`btn-toggle ${config.showWalls ? 'on' : 'off'}`}
            onClick={() => onChangeConfig({ showWalls: !config.showWalls })}
          >
            {config.showWalls ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
        </div>

        {/* Doors & Openings Toggle */}
        <div className="layer-item">
          <div className="layer-info">
            <DoorOpen size={16} color="#0284c7" />
            <span>Pintu & Bukaan 3D</span>
          </div>
          <button
            className={`btn-toggle ${config.showDoors ? 'on' : 'off'}`}
            onClick={() => onChangeConfig({ showDoors: !config.showDoors })}
          >
            {config.showDoors ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
        </div>

        {/* Room Labels Toggle */}
        <div className="layer-item">
          <div className="layer-info">
            <MapPin size={16} color="#f59e0b" />
            <span>Nama & Level Ruangan</span>
          </div>
          <button
            className={`btn-toggle ${config.showLabels ? 'on' : 'off'}`}
            onClick={() => onChangeConfig({ showLabels: !config.showLabels })}
          >
            {config.showLabels ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
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
            5.0 GHz (Modern / Fast)
          </button>
          <button
            className={`btn-freq ${config.freqMhz === 2400 ? 'active' : ''}`}
            onClick={() => onChangeConfig({ freqMhz: 2400 })}
          >
            2.4 GHz (Jangkauan Luas)
          </button>
        </div>
      </div>
    </aside>
  );
};
