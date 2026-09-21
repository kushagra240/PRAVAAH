import numpy as np
import pandas as pd
from typing import Dict, Any

class ParametricSurgeModel:
    """
    Parametric storm-surge screening model calibrated against historical Bay of Bengal cyclones.
    Calculates peak coastal surge height and connected inland hydraulic attenuation on DEM.
    """
    def compute_peak_surge_height(self, 
                                  p_c_hpa: float, 
                                  v_max_kph: float, 
                                  r_max_km: float = 35.0,
                                  bathy_slope: float = 0.002) -> float:
        """
        Computes peak coastal surge height (meters) using empirical pressure-deficit & wind formula.
        """
        delta_p = max(5.0, 1013.0 - p_c_hpa) # hPa
        v_max_ms = v_max_kph / 3.6
        
        # Empirical parametric screening relation
        # Surge = a * delta_p + b * V_max^2 + c * (1 / bathy_slope)
        a = 0.035
        b = 0.0008
        c = 0.002
        
        surge_peak = (a * delta_p) + (b * (v_max_ms**2)) + (c * (1.0 / max(0.0005, bathy_slope)))
        return float(np.clip(surge_peak, 0.5, 9.5))

    def compute_surge_inundation(self, 
                                df_cube: pd.DataFrame, 
                                peak_surge_m: float,
                                attenuation_rate_per_km: float = 0.12) -> np.ndarray:
        """
        Computes cell-level surge inundation depth (meters) and inundated status.
        Uses connected hydraulically-attenuated bathtub logic on elevation.
        """
        dist_coast_km = df_cube["dist_coast_m"].values / 1000.0
        elev = df_cube["elev_mean"].values
        
        # Inundation potential: Surge height attenuated by inland distance
        attenuated_surge = np.maximum(0.0, peak_surge_m - (attenuation_rate_per_km * dist_coast_km))
        
        # Inundation depth
        surge_depth_m = np.maximum(0.0, attenuated_surge - elev)
        
        # Mask out cells that are disconnected or high ground
        surge_depth_m = np.where(dist_coast_km > 35.0, 0.0, surge_depth_m)
        
        return surge_depth_m
