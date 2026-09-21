import numpy as np
import pandas as pd
from typing import List, Dict, Any

class ExposureEngine:
    """
    Computes spatial join aggregations between cell-level hazard layers, 
    infrastructure assets, and population distributions.
    """
    def summarize_exposure(self, 
                           df_cube: pd.DataFrame, 
                           wind_kph: np.ndarray, 
                           flood_prob: np.ndarray, 
                           surge_depth_m: np.ndarray) -> Dict[str, Any]:
        """
        Summarizes physical exposure counts and risk distributions across admin districts and blocks.
        """
        df = df_cube.copy()
        df["wind_kph"] = wind_kph
        df["flood_prob"] = flood_prob
        df["surge_depth_m"] = surge_depth_m
        
        # Hazard classification thresholds (anchored to IMD & §12.3 passability thresholds)
        # Wind: Severe Cyclonic Storm >= 89 km/h, Very Severe >= 118 km/h
        df["wind_severe"] = df["wind_kph"] >= 89.0
        df["wind_vsevere"] = df["wind_kph"] >= 118.0
        df["flood_severe"] = df["flood_prob"] >= 0.60
        df["flood_elevated"] = df["flood_prob"] >= 0.30
        df["surge_flooded"] = df["surge_depth_m"] > 0.3
        
        # Exposed population
        pop_total = int(df["population"].sum())
        pop_high_wind = int(df[df["wind_severe"]]["population"].sum())
        pop_vsevere_wind = int(df[df["wind_vsevere"]]["population"].sum())
        pop_severe_flood = int(df[df["flood_severe"]]["population"].sum())
        pop_elevated_flood = int(df[df["flood_elevated"]]["population"].sum())
        pop_surge_flooded = int(df[df["surge_flooded"]]["population"].sum())
        
        # Block-level roll-ups
        block_summary = []
        for (district, block), grp in df.groupby(["admin_district", "admin_block"]):
            block_pop = int(grp["population"].sum())
            b_severe_flood = int(grp[grp["flood_severe"]]["population"].sum())
            b_elevated_flood = int(grp[grp["flood_elevated"]]["population"].sum())
            b_avg_wind = float(grp["wind_kph"].mean())
            b_max_surge = float(grp["surge_depth_m"].max())
            
            block_summary.append({
                "district": district,
                "block": block,
                "total_population": block_pop,
                "exposed_severe_flood_pop": b_severe_flood,
                "exposed_flood_pop": b_elevated_flood,
                "pct_flood_exposed": round(100.0 * b_elevated_flood / max(1, block_pop), 1),
                "avg_wind_kph": round(b_avg_wind, 1),
                "max_surge_m": round(b_max_surge, 2)
            })
            
        block_summary.sort(key=lambda x: x["exposed_flood_pop"], reverse=True)
        
        return {
            "total_population": pop_total,
            "pop_exposed_severe_wind": pop_high_wind,
            "pop_exposed_vsevere_wind": pop_vsevere_wind,
            "pop_exposed_severe_flood": pop_severe_flood,
            "pop_exposed_elevated_flood": pop_elevated_flood,
            "pop_exposed_high_flood": pop_elevated_flood,
            "pop_exposed_surge": pop_surge_flooded,
            "block_breakdown": block_summary
        }
