import type { AccessPoint } from '../../types/floorplan';
import { Power, Radio, CheckCircle2, XCircle, Users, Network } from 'lucide-react';

interface APManagerProps {
  accessPoints: AccessPoint[];
  selectedAPId: string | null;
  onSelectAP: (apId: string | null) => void;
  onUpdateAP: (apId: string, updates: Partial<AccessPoint>) => void;
  onToggleAll: (enable: boolean) => void;
}

export const APManager = ({
  accessPoints,
  selectedAPId,
  onSelectAP,
  onUpdateAP,
  onToggleAll
}: APManagerProps) => {
  const activeCount = accessPoints.filter(ap => ap.enabled).length;
  const totalClients = accessPoints.reduce((acc, ap) => acc + (ap.enabled ? ap.clientCount : 0), 0);

  return (
    <aside className="glass-panel ap-manager">
      <div className="panel-header">
        <div className="header-title">
          <Radio size={18} color="#0284c7" />
          <div>
            <h3>Ruckus AP Gedung F3</h3>
            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
              {activeCount}/{accessPoints.length} Aktif • {totalClients} Total Klien
            </span>
          </div>
        </div>
        <div className="header-actions">
          <button
            className="btn-text-action"
            onClick={() => onToggleAll(true)}
            title="Nyalakan Semua AP"
          >
            <CheckCircle2 size={13} /> All ON
          </button>
          <button
            className="btn-text-action"
            onClick={() => onToggleAll(false)}
            title="Matikan Semua AP"
          >
            <XCircle size={13} /> All OFF
          </button>
        </div>
      </div>

      <div className="ap-scroll-list">
        {accessPoints.map((ap) => {
          const isSelected = ap.id === selectedAPId;

          return (
            <div
              key={ap.id}
              className={`ap-card ${isSelected ? 'selected' : ''} ${!ap.enabled ? 'disabled' : ''}`}
              onClick={() => onSelectAP(isSelected ? null : ap.id)}
            >
              <div className="ap-card-top">
                <div className="ap-title-wrap">
                  <span className="ap-color-dot" style={{ backgroundColor: ap.enabled ? ap.color : '#94a3b8' }} />
                  <div>
                    <div className="ap-name">
                      <span>{ap.name}</span>
                      <span className="ap-model-tag">{ap.model.includes('R650') ? 'R650' : 'R510'}</span>
                    </div>
                    <div className="ap-meta-line">
                      <span className="ap-badge-channel">{ap.channelLabel}</span>
                      <span className="ap-clients-badge">
                        <Users size={11} style={{ display: 'inline', marginRight: '2px', verticalAlign: '-1px' }} />
                        {ap.clientCount} Klien
                      </span>
                      <span className={`ap-status-badge ${ap.status.toLowerCase()}`}>
                        {ap.status}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  className={`btn-power ${ap.enabled ? 'on' : 'off'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateAP(ap.id, { enabled: !ap.enabled });
                  }}
                  title={ap.enabled ? 'Matikan AP' : 'Nyalakan AP'}
                >
                  <Power size={14} />
                </button>
              </div>

              {/* Collapsible or detailed controls for selected AP */}
              {isSelected && (
                <div className="ap-card-details" onClick={(e) => e.stopPropagation()}>
                  <div className="detail-row">
                    <span className="detail-label">Model Resmi:</span>
                    <span className="detail-value">{ap.model}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">MAC Address:</span>
                    <span className="detail-value">{ap.macAddress}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">IP Address:</span>
                    <span className="detail-value">{ap.ipAddress}</span>
                  </div>

                  <div className="detail-row" style={{ marginTop: '8px' }}>
                    <span className="detail-label">Daya Pancar (TX Power):</span>
                    <span className="detail-value">{ap.txPowerDbm} dBm</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="28"
                    step="1"
                    value={ap.txPowerDbm}
                    onChange={(e) => onUpdateAP(ap.id, { txPowerDbm: Number(e.target.value) })}
                    className="slider-range"
                  />

                  <div className="detail-row" style={{ marginTop: '8px' }}>
                    <span className="detail-label">Frekuensi Aktif:</span>
                    <div className="band-toggle-pill">
                      <button
                        className={`btn-band ${ap.frequencyGhz === 5.0 ? 'active' : ''}`}
                        onClick={() => onUpdateAP(ap.id, { frequencyGhz: 5.0 })}
                      >
                        5 GHz (Ch: {ap.channel5g || 'Auto'})
                      </button>
                      <button
                        className={`btn-band ${ap.frequencyGhz === 2.4 ? 'active' : ''}`}
                        onClick={() => onUpdateAP(ap.id, { frequencyGhz: 2.4 })}
                      >
                        2.4 GHz ({ap.channel2g || 'Auto'})
                      </button>
                    </div>
                  </div>

                  <div className="ap-coords">
                    <Network size={11} style={{ display: 'inline', marginRight: '3px', verticalAlign: '-1px' }} />
                    Posisi 3D: X={ap.worldX}m, Z={ap.worldZ}m
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
};
