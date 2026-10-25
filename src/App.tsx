import { useState } from 'react';
import './App.css';
import {
  INITIAL_ACCESS_POINTS,
  WALL_SEGMENTS,
  CONCRETE_PILLARS,
  ROOM_ZONES,
  DOOR_ITEMS,
  FACILITY_FIXTURES
} from './data/floorplanData';
import type { AccessPoint, SimulationConfig } from './types/floorplan';
import type { SignalSample } from './simulation/wifiPropagation';
import { ThreeCanvas } from './components/ThreeCanvas';
import { TopNav } from './components/UI/TopNav';
import { LayerControls } from './components/UI/LayerControls';
import { APManager } from './components/UI/APManager';
import { SignalLegend } from './components/UI/SignalLegend';
import { SignalProbe } from './components/UI/SignalProbe';

export function App() {
  const [accessPoints, setAccessPoints] = useState<AccessPoint[]>(INITIAL_ACCESS_POINTS);
  const [walls] = useState(WALL_SEGMENTS);
  const [pillars] = useState(CONCRETE_PILLARS);
  const [rooms] = useState(ROOM_ZONES);
  const [doors] = useState(DOOR_ITEMS);
  const [fixtures] = useState(FACILITY_FIXTURES);

  const [config, setConfig] = useState<SimulationConfig>({
    freqMhz: 5200,
    gridResolution: 140,
    showHeatmap: true,
    showWaves: true,
    showPillars: true,
    showWalls: true,
    showLabels: true,
    showDoors: true,
    wallHeightPercent: 35, // Default to The Sims cutaway style!
    viewMode: '3d-sims',
    cameraAngle: 'iso-nw',
    selectedAPId: null,
    heatmapOpacity: 0.75,
    colorMap: 'standard'
  });

  const [inspectedSignal, setInspectedSignal] = useState<
    (SignalSample & { worldX: number; worldZ: number }) | null
  >(null);

  const handleUpdateConfig = (updates: Partial<SimulationConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  const handleSelectAP = (apId: string | null) => {
    handleUpdateConfig({ selectedAPId: apId });
  };

  const handleUpdateAP = (apId: string, updates: Partial<AccessPoint>) => {
    setAccessPoints((prev) =>
      prev.map((ap) => (ap.id === apId ? { ...ap, ...updates } : ap))
    );
  };

  const handleToggleAllAPs = (enable: boolean) => {
    setAccessPoints((prev) => prev.map((ap) => ({ ...ap, enabled: enable })));
  };

  const handleResetCamera = () => {
    handleUpdateConfig({ cameraAngle: 'iso-nw', viewMode: '3d-sims' });
  };

  return (
    <div className="app-container">
      {/* 3D WebGL Viewport */}
      <div className="canvas-viewport">
        <ThreeCanvas
          accessPoints={accessPoints}
          walls={walls}
          pillars={pillars}
          rooms={rooms}
          doors={doors}
          fixtures={fixtures}
          config={config}
          onSelectAP={handleSelectAP}
          onInspectSignal={(sample) => setInspectedSignal(sample)}
        />
      </div>

      {/* Top Navigation HUD */}
      <TopNav
        config={config}
        onChangeConfig={handleUpdateConfig}
        onResetCamera={handleResetCamera}
      />

      {/* Left Layer Controls */}
      <LayerControls
        config={config}
        onChangeConfig={handleUpdateConfig}
      />

      {/* Right AP List & Manager */}
      <APManager
        accessPoints={accessPoints}
        selectedAPId={config.selectedAPId}
        onSelectAP={handleSelectAP}
        onUpdateAP={handleUpdateAP}
        onToggleAll={handleToggleAllAPs}
      />

      {/* Bottom Signal Color Scale Legend */}
      <SignalLegend />

      {/* Floor Point Signal Inspector Modal / Card */}
      <SignalProbe
        sample={inspectedSignal}
        onClose={() => setInspectedSignal(null)}
      />
    </div>
  );
}

export default App;
