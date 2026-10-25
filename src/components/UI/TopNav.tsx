import type { SimulationConfig } from '../../types/floorplan';
import { Box, Compass, Layers, Sliders, Wifi } from 'lucide-react';

interface TopNavProps {
  config: SimulationConfig;
  onChangeConfig: (updates: Partial<SimulationConfig>) => void;
  onResetCamera: () => void;
}

export const TopNav = ({ config, onChangeConfig, onResetCamera }: TopNavProps) => {
  return (
    <header className="glass-panel top-nav">
      <div className="nav-brand">
        <div className="brand-icon">
          <Wifi className="icon-pulse" size={22} color="#0284c7" />
        </div>
        <div className="brand-text">
          <h1>SIMULASI WIRELESS F3 <span className="badge-3d">CLEAN 3D</span></h1>
          <p>Lantai 3 Sayap Barat (+11.00) & Sayap Timur (+12.00) • 10 Ruckus APs (Filkom)</p>
        </div>
      </div>

      {/* Center View Controls */}
      <div className="nav-center-controls">
        <div className="mode-segmented-control">
          <button
            className={`btn-segment ${config.viewMode === '3d-sims' ? 'active' : ''}`}
            onClick={() => onChangeConfig({ viewMode: '3d-sims', wallHeightPercent: 35, cameraAngle: 'iso-nw' })}
            title="Tampilan 3D Bergaya The Sims (Tembok Cutaway)"
          >
            <Box size={16} />
            <span>3D The Sims</span>
          </button>
          <button
            className={`btn-segment ${config.viewMode === '2d-blueprint' ? 'active' : ''}`}
            onClick={() => onChangeConfig({ viewMode: '2d-blueprint', wallHeightPercent: 0, cameraAngle: 'top' })}
            title="Tampilan 2D Blueprint Denah Asli"
          >
            <Layers size={16} />
            <span>2D Blueprint</span>
          </button>
        </div>

        {/* Sims Cutaway Slider */}
        {config.viewMode === '3d-sims' && (
          <div className="cutaway-control">
            <span className="control-label">
              <Sliders size={14} /> Potongan Dinding: <b>{config.wallHeightPercent}%</b>
            </span>
            <input
              type="range"
              min="5"
              max="100"
              step="5"
              value={config.wallHeightPercent}
              onChange={(e) => onChangeConfig({ wallHeightPercent: Number(e.target.value) })}
              className="slider-range"
              title="Sesuaikan ketinggian tembok cutaway ala The Sims"
            />
          </div>
        )}
      </div>

      {/* Right Presets */}
      <div className="nav-right-controls">
        <div className="camera-presets">
          <span className="preset-label"><Compass size={14} /> Sudut Kamera:</span>
          <button
            className={`btn-camera-preset ${config.cameraAngle === 'iso-nw' ? 'active' : ''}`}
            onClick={() => onChangeConfig({ cameraAngle: 'iso-nw', viewMode: '3d-sims' })}
            title="Isometrik Barat Laut"
          >
            NW
          </button>
          <button
            className={`btn-camera-preset ${config.cameraAngle === 'iso-ne' ? 'active' : ''}`}
            onClick={() => onChangeConfig({ cameraAngle: 'iso-ne', viewMode: '3d-sims' })}
            title="Isometrik Timur Laut"
          >
            NE
          </button>
          <button
            className={`btn-camera-preset ${config.cameraAngle === 'iso-se' ? 'active' : ''}`}
            onClick={() => onChangeConfig({ cameraAngle: 'iso-se', viewMode: '3d-sims' })}
            title="Isometrik Tenggara"
          >
            SE
          </button>
          <button
            className={`btn-camera-preset ${config.cameraAngle === 'iso-sw' ? 'active' : ''}`}
            onClick={() => onChangeConfig({ cameraAngle: 'iso-sw', viewMode: '3d-sims' })}
            title="Isometrik Barat Daya"
          >
            SW
          </button>
          <button
            className="btn-camera-preset"
            onClick={onResetCamera}
            title="Reset Posisi Kamera"
          >
            Reset
          </button>
        </div>
      </div>
    </header>
  );
};
