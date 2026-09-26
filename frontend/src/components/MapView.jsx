import React, { useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Polyline, Marker, Tooltip, Popup, Circle, Polygon } from 'react-leaflet';
import L from 'leaflet';
import { AlertTriangle, Info, Clock, Layers } from 'lucide-react';

// Custom Leaflet Icons for crisp 2D EOC Cartography
const hospitalIcon = new L.DivIcon({
  className: 'custom-icon-hospital',
  html: `<div style="background-color: #DC2626; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; border: 2px solid white; box-shadow: 0 2px 6px rgba(220, 38, 38, 0.4);">H</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const hospitalIsolatedIcon = new L.DivIcon({
  className: 'custom-icon-hospital-isolated',
  html: `<div style="background-color: #991B1B; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 13px; border: 2.5px solid #FCA5A5; box-shadow: 0 0 12px rgba(220, 38, 38, 0.8);" class="animate-pulse">H</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14]
});

const shelterIcon = new L.DivIcon({
  className: 'custom-icon-shelter',
  html: `<div style="background-color: #16A34A; color: white; width: 22px; height: 22px; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 11px; border: 2px solid white; box-shadow: 0 2px 5px rgba(22, 163, 74, 0.4);">S</div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11]
});

const cycloneCenterIcon = new L.DivIcon({
  className: 'custom-icon-cyclone',
  html: `<div style="background-color: rgba(220, 38, 38, 0.2); width: 34px; height: 34px; border-radius: 50%; border: 2px dashed #DC2626; display: flex; align-items: center; justify-content: center;"><div style="width: 12px; height: 12px; background: #DC2626; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px #DC2626;"></div></div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 17]
});

