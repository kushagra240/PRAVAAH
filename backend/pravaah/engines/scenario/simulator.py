import os
import json
import time
import numpy as np
import pandas as pd
from typing import Dict, Any, List

from backend.pravaah.engines.cyclone.holland import HollandWindModel
from backend.pravaah.engines.hazard.surge import ParametricSurgeModel
from backend.pravaah.engines.hazard.flood import HeuristicFloodScreeningModel
from backend.pravaah.engines.exposure.spatial_join import ExposureEngine
from backend.pravaah.engines.vulnerability.index import VulnerabilityEngine
from backend.pravaah.engines.cascade.road_graph import RoadGraphCascadeEngine

class ScenarioSimulator:
    """
    Real-time physical impact & scenario simulator.
    Performs end-to-end vectorised recomputation of wind, surge, flood, exposure, 
    vulnerability, and Dijkstra network cascade in <3s target latency.
    """
    def __init__(self, region_dir: str):
        self.region_dir = region_dir
        self.cube_df = pd.read_parquet(os.path.join(region_dir, "feature_cube.parquet"))
        
        with open(os.path.join(region_dir, "health_facilities.json"), "r") as f:
            self.facilities = json.load(f)
            
        with open(os.path.join(region_dir, "cyclone_shelters.json"), "r") as f:
            self.shelters = json.load(f)
            
        self.road_engine = RoadGraphCascadeEngine(os.path.join(region_dir, "road_network.json"))
        
        self.wind_model = HollandWindModel()
        self.surge_model = ParametricSurgeModel()
        self.flood_model = HeuristicFloodScreeningModel()
        self.exposure_engine = ExposureEngine()
        self.vulnerability_engine = VulnerabilityEngine()
        
        self.lats = self.cube_df["lat"].values
        self.lons = self.cube_df["lon"].values

    def run_simulation(self, 
                       track_fix: Dict[str, Any], 
                       perturbations: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Executes full simulation pipeline given a track fix and optional user scenario perturbations.
        """
        start_time = time.time()
        if perturbations is None:
            perturbations = {}
            
        # Extract perturbation parameters
        lat_shift = perturbations.get("track_lat_shift_deg", 0.0)
        lon_shift = perturbations.get("track_lon_shift_deg", 0.0)
        v_max_mult = perturbations.get("v_max_multiplier", 1.0)
        rain_mult = perturbations.get("rain_multiplier", 1.0)
        surge_mult = perturbations.get("surge_multiplier", 1.0)
        
        # Perturbed track fix
        p_track = track_fix.copy()
        p_track["lat"] += lat_shift
        p_track["lon"] += lon_shift
        p_track["v_max"] *= v_max_mult
        
        # 1. Wind field calculation
        wind_kph = self.wind_model.compute_wind_field(self.lats, self.lons, p_track)
        
        # 2. Surge screening calculation
        peak_surge_m = self.surge_model.compute_peak_surge_height(
            p_c_hpa=p_track.get("p_c", 950.0),
            v_max_kph=p_track.get("v_max", 140.0),
            r_max_km=p_track.get("r_max", 35.0)
        ) * surge_mult
        
        surge_depth_m = self.surge_model.compute_surge_inundation(self.cube_df, peak_surge_m)
        
        # 3. XGBoost Flood Susceptibility calculation
        base_rain_24h = 250.0 * rain_mult
        base_rain_intensity = 35.0 * rain_mult
        flood_prob = self.flood_model.predict_flood_probability(
            self.cube_df, 
            rain_24h_mm=base_rain_24h, 
            rain_intensity_mmh=base_rain_intensity,
            surge_depth_m=surge_depth_m
        )
        
        # 4. Exposure & Vulnerability evaluation
        exposure_summary = self.exposure_engine.summarize_exposure(self.cube_df, wind_kph, flood_prob, surge_depth_m)
        fac_eval = self.vulnerability_engine.evaluate_facility_vulnerability(self.facilities, self.cube_df, flood_prob, wind_kph)
        
        # 5. Dijkstra Road Graph Cascade calculation
        cascade_summary = self.road_engine.solve_accessibility_loss(self.cube_df, self.facilities, flood_prob)
        
        elapsed_ms = round((time.time() - start_time) * 1000.0, 1)
        
        return {
            "computation_time_ms": elapsed_ms,
            "provenance": "SIMULATED" if len(perturbations) > 0 else "MODELLED",
            "track_fix": p_track,
            "perturbations": perturbations,
            "peak_surge_m": round(peak_surge_m, 2),
            "max_wind_kph": round(float(np.max(wind_kph)), 1),
            "exposure": exposure_summary,
            "facility_evaluations": fac_eval,
            "cascade": cascade_summary,
            "cell_count": len(self.cube_df),
            "flood_probabilities": [round(float(p), 4) for p in flood_prob]
        }
