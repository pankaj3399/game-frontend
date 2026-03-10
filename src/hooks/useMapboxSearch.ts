import { useState, useEffect, useRef, useCallback } from "react";

const MAPBOX_GEOCODE_URL = "https://api.mapbox.com/search/geocode/v6/forward";
const DEBOUNCE_MS = 200;

export interface MapboxFeature {
  id: string;
  placeName: string;
  fullAddress: string;
  coordinates: [number, number]; // [longitude, latitude]
}

interface MapboxGeocodeResponse {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    id: string;
    geometry: { type: "Point"; coordinates: [number, number] };
    properties: {
      name?: string;
      place_formatted?: string;
      full_address?: string;
      feature_type?: string;
    };
  }>;
}

async function searchMapbox(
  query: string,
  accessToken: string
): Promise<MapboxFeature[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const params = new URLSearchParams({
    q: trimmed,
    access_token: accessToken,
    limit: "5",
    autocomplete: "true",
  });

  const res = await fetch(`${MAPBOX_GEOCODE_URL}?${params}`);
  if (!res.ok) {
    throw new Error("Mapbox geocoding request failed");
  }

  const data: MapboxGeocodeResponse = await res.json();
  if (!data.features || !Array.isArray(data.features)) {
    return [];
  }

  return data.features.map((f) => ({
    id: f.id,
    placeName: f.properties.name ?? "",
    fullAddress:
      f.properties.full_address ??
      [f.properties.name, f.properties.place_formatted].filter(Boolean).join(", ") ??
      "",
    coordinates: f.geometry.coordinates,
  }));
}

export function useMapboxSearch(searchQuery: string) {
  const [results, setResults] = useState<MapboxFeature[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastQueryRef = useRef<string>("");

  const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string | undefined;

  const performSearch = useCallback(
    async (query: string) => {
      if (!accessToken) {
        setError("Mapbox token not configured");
        setResults([]);
        return;
      }

      const trimmed = query.trim();
      if (!trimmed) {
        setResults([]);
        setError(null);
        setIsLoading(false);
        return;
      }

      lastQueryRef.current = trimmed;
      setIsLoading(true);
      setError(null);

      try {
        const features = await searchMapbox(trimmed, accessToken);
        if (lastQueryRef.current === trimmed) {
          setResults(features);
        }
      } catch (err) {
        if (lastQueryRef.current === trimmed) {
          setError(err instanceof Error ? err.message : "Search failed");
          setResults([]);
        }
      } finally {
        if (lastQueryRef.current === trimmed) {
          setIsLoading(false);
        }
      }
    },
    [accessToken]
  );

  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setResults([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    const timer = setTimeout(() => {
      performSearch(searchQuery);
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [searchQuery, performSearch]);

  return { results, isLoading, error, hasToken: !!accessToken };
}