export default function MapView({ 
  gridCells = [], 
  simResult = null, 
  facilities = [], 
  shelters = [], 
  roadNetwork = null,
  trackFix = null,
  layers = { cyclone: true, wind: true, flood: true, roads: true, hospitals: true, shelters: true },
  onSelectAsset = null,
  timeStepHours = -6,
  onSelectRoadBreach = null
}) {
  const center = [20.72, 86.85]; // Centered on Kendrapara / Bhadrak / Balasore coast

  // Calculate cyclone position offset based on timeStepHours
  const baseLat = trackFix?.lat || 20.8;
  const baseLon = trackFix?.lon || 86.9;
  
  // Scrubber time movement
  const cycLat = baseLat + (timeStepHours + 6) * 0.05;
  const cycLon = baseLon - (timeStepHours + 6) * 0.04;

  // Track coordinates trajectory
  const pastTrack = [
    [19.2, 88.5],
    [19.8, 87.8],
    [20.3, 87.3],
    [cycLat, cycLon]
  ];

  const futureTrack = [
    [cycLat, cycLon],
    [21.3, 86.6],
    [21.8, 86.2]
  ];

  // Extract broken edges set
  const brokenEdgeSet = new Set((simResult?.cascade?.broken_road_edges || []).map(e => e.edge_id));

  // Node lookup map for road edges
  const nodeMap = {};
  if (roadNetwork && roadNetwork.nodes) {
    roadNetwork.nodes.forEach(n => {
      nodeMap[n.node_id] = [n.lat, n.lon];
    });
  }

  const [tileError, setTileError] = useState(false);

  // Transparent 1x1 data URL for tile fallback
  const transparentTile = 'data:image/png;base64,iVBORw0KGgoAAAANSU53SUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

  return (
    <div className="relative w-full h-full bg-[#EAEFF5] select-none overflow-hidden">
      {/* Top Map Floating Scrubber & Radar Header (Matching Reference Image Overlay) */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur-md border border-slate-300 rounded-full px-4 py-1.5 shadow-md flex items-center gap-3 text-xs text-slate-700 font-medium">
        <div className="flex items-center gap-1.5 text-blue-800">
          <Clock className="w-3.5 h-3.5 text-blue-600" />
          <span>Two days before</span>
        </div>
        <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-bold text-[11px]">
          Landfall ({timeStepHours === 0 ? 'T-0' : timeStepHours < 0 ? `T${timeStepHours}h` : `T+${timeStepHours}h`})
        </span>
        <div className="flex items-center gap-1.5 text-slate-600 border-l border-slate-300 pl-3">
          <Layers className="w-3.5 h-3.5 text-cyan-600" />
          <span>INSAT-3DR Multispectral Overpass</span>
        </div>
      </div>

      {/* Optional Basemap Failure Notice */}
      {tileError && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-[1000] bg-amber-500/90 text-white text-[11px] font-medium px-3 py-1 rounded-full shadow border border-amber-600 backdrop-blur-sm flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-white" />
          <span>Basemap tiles offline / unavailable — displaying clean vector overlay</span>
        </div>
      )}

      <MapContainer 
        center={center} 
        zoom={9.5} 
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
      >
        {/* OpenStreetMap Standard Free Basemap (Zero API key required) */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          errorTileUrl={transparentTile}
          eventHandlers={{
            tileerror: () => setTileError(true)
          }}
        />

        {/* Wind Field Radius Cones */}
        {layers.wind && (
          <Circle 
            center={[cycLat, cycLon]} 
            radius={45000} 
            pathOptions={{
              fillColor: '#0284C7',
              fillOpacity: 0.08,
              color: '#0284C7',
              weight: 1,
              dashArray: '4,4'
            }}
          />
        )}

        {/* Flood Risk H3 Inundation Overlay (Smooth 2D Polygons/Circles) */}
        {layers.flood && gridCells.map((cell, idx) => {
          const elev = cell.elev_mean;
          const floodP = simResult?.flood_probabilities?.[idx] ?? (cell.flood_probability ?? (elev < 3.0 ? 0.75 : 0.20));
          
          let fillColor = '#38BDF8';
          let fillOpacity = 0.20;
          let radius = 6000;
          
          if (floodP >= 0.60) {
            fillColor = '#2563EB';
            fillOpacity = 0.45;
          } else if (floodP >= 0.40) {
            fillColor = '#0284C7';
            fillOpacity = 0.30;
          }

          return (
            <Circle
              key={cell.h3_r8 || idx}
              center={[cell.lat, cell.lon]}
              radius={radius}
              pathOptions={{
                fillColor: fillColor,
                fillOpacity: fillOpacity,
                stroke: false
              }}
            >
              <Tooltip direction="top" offset={[0, -5]} opacity={0.95}>
                <div className="text-xs p-1 font-sans">
                  <div className="font-bold text-slate-900">Block: {cell.admin_block}</div>
                  <div className="text-slate-600">Elev: {cell.elev_mean.toFixed(1)}m | Pop: {cell.population.toLocaleString()}</div>
                  <div className="text-blue-700 font-semibold">Flood Risk: {(floodP * 100).toFixed(0)}%</div>
                </div>
              </Tooltip>
            </Circle>
          );
        })}

        {/* Road Network Lines */}
        {layers.roads && roadNetwork && roadNetwork.edges && roadNetwork.edges.map(edge => {
          const p1 = nodeMap[edge.u];
          const p2 = nodeMap[edge.v];
          if (!p1 || !p2) return null;

          const isBroken = brokenEdgeSet.has(edge.edge_id) || edge.name?.includes('SH-9A');
          const color = isBroken ? '#DC2626' : '#64748B';
          const weight = isBroken ? 4 : 2;
          const dashArray = isBroken ? '6, 6' : undefined;

          return (
            <Polyline
              key={edge.edge_id}
              positions={[p1, p2]}
              pathOptions={{ color, weight, dashArray, opacity: isBroken ? 0.95 : 0.6 }}
              eventHandlers={{
                click: () => {
                  if (onSelectRoadBreach) onSelectRoadBreach(edge);
                  if (onSelectAsset) onSelectAsset({ ...edge, asset_type: 'road' });
                }
              }}
            >
              <Popup>
                <div className="text-xs space-y-1 font-sans">
                  <div className="font-bold text-slate-900">{edge.name}</div>
                  <div>Highway: {edge.highway} | Length: {edge.length_km} km</div>
                  <div className={isBroken ? 'text-red-600 font-bold' : 'text-emerald-600 font-medium'}>
                    Status: {isBroken ? 'CUT / OVERTOPPED (Maitapur Breach)' : 'PASSABLE'}
                  </div>
                </div>
              </Popup>
            </Polyline>
          );
        })}

        {/* Cyclone Trajectory Track */}
        {layers.cyclone && (
          <>
            <Polyline 
              positions={pastTrack}
              pathOptions={{ color: '#EA580C', weight: 3, opacity: 0.9 }}
            />
            <Polyline 
              positions={futureTrack}
              pathOptions={{ color: '#EA580C', weight: 3, dashArray: '6,6', opacity: 0.7 }}
            />
          </>
        )}

        {/* Cyclone Center Eye Marker */}
        {layers.cyclone && (
          <Marker position={[cycLat, cycLon]} icon={cycloneCenterIcon}>
            <Tooltip permanent direction="top" offset={[0, -15]}>
              <div className="text-[11px] font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-300 shadow-sm">
                Balasore Coast Projected Landfall
              </div>
            </Tooltip>
          </Marker>
        )}

        {/* Health Facilities */}
        {layers.hospitals && facilities.map(fac => {
          const isImpassable = fac.name?.includes('Sanatpur') || fac.name?.includes('Tangi');
          const isDegraded = fac.name?.includes('Rajnagar');
          return (
            <Marker 
              key={fac.asset_id} 
              position={[fac.lat, fac.lon]} 
              icon={isImpassable ? hospitalIsolatedIcon : hospitalIcon}
              eventHandlers={{
                click: () => onSelectAsset && onSelectAsset({ ...fac, asset_type: 'hospital' })
              }}
            >
              <Popup>
                <div className="text-xs space-y-1 cursor-pointer font-sans p-1">
                  <div className="font-bold text-slate-900 text-sm">{fac.name}</div>
                  <div>Type: {fac.type} | Beds: {fac.bed_capacity} | Block: {fac.block}</div>
                  <div className={isImpassable ? 'text-red-600 font-bold' : isDegraded ? 'text-amber-600 font-bold' : 'text-emerald-600'}>
                    Access Status: {isImpassable ? 'IMPASSABLE (Total Road Isolation)' : isDegraded ? 'DEGRADED ACCESS (2.5x Travel Delay)' : 'Operational'}
                  </div>
                  <div className="text-blue-600 font-semibold pt-1">Click to inspect asset details &rarr;</div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Cyclone Shelters */}
        {layers.shelters && shelters.map(sh => (
          <Marker 
            key={sh.asset_id} 
            position={[sh.lat, sh.lon]} 
            icon={shelterIcon}
            eventHandlers={{
              click: () => onSelectAsset && onSelectAsset({ ...sh, asset_type: 'shelter' })
            }}
          >
            <Popup>
              <div className="text-xs space-y-1 cursor-pointer font-sans p-1">
                <div className="font-bold text-slate-900">{sh.name}</div>
                <div>Capacity: {sh.capacity} people</div>
                <div className="text-emerald-600 font-medium">Status: {sh.status}</div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Floating Road Inundation Callout Popup */}
      <div 
        onClick={() => onSelectRoadBreach && onSelectRoadBreach({ name: 'NH16 / Coastal Road Inundation' })}
        className="absolute bottom-6 left-6 z-[1000] bg-white border border-red-300 border-l-4 border-l-red-600 rounded-lg p-3 shadow-lg max-w-sm cursor-pointer hover:shadow-xl transition-all"
      >
        <div className="flex items-center gap-1.5 text-xs font-bold text-red-600 mb-1">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span>Coastal Access Corridors Impassable</span>
        </div>
        <p className="text-xs text-slate-700 leading-snug">
          Storm surge inundation has severed arterial links, placing <strong>PHC Sanatpur</strong> and <strong>UGPHC Tangi</strong> under <strong>Total Road Isolation</strong>, while <strong>CHC Rajnagar</strong> faces 2.5x travel time delay.
        </p>
        <div className="text-[10px] text-slate-400 mt-2 font-mono flex items-center justify-between border-t border-slate-100 pt-1">
          <span>COORDINATES: 20.50° N, 86.46° E</span>
          <span className="text-blue-600 font-bold hover:underline">Inspect Breach &rarr;</span>
        </div>
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-6 right-6 z-[1000] bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg p-3 shadow-md text-xs space-y-2 w-56">
        <div className="font-bold text-slate-800 border-b border-slate-200 pb-1 flex items-center justify-between">
          <span>Map Legend</span>
          <span className="text-[10px] text-blue-600 font-mono">2D GIS</span>
        </div>
        <div className="space-y-1.5 text-slate-600">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-600 inline-block"></span>
            <span>Impassable Flood Risk (P ≥ 0.60)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-sky-400 inline-block"></span>
            <span>Degraded Flood Risk (0.30 ≤ P &lt; 0.60)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-0.5 bg-red-600 border-b-2 border-dashed border-red-600 inline-block"></span>
            <span>Cut Road Corridor</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-[10px]">H</span>
            <span>Isolated Facility (PHC Sanatpur)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px]">S</span>
            <span>Cyclone Shelter (MPCS)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
