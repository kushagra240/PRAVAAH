import math
import numpy as np
from typing import List, Dict, Any

class HollandWindModel:
    """
    Parametric Holland (1980) Wind Field Model for Tropical Cyclones.
    Computes 10-m surface wind velocity (km/h) across spatial grid points.
    """
    def __init__(self, air_density: float = 1.15, p_env: float = 1013.0):
        self.rho = air_density # Air density kg/m3
        self.p_env = p_env     # Environmental pressure in hPa

    def compute_wind_field(self, 
                           lats: np.ndarray, 
                           lons: np.ndarray, 
                           track_fix: Dict[str, Any]) -> np.ndarray:
        """
        Computes maximum wind speed (km/h) at given lat/lon arrays for a single track fix.
        track_fix contains: lat, lon, p_c (hPa), v_max (km/h), r_max (km), speed_kph, bearing_deg
        """
        center_lat = track_fix["lat"]
        center_lon = track_fix["lon"]
        p_c = track_fix.get("p_c", 950.0)
        v_max = track_fix.get("v_max", 140.0) # km/h
        r_max = track_fix.get("r_max", 35.0)  # km
        v_trans = track_fix.get("speed_kph", 20.0) # km/h
        bearing = math.radians(track_fix.get("bearing_deg", 310.0))
        
        # Convert v_max to m/s for physics formula
        v_max_ms = v_max / 3.6
        v_trans_ms = v_trans / 3.6
        delta_p = (self.p_env - p_c) * 100.0 # Convert hPa to Pa
        if delta_p <= 0:
            delta_p = 1000.0
            
        # Holland B parameter derivation from v_max and delta_p
        # B = v_max^2 * e * rho / delta_p
        b = max(1.0, min(2.5, (v_max_ms**2 * math.e * self.rho) / delta_p))
        
        # Earth radius in km
        R_earth = 6371.0
        
        # Vectorized radial distance from center
        dlat = np.radians(lats - center_lat)
        dlon = np.radians(lons - center_lon)
        a = np.sin(dlat / 2.0)**2 + np.cos(np.radians(center_lat)) * np.cos(np.radians(lats)) * np.sin(dlon / 2.0)**2
        r_km = 2.0 * R_earth * np.arcsin(np.sqrt(np.clip(a, 0.0, 1.0)))
        r_km = np.maximum(r_km, 1.0) # Avoid division by zero
        
        # Holland radial wind velocity calculation (m/s)
        ratio = (r_max / r_km)**b
        v_rot_ms = np.sqrt(np.maximum(0.0, (b / self.rho) * ratio * delta_p * np.exp(-ratio)))
        
        # Directional asymmetry adjustment (higher winds on right side of track in Northern Hemisphere)
        angles = np.arctan2(lats - center_lat, lons - center_lon)
        asymmetry = v_trans_ms * np.sin(angles - bearing)
        
        v_total_ms = np.maximum(0.0, v_rot_ms + 0.5 * asymmetry)
        v_total_kph = v_total_ms * 3.6
        
        return v_total_kph
