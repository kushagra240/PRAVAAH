import React, { useState, useEffect } from 'react';
import StatePresetsBar from './components/StatePresetsBar';
import Header from './components/Header';
import TelemetryBar from './components/TelemetryBar';
import ImpactBanner from './components/ImpactBanner';
import LeftNavPanel from './components/LeftNavPanel';
import MapView from './components/MapView';
import ContextInspectorPanel from './components/ContextInspectorPanel';
import BottomAnalysisStrip from './components/BottomAnalysisStrip';
import TimelineBar from './components/TimelineBar';
import EvidenceModal from './components/EvidenceModal';
import AdvisoryModal from './components/AdvisoryModal';

export default function App() {
  // 10 Prompt-Required States Preset Index (Default = 1)
  const [currentState, setCurrentState] = useState(1);
  const [activeNav, setActiveNav] = useState('map');
  const [timeStepHours, setTimeStepHours] = useState(-6); // Landfall is 0

  // Check URL query param for dev/demo harness flag (?demo=true)
  const isDemoHarness = typeof window !== 'undefined' && window.location.search.includes('demo=true');

  // Geospatial data states
  const [tracks, setTracks] = useState([]);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [regionData, setRegionData] = useState(null);
  const [gridCells, setGridCells] = useState([]);
  const [roadNetwork, setRoadNetwork] = useState(null);
  const [simResult, setSimResult] = useState(null);
  const [impactSummary, setImpactSummary] = useState(null);
  const [briefData, setBriefData] = useState(null);

  // Selected asset / road breach state
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [inspectEvidenceId, setInspectEvidenceId] = useState(null);
  const [isAdvisoryModalOpen, setIsAdvisoryModalOpen] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  // Map layer controls
  const [layers, setLayers] = useState({
    cyclone: true,
    wind: true,
    flood: true,
    roads: true,
    hospitals: true,
    shelters: true
  });

  const toggleLayer = (key) => {
    setLayers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const tracksRes = await fetch('/api/v1/cyclone/tracks');
      const tracksData = await tracksRes.json();
      setTracks(tracksData);
      if (tracksData.length > 0) {
        setSelectedTrack(tracksData[0]);
      }

      const regionRes = await fetch('/api/v1/region/summary');
      const regionSummary = await regionRes.json();
      setRegionData(regionSummary);

      const gridRes = await fetch('/api/v1/region/grid');
      const gridData = await gridRes.json();
      setGridCells(gridData);

      // Lazily fetch road network in background
      fetch('/api/v1/region/roads?simplified=true')
        .then(res => res.json())
        .then(data => setRoadNetwork(data))
        .catch(err => console.error("Roads fetch error:", err));

      runSimulation(tracksData[0], {});
    } catch (e) {
      console.error("Initial data load error:", e);
    }
  };

  const runSimulation = async (track, perts = {}) => {
    setIsSimulating(true);
    try {
      const runId = track?.track_id?.toLowerCase()?.includes('fani') ? 'fani' : 'yaas';
      const queryParams = new URLSearchParams();
      if (track?.lat) queryParams.set('lat', track.lat);
      if (track?.lon) queryParams.set('lon', track.lon);
      if (track?.v_max) queryParams.set('v_max', track.v_max);

      const impactRes = await fetch(`/api/v1/runs/${runId}/impact-summary?${queryParams.toString()}`);
      if (impactRes.ok) {
        const impactData = await impactRes.json();
        setImpactSummary(impactData);
      }

      const simRes = await fetch('/api/v1/simulation/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ track_fix: track, perturbations: perts })
      });
      const simOutput = await simRes.json();
      setSimResult(simOutput);

      const briefRes = await fetch('/api/v1/ai/brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ track_fix: track, perturbations: perts })
      });
      const briefOutput = await briefRes.json();
      setBriefData(briefOutput);
    } catch (e) {
      console.error("Simulation error:", e);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleSelectState = (stateId) => {
    setCurrentState(stateId);
    if (stateId === 1) {
      // 1. Command Center Baseline Replay
      runSimulation(selectedTrack || tracks[0], {});
      setSelectedAsset(null);
    } else if (stateId === 2) {
      // 2. Hospital Selected State (PHC Sanatpur IMPASSABLE / CHC Rajnagar DEGRADED)
      const sanatpur = (regionData?.health_facilities || []).find(f => f.name?.includes('Sanatpur')) || {
        name: 'PHC, Sanatpur',
        asset_type: 'hospital',
        type: 'Primary Health Centre',
        bed_capacity: 10,
        elevation_m: 5.0
      };
      setSelectedAsset({ ...sanatpur, asset_type: 'hospital' });
    } else if (stateId === 3) {
      // 3. Road Cut Selected (Impassable Causeway Sector)
      const breach = (simResult?.cascade?.broken_road_edges || []).find(e => e.impassable || e.name?.includes('Bridge') || e.name?.includes('Causeway')) || {
        name: 'Kendrapara Low-Lying Causeway Sector',
        asset_type: 'road',
        highway: 'primary',
        length_km: 4.8
      };
      setSelectedAsset({ ...breach, asset_type: 'road' });
    } else if (stateId === 5) {
      // 5. Landfall Peak State (T-0)
      setTimeStepHours(0);
    } else if (stateId === 6 || stateId === 7) {
      // 6 & 7. Scenario Simulation & Delta Output
      runSimulation(selectedTrack || tracks[0], { v_max_multiplier: 1.15, rain_multiplier: 1.25, surge_multiplier: 1.20 });
    } else if (stateId === 9) {
      // 9. AI Situation Brief Execution
      fetch('/api/v1/ai/brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ track_fix: selectedTrack || tracks[0], perturbations: {} })
      })
        .then(res => res.json())
        .then(data => setBriefData(data))
        .catch(err => console.error("AI Brief Preset fetch error:", err));
    } else if (stateId === 10) {
      // 10. Advisory Workflow
      setIsAdvisoryModalOpen(true);
    } else {
      setSelectedAsset(null);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#EFF3F8] overflow-hidden select-none font-sans">
      {/* State Presets Demo Bar (Only shown when ?demo=true query flag is present) */}
      {isDemoHarness && (
        <StatePresetsBar 
          currentState={currentState} 
          onSelectState={handleSelectState} 
        />
      )}

      {/* Top Event Header */}
      <Header 
        tracks={tracks}
        selectedTrack={selectedTrack}
        onSelectTrack={(t) => {
          setSelectedTrack(t);
          runSimulation(t, {});
        }}
        currentState={currentState}
        onOpenAdvisoryModal={() => setIsAdvisoryModalOpen(true)}
      />

      {/* Sub-Header Telemetry Strip */}
      <TelemetryBar 
        trackFix={selectedTrack}
        simResult={simResult}
        isSimulated={Object.keys(simResult?.perturbations || {}).length > 0}
        timeStepHours={timeStepHours}
      />

      {/* Synthesized Civic Impact Hero Strip (Reference Image Top Section) */}
      <ImpactBanner 
        simResult={simResult}
        impactSummary={impactSummary}
        isSimulated={currentState === 7}
      />

      {/* Main Command Center Viewport Body (3 Columns) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Column: Navigation & Layer Controls (220px) */}
        <LeftNavPanel 
          activeNav={activeNav}
          setActiveNav={setActiveNav}
          layers={layers}
          toggleLayer={toggleLayer}
          currentState={currentState}
          onSelectState={handleSelectState}
        />

        {/* Center Workspace: Hero 2D Map (70-80% Width Flex) */}
        <div className="flex-1 h-full relative">
          <MapView 
            gridCells={gridCells}
            simResult={simResult}
            facilities={regionData?.health_facilities || []}
            shelters={regionData?.cyclone_shelters || []}
            roadNetwork={roadNetwork || regionData?.road_network || null}
            trackFix={selectedTrack}
            layers={layers}
            onSelectAsset={(asset) => {
              setSelectedAsset(asset);
              if (asset.asset_type === 'hospital') handleSelectState(2);
              else if (asset.asset_type === 'road') handleSelectState(3);
            }}
            timeStepHours={timeStepHours}
            onSelectRoadBreach={(road) => {
              setSelectedAsset({ ...road, asset_type: 'road' });
              handleSelectState(3);
            }}
          />
        </div>

        {/* Right Column: Contextual Inspector (320px) */}
        <ContextInspectorPanel 
          currentState={currentState}
          onSelectState={handleSelectState}
          selectedAsset={selectedAsset}
          onClearSelectedAsset={() => setSelectedAsset(null)}
          simResult={simResult}
          briefData={briefData}
          onOpenAdvisoryModal={() => setIsAdvisoryModalOpen(true)}
          onRunScenario={(perts) => runSimulation(selectedTrack, perts)}
          isSimulating={isSimulating}
        />
      </div>

      {/* Bottom Analysis Strip */}
      <BottomAnalysisStrip 
        currentState={currentState}
        onSelectState={handleSelectState}
        simResult={simResult}
      />

      {/* Bottom Interactive Event Timeline */}
      <TimelineBar 
        timeStepHours={timeStepHours}
        setTimeStepHours={setTimeStepHours}
        currentState={currentState}
        onSelectState={handleSelectState}
      />

      {/* Provenance Evidence Inspector Modal */}
      {inspectEvidenceId && (
        <EvidenceModal 
          evidenceId={inspectEvidenceId}
          evidenceBundle={briefData?.evidence_bundle}
          onClose={() => setInspectEvidenceId(null)}
        />
      )}

      {/* Advisory Workflow & CAP Export Modal */}
      <AdvisoryModal 
        isOpen={isAdvisoryModalOpen}
        onClose={() => setIsAdvisoryModalOpen(false)}
      />
    </div>
  );
}
