import h3
import math

def generate_hexagons_for_bbox(min_lat: float, min_lon: float, max_lat: float, max_lon: float, resolution: int = 8):
    """Generates H3 cell addresses covering a given bounding box."""
    geojson_poly = {
        "type": "Polygon",
        "coordinates": [[
            [min_lon, min_lat],
            [max_lon, min_lat],
            [max_lon, max_lat],
            [min_lon, max_lat],
            [min_lon, min_lat]
        ]]
    }
    try:
        # h3 v4 API
        h3_shape = h3.geojson_to_h3shape(geojson_poly)
        cells = h3.polygon_to_cells(h3_shape, resolution)
    except Exception:
        try:
            cells = h3.polyfill(geojson_poly, resolution, geo_json_conformant=True)
        except Exception:
            # Direct lat-lng sampling fallback if polyfill fails
            cells = set()
            for lat in [min_lat, (min_lat+max_lat)/2, max_lat]:
                for lon in [min_lon, (min_lon+max_lon)/2, max_lon]:
                    try:
                        cells.add(h3.latlng_to_cell(lat, lon, resolution))
                    except AttributeError:
                        cells.add(h3.geo_to_h3(lat, lon, resolution))
    return list(cells)

def cell_to_latlon(h3_cell: str):
    """Returns (lat, lon) for the centroid of an H3 cell."""
    try:
        lat, lon = h3.cell_to_latlng(h3_cell)
    except AttributeError:
        lat, lon = h3.h3_to_geo(h3_cell)
    return lat, lon

def cell_to_boundary(h3_cell: str):
    """Returns list of (lat, lon) boundary points for an H3 cell."""
    try:
        boundary = h3.cell_to_boundary(h3_cell)
    except AttributeError:
        boundary = h3.h3_to_geo_boundary(h3_cell)
    return boundary

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Computes great-circle distance between two points in km."""
    R = 6371.0 # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2.0)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c
