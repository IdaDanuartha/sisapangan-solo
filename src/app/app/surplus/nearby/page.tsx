"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { List, Map as MapIcon, Search, MapPin, Clock, Heart, Shield, HelpCircle, Package, ArrowRight, User, ShieldAlert, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatusBadge, CategoryBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import Link from "next/link";
import { SearchAutocomplete, type SearchSuggestion } from "@/components/ui/SearchAutocomplete";
import { Modal } from "@/components/ui/Modal";

interface SurplusBatch {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  status: string;
  freshness_status: "safe" | "urgent" | "non-consumption";
  freshness_reason: string;
  estimated_expiry: string;
  location_lat: number;
  location_lng: number;
  location_label: string;
  photo_urls: string[] | null;
  created_at: string;
  notes?: string | null;
  distance_km?: number;
  profiles?: {
    name: string;
  } | null;
}

export default function NearbySurplusPage() {
  const [batches, setBatches] = useState<SurplusBatch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<SurplusBatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"map" | "list">("list");
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showConfirmClaim, setShowConfirmClaim] = useState(false);
  const [batchToClaim, setBatchToClaim] = useState<SurplusBatch | null>(null);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [isVerified, setIsVerified] = useState<boolean | null>(null);

  // Filter states
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [radiusKm, setRadiusKm] = useState(5);
  const [filterFreshness, setFilterFreshness] = useState("");

  // Sync and persist filters on reload, but reset on fresh page navigation
  useEffect(() => {
    if (typeof window === "undefined") return;

    const navigationEntries = performance.getEntriesByType("navigation");
    const isReload = navigationEntries.length > 0 && (navigationEntries[0] as PerformanceNavigationTiming).type === "reload";

    if (!isReload) {
      sessionStorage.removeItem("nearby_filters");
      return;
    }

    const cached = sessionStorage.getItem("nearby_filters");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.search !== undefined) setSearch(parsed.search);
        if (parsed.filterCategory !== undefined) setFilterCategory(parsed.filterCategory);
        if (parsed.radiusKm !== undefined) setRadiusKm(parsed.radiusKm);
        if (parsed.filterFreshness !== undefined) setFilterFreshness(parsed.filterFreshness);
      } catch (e) {
        console.error("Error parsing nearby_filters:", e);
      }
    }
  }, []);

  // Save filters to sessionStorage on change
  useEffect(() => {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(
      "nearby_filters",
      JSON.stringify({ search, filterCategory, radiusKm, filterFreshness })
    );
  }, [search, filterCategory, radiusKm, filterFreshness]);

  const [fullMapInstance, setFullMapInstance] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const markersRef = useRef<any[]>([]);
  const routeLineRef = useRef<any>(null);
  const radiusCircleRef = useRef<any>(null);
  const fullRadiusCircleRef = useRef<any>(null);

  // Increment on every mount so the Leaflet container gets a fresh DOM element
  // after SPA navigation (avoids stale-ref / zero-size issues)
  const [mapKey, setMapKey] = useState(0);
  useEffect(() => { setMapKey((k) => k + 1); }, []);

  // Full-screen peta view
  const mapFullRef = useRef<HTMLDivElement>(null);
  const leafletFullMapRef = useRef<any>(null);
  const fullMarkersRef = useRef<any[]>([]);

  const { showToast } = useToast();

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch current user AND verification status
  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      // Check verification for volunteer / non-consumption roles
      const role = user?.user_metadata?.role;
      if (role === "volunteer" || role === "non-consumption") {
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_verified")
          .eq("id", user!.id)
          .single();
        setIsVerified(profile?.is_verified ?? false);
      } else {
        // Donors, admins, monitors always have access
        setIsVerified(true);
      }
    };
    fetchUser();
  }, []);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLat(pos.coords.latitude);
          setUserLng(pos.coords.longitude);
        },
        () => {
          setUserLat(-7.5755);
          setUserLng(110.8243);
        }
      );
    } else {
      setUserLat(-7.5755);
      setUserLng(110.8243);
    }
  }, []);

  // Fetch nearby surplus
  useEffect(() => {
    if (userLat === null || userLng === null) return;

    async function fetchNearby() {
      setLoading(true);
      const supabase = createClient();
      const { data } = await supabase
        .from("surplus_batch")
        .select("*, profiles:donor_id(name)")
        .eq("status", "Tersedia")
        .order("created_at", { ascending: false });

      const rows = (data as any[]) ?? [];

      // Calculate distance client side
      const withDistance = rows
        .map((b) => ({
          ...b,
          distance_km: haversine(userLat!, userLng!, b.location_lat, b.location_lng),
        }))
        .filter((b) => radiusKm === 99999 ? true : b.distance_km <= radiusKm)
        .sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0));

      setBatches(withDistance);
      setLoading(false);
    }

    fetchNearby();
  }, [userLat, userLng, radiusKm]);

  // Client-side filtering
  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      const matchSearch =
        b.name.toLowerCase().includes(search.toLowerCase()) ||
        b.location_label.toLowerCase().includes(search.toLowerCase()) ||
        (b.profiles?.name || "").toLowerCase().includes(search.toLowerCase());
      const matchCategory = !filterCategory || b.category === filterCategory;
      const matchFreshness = !filterFreshness || b.freshness_status === filterFreshness;
      return matchSearch && matchCategory && matchFreshness;
    });
  }, [batches, search, filterCategory, filterFreshness]);

  // Reset pagination when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterCategory, radiusKm, filterFreshness]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredBatches.length / itemsPerPage);
  }, [filteredBatches.length, itemsPerPage]);

  const startIndex = (currentPage - 1) * itemsPerPage;

  const paginatedBatches = useMemo(() => {
    return filteredBatches.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredBatches, startIndex, itemsPerPage]);

  // Helper to select a batch and automatically paginate to its page
  const selectBatchAndGoToPage = (b: SurplusBatch) => {
    const index = filteredBatches.findIndex((item) => item.id === b.id);
    if (index !== -1) {
      const targetPage = Math.floor(index / itemsPerPage) + 1;
      setCurrentPage(targetPage);
    }
    setSelectedBatch(b);
  };

  // Autocomplete suggestions built from all loaded batches
  const searchSuggestions: SearchSuggestion[] = useMemo(() => {
    const seen = new Set<string>();
    const results: SearchSuggestion[] = [];
    batches.forEach((b) => {
      if (!seen.has(b.id)) {
        seen.add(b.id);
        results.push({
          id: b.id,
          label: b.name,
          sublabel: `${b.location_label}${b.profiles?.name ? " · " + b.profiles.name : ""}`,
          type: "food",
          icon: "food",
        });
      }
    });
    return results;
  }, [batches]);

  // Handle suggestion select → highlight card + pan map
  const handleSuggestionSelect = useCallback(
    (s: SearchSuggestion) => {
      const found = batches.find((b) => b.id === s.id);
      if (!found) return;
      selectBatchAndGoToPage(found);
      const pan = (mapRef: React.RefObject<any>) => {
        if (mapRef.current) {
          mapRef.current.setView(
            [found.location_lat, found.location_lng],
            15,
            { animate: true }
          );
        }
      };
      pan(leafletMapRef);
      pan(leafletFullMapRef);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [batches]
  );


  // Auto select active item based on current page
  useEffect(() => {
    if (paginatedBatches.length > 0) {
      // If selectedBatch is not in paginatedBatches, select the first one of this page
      const isSelectedInPage = paginatedBatches.some(b => b.id === selectedBatch?.id);
      if (!isSelectedInPage) {
        setSelectedBatch(paginatedBatches[0]);
      }
    } else {
      setSelectedBatch(null);
    }
  }, [paginatedBatches, selectedBatch]);

  // Leaflet Map Init
  useEffect(() => {
    if ((isMobile && view !== "map") || !mapRef.current || userLat === null) return;

    // If already initialised (e.g. tab switch), just refresh tile sizes
    if (leafletMapRef.current) {
      const t = setTimeout(() => leafletMapRef.current?.invalidateSize(), 150);
      return () => clearTimeout(t);
    }

    // Small delay so the container is fully painted before Leaflet measures it
    const initTimer = setTimeout(async () => {
      if (!mapRef.current) return;                  // container may have gone
      if (leafletMapRef.current) return;            // already initialised by parallel run

      const L = (await import("leaflet")).default;
      if (!mapRef.current) return;

      const map = L.map(mapRef.current, {
        center: [userLat!, userLng!],
        zoom: 13,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      const userIcon = L.divIcon({
        className: "user-gps-icon",
        html: `<div class="user-pulse-marker"><div class="core"></div><div class="pulse"></div></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      L.marker([userLat!, userLng!], { icon: userIcon })
        .addTo(map)
        .bindPopup("Lokasi Anda");

      leafletMapRef.current = map;
      setMapInstance(map);

      // Multiple staged invalidations to cover slow layout passes
      setTimeout(() => map.invalidateSize(), 200);
      setTimeout(() => map.invalidateSize(), 500);
      setTimeout(() => map.invalidateSize(), 1000);
    }, 50);

    return () => {
      clearTimeout(initTimer);
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        setMapInstance(null);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, userLat, userLng, isMobile, !!selectedBatch, mapKey]);

  // Safety-net: invalidate map size whenever the panel finishes re-rendering
  useEffect(() => {
    if (!mapInstance) return;
    const timer = setTimeout(() => mapInstance.invalidateSize(), 100);
    return () => clearTimeout(timer);
  }, [mapInstance, selectedBatch]);

  // Full-screen Peta map: init when view === 'map', destroy when back to 'list'
  useEffect(() => {
    if (view !== "map" || userLat === null) return;

    const timer = setTimeout(async () => {
      if (!mapFullRef.current || leafletFullMapRef.current) return;

      const L = (await import("leaflet")).default;
      const map = L.map(mapFullRef.current, {
        center: [userLat!, userLng!],
        zoom: 13,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      // User location marker
      const userIcon = L.divIcon({
        className: "user-gps-icon",
        html: `<div class="user-pulse-marker"><div class="core"></div><div class="pulse"></div></div>`,
        iconSize: [24, 24], iconAnchor: [12, 12],
      });
      L.marker([userLat!, userLng!], { icon: userIcon }).addTo(map).bindPopup("Lokasi Anda");

      // Handle popupopen event to mount events on raw HTML
      map.on("popupopen", (e: any) => {
        const container = e.popup.getElement();
        const btn = container.querySelector(`[id^="claim-popup-btn-"]`);
        if (btn) {
          btn.addEventListener("click", () => {
            const activeBatch = selectedBatchRef.current;
            if (activeBatch) {
              startClaimFlow(activeBatch);
            }
          });
        }
      });

      map.on("popupclose", () => {
        setSelectedBatch(null);
      });

      leafletFullMapRef.current = map;
      setFullMapInstance(map);
      setTimeout(() => map.invalidateSize(), 150);
    }, 100);

    return () => {
      clearTimeout(timer);
      if (leafletFullMapRef.current) {
        leafletFullMapRef.current.remove();
        leafletFullMapRef.current = null;
        setFullMapInstance(null);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, userLat, userLng]);
  // Render Markers for Full-screen Map when filteredBatches or view changes
  useEffect(() => {
    if (!fullMapInstance || view !== "map") return;

    let active = true;

    const drawFullMarkers = async () => {
      const L = (await import("leaflet")).default;
      if (!active) return;

      // Clear existing full-screen map markers
      if (leafletFullMapRef.current === fullMapInstance) {
        fullMarkersRef.current.forEach((m) => {
          try {
            fullMapInstance.removeLayer(m);
          } catch (e) {
            console.error("Failed to remove marker from full map:", e);
          }
        });
      }
      fullMarkersRef.current = [];

      const newMarkers: any[] = [];

      filteredBatches.forEach((b) => {
        const pinColor = { safe: "#3AA65A", urgent: "#F0A93B", "non-consumption": "#D14343" }[b.freshness_status] ?? "#9AA39C";
        const icon = L.divIcon({
          className: "custom-full-map-marker",
          html: `<div style="width:32px;height:32px;border-radius:50%;background:${pinColor};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;"><svg width="14" height="14" fill="white" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg></div>`,
          iconSize: [32, 32], iconAnchor: [16, 16],
        });

        if (!active) return;

        const marker = L.marker([b.location_lat, b.location_lng], { icon }).addTo(fullMapInstance);

        const freshnessBg = b.freshness_status === "safe" ? "background:#E8F7ED; color:#1F7A3B; border-color:rgba(58,166,90,0.2)" : "background:#FEF6E4; color:#A66A00; border-color:rgba(240,169,59,0.2)";
        const freshnessText = b.freshness_status === "safe" ? "Layak" : "Segera";

        const popupContent = `
          <div style="font-family: inherit; width: 220px; line-height: 1.4;">
            <div style="display: flex; justify-content: space-between; align-items: start; gap: 8px; margin-bottom: 6px; padding-right: 18px;">
              <h4 style="margin: 0; font-size: 12px; font-weight: 800; color: #1B1F1C; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1;">${b.name}</h4>
              <span style="font-size: 8px; font-weight: 800; padding: 2px 6px; border-radius: 9999px; border: 1px solid; shrink-0; text-transform: uppercase; ${freshnessBg}">
                ${freshnessText}
              </span>
            </div>
            <p style="margin: 0 0 6px 0; font-size: 10px; color: #9AA39C; font-weight: 600;">oleh ${b.profiles?.name || "Warung Makan Sederhana"}</p>
            <div style="display: flex; gap: 12px; font-size: 9px; color: #5B655D; font-weight: 700; border-top: 1px solid #F4F6F3; padding-top: 6px; margin-bottom: 8px; align-items: center;">
              <span style="display: flex; align-items: center; gap: 3px;">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#2F6E4F" stroke-width="3" style="display: inline-block;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                ${b.distance_km?.toFixed(1)} km
              </span>
              <span style="display: flex; align-items: center; gap: 3px;">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#2F6E4F" stroke-width="3" style="display: inline-block;"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                ${b.quantity} ${b.unit}
              </span>
            </div>
            <button 
              id="claim-popup-btn-${b.id}"
              style="width: 100%; height: 28px; background: #2F6E4F; color: white; border: none; border-radius: 6px; font-size: 10px; font-weight: bold; cursor: pointer; transition: background 0.2s;"
              onmouseover="this.style.background='#1E4A35'"
              onmouseout="this.style.background='#2F6E4F'"
            >
              Klaim Surplus
            </button>
          </div>
        `;

        marker.bindPopup(popupContent, {
          closeButton: true,
          offset: [0, -8],
        });

        marker.on("click", () => {
          selectBatchAndGoToPage(b);
        });
        newMarkers.push(marker);
      });

      if (active) {
        fullMarkersRef.current = newMarkers;
      } else {
        if (leafletFullMapRef.current === fullMapInstance) {
          newMarkers.forEach((m) => {
            try {
              fullMapInstance.removeLayer(m);
            } catch (e) {
              console.error("Failed to remove full marker:", e);
            }
          });
        }
      }
    };

    drawFullMarkers();

    return () => {
      active = false;
    };
  }, [filteredBatches, fullMapInstance, view]);

  // Render Markers
  useEffect(() => {
    if (!mapInstance || userLat === null) return;

    let active = true;

    if (leafletMapRef.current === mapInstance) {
      markersRef.current.forEach((m) => {
        try {
          mapInstance.removeLayer(m);
        } catch (e) {
          console.error("Failed to remove marker from map:", e);
        }
      });
    }
    markersRef.current = [];

    const drawMarkers = async () => {
      const L = (await import("leaflet")).default;
      if (!active) return;

      // Guard: if the map was destroyed while we were waiting for the import, bail out
      if (!leafletMapRef.current || leafletMapRef.current !== mapInstance) return;

      const newMarkers: any[] = [];

      filteredBatches.forEach((b) => {
        const startColor = {
          safe: "#3AA65A",
          urgent: "#F0A93B",
          "non-consumption": "#D14343",
        }[b.freshness_status] ?? "#9AA39C";

        const foodIcon = L.divIcon({
          className: "food-map-pin-icon",
          html: `
            <div class="food-pin-container">
              <svg width="36" height="46" viewBox="0 0 36 46" fill="none" xmlns="http://www.w3.org/2000/svg">
                <ellipse cx="18" cy="42" rx="7" ry="2" fill="rgba(0,0,0,0.18)" />
                <path d="M18 0C8.05888 0 0 8.05888 0 18C0 28.5 18 44 18 44C18 44 36 28.5 36 18C36 8.05888 27.9411 0 18 0Z" fill="${startColor}" />
                <circle cx="18" cy="18" r="11" fill="white" />
                <svg x="10" y="10" width="16" height="16" viewBox="0 0 24 24">
                  <path fill="${startColor}" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
              </svg>
            </div>
          `,
          iconSize: [36, 46],
          iconAnchor: [18, 44],
          popupAnchor: [0, -42],
        });

        // Second guard: re-check the map is still alive before adding each marker
        if (!leafletMapRef.current) return;

        const marker = L.marker([b.location_lat, b.location_lng], { icon: foodIcon })
          .addTo(mapInstance);

        marker.on("click", () => {
          selectBatchAndGoToPage(b);
        });

        marker.bindPopup(`
          <div style="min-width:180px; font-family: sans-serif; line-height: 1.4;">
            <strong style="font-size:13px; color:#1B1F1C; display:block; margin-bottom:2px;">${b.name}</strong>
            <span style="font-size:11px; color:#5B655D; display:block; margin-bottom:6px;">${b.category} · ${b.quantity} ${b.unit}</span>
          </div>
        `);

        newMarkers.push(marker);
      });

      if (active) {
        markersRef.current = newMarkers;
      } else {
        if (leafletMapRef.current === mapInstance) {
          newMarkers.forEach((m) => {
            try {
              mapInstance.removeLayer(m);
            } catch (e) {
              console.error("Failed to remove marker from map:", e);
            }
          });
        }
      }
    };

    drawMarkers();

    return () => {
      active = false;
    };
  }, [filteredBatches, mapInstance, userLat]);

  // Render Visual Radius Circle for List-view Mini Map
  useEffect(() => {
    if (!mapInstance || userLat === null || userLng === null) return;

    if (radiusCircleRef.current) {
      if (leafletMapRef.current === mapInstance) {
        try {
          mapInstance.removeLayer(radiusCircleRef.current);
        } catch (e) {
          console.error("Failed to remove radius circle:", e);
        }
      }
      radiusCircleRef.current = null;
    }

    if (radiusKm === 99999) return;

    let active = true;

    const drawCircle = async () => {
      const L = (await import("leaflet")).default;
      if (!active) return;
      if (!leafletMapRef.current || leafletMapRef.current !== mapInstance) return;

      const circle = L.circle([userLat, userLng], {
        radius: radiusKm * 1000,
        color: "#2F6E4F",
        fillColor: "#2F6E4F",
        fillOpacity: 0.04,
        weight: 1.5,
        dashArray: "4, 6",
      }).addTo(mapInstance);

      if (active) {
        radiusCircleRef.current = circle;
        // Adjust map bounds to fit the circle area nicely
        mapInstance.fitBounds(circle.getBounds(), { padding: [10, 10] });
      } else {
        if (leafletMapRef.current === mapInstance) {
          try {
            mapInstance.removeLayer(circle);
          } catch (e) {
            console.error("Failed to remove radius circle:", e);
          }
        }
      }
    };

    drawCircle();

    return () => {
      active = false;
      if (radiusCircleRef.current && mapInstance && leafletMapRef.current === mapInstance) {
        try {
          mapInstance.removeLayer(radiusCircleRef.current);
        } catch (e) {
          console.error("Failed to remove radius circle:", e);
        }
      }
      radiusCircleRef.current = null;
    };
  }, [mapInstance, userLat, userLng, radiusKm]);

  // Render Visual Radius Circle for Full-screen Map
  useEffect(() => {
    if (!fullMapInstance || userLat === null || userLng === null) return;

    if (fullRadiusCircleRef.current) {
      if (leafletFullMapRef.current === fullMapInstance) {
        try {
          fullMapInstance.removeLayer(fullRadiusCircleRef.current);
        } catch (e) {
          console.error("Failed to remove full radius circle:", e);
        }
      }
      fullRadiusCircleRef.current = null;
    }

    if (radiusKm === 99999) return;

    let active = true;

    const drawFullCircle = async () => {
      const L = (await import("leaflet")).default;
      if (!active) return;
      if (!leafletFullMapRef.current || leafletFullMapRef.current !== fullMapInstance) return;

      const circle = L.circle([userLat, userLng], {
        radius: radiusKm * 1000,
        color: "#2F6E4F",
        fillColor: "#2F6E4F",
        fillOpacity: 0.04,
        weight: 1.5,
        dashArray: "4, 6",
      }).addTo(fullMapInstance);

      if (active) {
        fullRadiusCircleRef.current = circle;
        // Adjust map bounds to fit the circle area nicely
        fullMapInstance.fitBounds(circle.getBounds(), { padding: [10, 10] });
      } else {
        if (leafletFullMapRef.current === fullMapInstance) {
          try {
            fullMapInstance.removeLayer(circle);
          } catch (e) {
            console.error("Failed to remove full radius circle:", e);
          }
        }
      }
    };

    drawFullCircle();

    return () => {
      active = false;
      if (fullRadiusCircleRef.current && fullMapInstance && leafletFullMapRef.current === fullMapInstance) {
        try {
          fullMapInstance.removeLayer(fullRadiusCircleRef.current);
        } catch (e) {
          console.error("Failed to remove full radius circle:", e);
        }
      }
      fullRadiusCircleRef.current = null;
    };
  }, [fullMapInstance, userLat, userLng, radiusKm]);

  // Draw route polyline
  useEffect(() => {
    if (!mapInstance || userLat === null) return;

    if (routeLineRef.current) {
      if (leafletMapRef.current === mapInstance) {
        try {
          mapInstance.removeLayer(routeLineRef.current);
        } catch (e) {
          console.error("Failed to remove route line:", e);
        }
      }
      routeLineRef.current = null;
    }

    if (selectedBatch) {
      const initRoute = async () => {
        const L = (await import("leaflet")).default;

        // Guard: bail out if the map was destroyed while awaiting the import
        if (!leafletMapRef.current || leafletMapRef.current !== mapInstance) return;

        const points = [
          [userLat, userLng] as [number, number],
          [selectedBatch.location_lat, selectedBatch.location_lng] as [number, number]
        ];
        
        routeLineRef.current = L.polyline(points, {
          color: "#D14343",
          weight: 3.5,
          dashArray: "6, 8",
          opacity: 0.9
        }).addTo(mapInstance);

        mapInstance.fitBounds(points, { padding: [50, 50] });
      };
      initRoute();
    } else {
      if (leafletMapRef.current === mapInstance) {
        try {
          mapInstance.setView([userLat, userLng], 13);
        } catch (e) {
          console.error("Failed to set map view:", e);
        }
      }
    }
  }, [selectedBatch, mapInstance, userLat, userLng]);

  const selectedBatchRef = useRef<SurplusBatch | null>(null);
  const currentUserRef = useRef<any>(null);

  useEffect(() => {
    selectedBatchRef.current = selectedBatch;
  }, [selectedBatch]);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  // Start claim flow (verification and confirm dialog trigger)
  const startClaimFlow = (batch: SurplusBatch) => {
    const user = currentUserRef.current;
    if (!user) {
      showToast("Silakan masuk terlebih dahulu.", "warning");
      return;
    }

    const role = user?.user_metadata?.role;
    if (role !== "volunteer" && role !== "non-consumption") {
      showToast("Hanya relawan atau pengelola non-konsumsi yang dapat mengklaim surplus.", "error");
      return;
    }

    setBatchToClaim(batch);
    setShowConfirmClaim(true);
  };

  // Actual claim database worker
  const confirmClaimBatch = async () => {
    if (!batchToClaim) return;
    const user = currentUserRef.current;
    if (!user) {
      showToast("Silakan masuk terlebih dahulu.", "warning");
      return;
    }

    setIsUpdating(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("surplus_batch")
      .update({ status: "Diklaim" })
      .eq("id", batchToClaim.id);

    if (!error) {
      await supabase.from("distribution_log").insert({
        batch_id: batchToClaim.id,
        volunteer_id: user.id,
        status: "Diklaim",
        timestamp: new Date().toISOString(),
      });
      
      showToast("Surplus pangan berhasil diklaim!", "success");
      // Remove from active list
      setBatches(prev => prev.filter(b => b.id !== batchToClaim.id));
      setSelectedBatch(null);
      setBatchToClaim(null);
      setShowConfirmClaim(false);

      // Close open map popups
      if (leafletFullMapRef.current) {
        leafletFullMapRef.current.closePopup();
      }
    } else {
      showToast("Gagal mengklaim surplus pangan.", "error");
    }
    setIsUpdating(false);
  };

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const updated = { ...prev, [id]: !prev[id] };
      showToast(updated[id] ? "Ditambahkan ke favorit!" : "Dihapus dari favorit.", "info");
      return updated;
    });
  };

  const timeRemaining = (expiry: string) => {
    const diff = new Date(expiry).getTime() - Date.now();
    if (diff <= 0) return "Sudah kedaluwarsa";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) return `${Math.floor(hours / 24)} hari`;
    if (hours > 0) return `${hours}j ${mins}m`;
    return `${mins} mnt`;
  };

  const totalAvailable = filteredBatches.length;
  const closestDistance = filteredBatches.length > 0 
    ? `${Math.min(...filteredBatches.map(b => b.distance_km || 999)).toFixed(1)} km` 
    : "-";
  const avgDistance = filteredBatches.length > 0
    ? (filteredBatches.reduce((acc, b) => acc + (b.distance_km || 0), 0) / filteredBatches.length).toFixed(1)
    : "2.7";

  return (
    <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto space-y-6 flex flex-col min-h-screen pb-12">

      {/* ===== VERIFICATION GATE ===== */}
      {isVerified === false && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="bg-white rounded-[24px] border-2 border-[#E88C2D]/30 shadow-lg p-8 max-w-md w-full">
            <div className="w-16 h-16 rounded-full bg-[#FBEBD8] flex items-center justify-center mx-auto mb-5">
              <ShieldAlert size={30} className="text-[#E88C2D]" />
            </div>
            <h2 className="text-xl font-bold text-[#1B1F1C] mb-2">Akses Terbatas</h2>
            <p className="text-sm text-[#5B655D] leading-relaxed mb-6">
              Akun relawan Anda belum diverifikasi oleh admin. Verifikasi diperlukan agar distribusi surplus pangan tepat sasaran.
            </p>
            <div className="bg-[#F4F6F3] rounded-[14px] p-4 mb-6 text-left space-y-2">
              <p className="text-[11px] font-bold text-[#5B655D] uppercase tracking-wider">Proses Verifikasi</p>
              <div className="flex items-center gap-2.5 text-xs text-[#5B655D]">
                <ShieldCheck size={13} className="text-[#E88C2D] flex-shrink-0" />
                Admin meninjau kategori dan tujuan organisasi Anda
              </div>
              <div className="flex items-center gap-2.5 text-xs text-[#5B655D]">
                <ShieldCheck size={13} className="text-[#E88C2D] flex-shrink-0" />
                Biasanya selesai dalam 1×24 jam
              </div>
              <div className="flex items-center gap-2.5 text-xs text-[#5B655D]">
                <ShieldCheck size={13} className="text-[#E88C2D] flex-shrink-0" />
                Notifikasi WhatsApp dikirim setelah disetujui
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Link href="/app/profile">
                <button className="w-full py-2.5 rounded-[10px] bg-[#2F6E4F] text-white text-sm font-semibold hover:bg-[#255A3F] transition-colors">
                  Lengkapi Profil Saya
                </button>
              </Link>
              <Link href="/app/dashboard">
                <button className="w-full py-2.5 rounded-[10px] border border-[#E4F0E8] text-[#5B655D] text-sm font-semibold hover:bg-[#F4F6F3] transition-colors">
                  Kembali ke Dashboard
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ===== MAIN CONTENT (only shown when verified or null) ===== */}
      {isVerified !== false && <>

      {/* Top Header & KPI Cards */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1B1F1C]">Surplus Terdekat</h1>
          <p className="text-sm text-[#9AA39C] mt-1">
            Penerima menemukan surplus pangan yang tersedia di sekitar lokasi.
          </p>
        </div>
        
        {/* KPI Cards */}
        <div className="flex flex-wrap gap-3 w-full xl:w-auto">
          <div className="bg-white border border-[#E4F0E8] rounded-[12px] px-4 py-3 min-w-[130px] flex-1 xl:flex-none">
            {loading ? (
              <div className="space-y-1.5">
                <div className="h-6 w-8 bg-[#F0F3F1] rounded-md animate-pulse" />
                <div className="h-2.5 w-20 bg-[#F0F3F1] rounded-full animate-pulse" />
              </div>
            ) : (
              <>
                <span className="text-xl font-bold text-[#1B1F1C] block">{totalAvailable}</span>
                <span className="text-[10px] text-[#9AA39C] font-semibold mt-0.5 block">Surplus Terdekat</span>
              </>
            )}
          </div>
          <div className="bg-white border border-[#E4F0E8] rounded-[12px] px-4 py-3 min-w-[130px] flex-1 xl:flex-none">
            {loading ? (
              <div className="space-y-1.5">
                <div className="h-6 w-6 bg-[#F0F3F1] rounded-md animate-pulse" />
                <div className="h-2.5 w-16 bg-[#F0F3F1] rounded-full animate-pulse" />
              </div>
            ) : (
              <>
                <span className="text-xl font-bold text-[#1B1F1C] block">3</span>
                <span className="text-[10px] text-[#9AA39C] font-semibold mt-0.5 block">Klaim Aktif</span>
              </>
            )}
          </div>
          <div className="bg-white border border-[#E4F0E8] rounded-[12px] px-4 py-3 min-w-[130px] flex-1 xl:flex-none">
            {loading ? (
              <div className="space-y-1.5">
                <div className="h-6 w-16 bg-[#F0F3F1] rounded-md animate-pulse" />
                <div className="h-2.5 w-24 bg-[#F0F3F1] rounded-full animate-pulse" />
              </div>
            ) : (
              <>
                <span className="text-xl font-bold text-[#1B1F1C] block">{avgDistance} km</span>
                <span className="text-[10px] text-[#9AA39C] font-semibold mt-0.5 block">Rata-rata Jarak</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center">
        {/* Search with autocomplete */}
        <SearchAutocomplete
          value={search}
          onChange={setSearch}
          placeholder="Cari makanan, lokasi, atau donor..."
          suggestions={searchSuggestions}
          onSelect={handleSuggestionSelect}
          className="flex-1 w-full"
        />

        {/* Filters dropdowns */}
        <div className="flex gap-2 w-full md:w-auto">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="h-10 px-3 rounded-[8px] border border-[#9AA39C] bg-white text-xs text-[#5B655D] focus:outline-none cursor-pointer flex-1 md:flex-initial"
          >
            <option value="">Kategori</option>
            {["Makanan Matang", "Roti/Bakery", "Buah Potong", "Sayuran", "Bahan Segar"].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            className="h-10 px-3 rounded-[8px] border border-[#9AA39C] bg-white text-xs text-[#5B655D] focus:outline-none cursor-pointer flex-1 md:flex-initial"
          >
            <option value={2}>2 km</option>
            <option value={5}>5 km</option>
            <option value={10}>10 km</option>
            <option value={20}>20 km</option>
            <option value={99999}>Semua Jarak</option>
          </select>

          <select
            value={filterFreshness}
            onChange={(e) => setFilterFreshness(e.target.value)}
            className="h-10 px-3 rounded-[8px] border border-[#9AA39C] bg-white text-xs text-[#5B655D] focus:outline-none cursor-pointer flex-1 md:flex-initial"
          >
            <option value="">Kelayakan</option>
            <option value="safe">Layak Konsumsi</option>
            <option value="urgent">Segera Ambil</option>
          </select>

          {/* Toggle button group */}
          <div className="flex bg-[#F4F6F3] rounded-[8px] p-0.5 border border-[#E4F0E8] select-none shrink-0">
            <button
              onClick={() => setView("list")}
              className={`px-3 py-1 text-xs font-bold rounded-[6px] transition-all flex items-center gap-1 ${
                view === "list"
                  ? "bg-white text-[#1B1F1C] shadow-sm"
                  : "text-[#5B655D] hover:text-[#1B1F1C]"
              }`}
            >
              <List size={12} />
              List
            </button>
            <button
              onClick={() => setView("map")}
              className={`px-3 py-1 text-xs font-bold rounded-[6px] transition-all flex items-center gap-1 ${
                view === "map"
                  ? "bg-white text-[#1B1F1C] shadow-sm"
                  : "text-[#5B655D] hover:text-[#1B1F1C]"
              }`}
            >
              <MapIcon size={12} />
              Peta
            </button>
          </div>
        </div>
      </div>

      {/* Grid Split-Screen Layout — List View */}
      {view === "list" && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 items-start">
        {/* Left Column: Surplus Cards list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="space-y-3">
            {loading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-[16px] border border-[#E4F0E8] bg-white">
                    {/* Thumbnail skeleton */}
                    <div className="w-24 h-24 bg-[#F0F3F1] rounded-[12px] flex-shrink-0 animate-pulse" />

                    {/* Content skeleton */}
                    <div className="flex-1 flex flex-col justify-between py-1 gap-2">
                      {/* Title + badge row */}
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 space-y-1.5">
                          <div className="h-3.5 bg-[#E8EDEA] rounded-full animate-pulse w-3/4" />
                          <div className="h-2.5 bg-[#F0F3F1] rounded-full animate-pulse w-1/2" />
                        </div>
                        <div className="h-5 w-14 bg-[#E8EDEA] rounded-full animate-pulse shrink-0" />
                      </div>

                      {/* Meta row (distance, donor) */}
                      <div className="flex gap-3 items-center">
                        <div className="h-2.5 w-16 bg-[#F0F3F1] rounded-full animate-pulse" />
                        <div className="h-2.5 w-20 bg-[#F0F3F1] rounded-full animate-pulse" />
                        <div className="h-2.5 w-12 bg-[#F0F3F1] rounded-full animate-pulse" />
                      </div>

                      {/* Bottom badge row */}
                      <div className="flex gap-2">
                        <div className="h-5 w-20 bg-[#F0F3F1] rounded-full animate-pulse" />
                        <div className="h-5 w-16 bg-[#F0F3F1] rounded-full animate-pulse" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredBatches.length === 0 ? (
              <EmptyState
                title="Tidak Ada Surplus Terdekat"
                description="Coba ubah kriteria pencarian atau naikkan radius."
                variant="map"
              />
            ) : (
              <>
                <div className="space-y-3">
                  {paginatedBatches.map((b) => (
                    <div
                      key={b.id}
                      onClick={() => setSelectedBatch(b)}
                      className={`flex gap-4 p-4 rounded-[16px] border cursor-pointer transition-all ${
                        selectedBatch?.id === b.id
                          ? "bg-[#E4F0E8] border-[#2F6E4F] shadow-sm"
                          : "bg-white border-[#E4F0E8] hover:shadow-md"
                      }`}
                    >
                      {/* Visual X Placeholder / Image */}
                      <div className="w-24 h-24 bg-[#F4F6F3] rounded-[12px] border border-[#E4F0E8] flex-shrink-0 flex items-center justify-center relative overflow-hidden">
                        {b.photo_urls && b.photo_urls.length > 0 ? (
                          <img
                            src={b.photo_urls[0]}
                            alt={b.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <svg className="w-full h-full text-[#E4F0E8]" stroke="currentColor" fill="none" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <line x1="0" y1="0" x2="100" y2="100" strokeWidth="1.5" />
                            <line x1="100" y1="0" x2="0" y2="100" strokeWidth="1.5" />
                          </svg>
                        )}
                      </div>

                      {/* Card Center Info */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <h3 className="text-sm font-extrabold text-[#1B1F1C] truncate">{b.name}</h3>
                          <p className="text-[10px] text-[#9AA39C] font-semibold mt-0.5">
                            Donor: {b.profiles?.name || "Warung Makan Sederhana"}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-[#5B655D] font-bold mt-1.5">
                          <span className="flex items-center gap-0.5">
                            <MapPin size={11} className="text-[#9AA39C]" />
                            {b.distance_km?.toFixed(1)} km
                          </span>
                          <span className="flex items-center gap-0.5">
                            <Package size={11} className="text-[#9AA39C]" />
                            {b.quantity} {b.unit}
                          </span>
                          <span className="flex items-center gap-0.5">
                            <Clock size={11} className="text-[#9AA39C]" />
                            {timeRemaining(b.estimated_expiry)}
                          </span>
                        </div>

                        <p className="text-[10px] text-[#9AA39C] mt-2 line-clamp-1 leading-relaxed font-semibold">
                          {b.notes || "Sisa donasi berlebih dari operasional, dikemas dengan higienis dan rapi."}
                        </p>
                      </div>

                      {/* Card Right Actions */}
                      <div className="flex flex-col items-end justify-between shrink-0 pl-2">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase border ${
                          b.freshness_status === "safe"
                            ? "bg-[#E8F7ED] text-[#1F7A3B] border-[#3AA65A]/20"
                            : "bg-[#FEF6E4] text-[#A66A00] border-[#F0A93B]/20"
                        }`}>
                          {b.freshness_status === "safe" ? "Layak Konsumsi" : "Segera Ambil"}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startClaimFlow(b);
                          }}
                          className="h-8 px-4 border border-[#2F6E4F] hover:bg-[#E4F0E8] text-[10px] font-bold text-[#2F6E4F] rounded-[8px] transition-colors"
                        >
                          Klaim
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-1.5 pt-4">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      className="px-3 h-8 rounded-[8px] border border-[#E4F0E8] bg-white text-[10px] font-bold text-[#5B655D] disabled:opacity-40 hover:bg-[#F4F6F3] transition-colors"
                    >
                      Sebelumnya
                    </button>
                    <div className="flex items-center gap-1">
                      {[...Array(totalPages)].map((_, i) => (
                        <button
                          key={i + 1}
                          onClick={() => setCurrentPage(i + 1)}
                          className={`w-8 h-8 rounded-[8px] text-[10px] font-bold transition-all ${
                            currentPage === i + 1
                              ? "bg-[#2F6E4F] text-white shadow-sm"
                              : "border border-[#E4F0E8] bg-white text-[#5B655D] hover:bg-[#F4F6F3]"
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      className="px-3 h-8 rounded-[8px] border border-[#E4F0E8] bg-white text-[10px] font-bold text-[#5B655D] disabled:opacity-40 hover:bg-[#F4F6F3] transition-colors"
                    >
                      Selanjutnya
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right Column: Detailed visual route & info panel */}
        <div className="space-y-4">
          {/* Detailed Info Card */}
          <div className="bg-white rounded-[20px] shadow-sm p-5 border border-[#E4F0E8] space-y-4">
            {loading ? (
              /* Right panel skeleton */
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="h-5 w-3/4 bg-[#E8EDEA] rounded-full animate-pulse" />
                  <div className="h-5 w-20 bg-[#F0F3F1] rounded-full animate-pulse" />
                  <div className="h-3 w-1/2 bg-[#F0F3F1] rounded-full animate-pulse" />
                  <div className="flex gap-3 pt-1">
                    <div className="h-3 w-12 bg-[#F0F3F1] rounded-full animate-pulse" />
                    <div className="h-3 w-16 bg-[#F0F3F1] rounded-full animate-pulse" />
                    <div className="h-3 w-12 bg-[#F0F3F1] rounded-full animate-pulse" />
                  </div>
                </div>
                {/* Map skeleton */}
                <div className="h-44 rounded-[14px] bg-[#F0F3F1] animate-pulse" />
                {/* Grid skeleton */}
                <div className="grid grid-cols-2 gap-4 border-t border-[#F4F6F3] pt-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="h-2 w-16 bg-[#F0F3F1] rounded-full animate-pulse" />
                      <div className="h-3 w-24 bg-[#E8EDEA] rounded-full animate-pulse" />
                    </div>
                  ))}
                </div>
                {/* Button skeleton */}
                <div className="h-10 w-full bg-[#F0F3F1] rounded-[10px] animate-pulse" />
              </div>
            ) : selectedBatch ? (
              <div className="space-y-4">
                <div>
                  <h2 className="text-base font-extrabold text-[#1B1F1C]">{selectedBatch.name}</h2>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold mt-1.5 border ${
                    selectedBatch.freshness_status === "safe"
                      ? "bg-[#E8F7ED] text-[#1F7A3B] border-[#3AA65A]/20"
                      : "bg-[#FEF6E4] text-[#A66A00] border-[#F0A93B]/20"
                  }`}>
                    {selectedBatch.freshness_status === "safe" ? "Layak Konsumsi" : "Segera Ambil"}
                  </span>
                  <p className="text-xs text-[#9AA39C] mt-2 font-semibold">
                    Donor: {selectedBatch.profiles?.name || "Warung Makan Sederhana"}
                  </p>
                  
                  <div className="flex items-center gap-3 text-[10px] text-[#5B655D] font-bold mt-2">
                    <span className="flex items-center gap-0.5">
                      <MapPin size={11} className="text-[#9AA39C]" />
                      {selectedBatch.distance_km?.toFixed(1)} km
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Package size={11} className="text-[#9AA39C]" />
                      {selectedBatch.quantity} {selectedBatch.unit}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Clock size={11} className="text-[#9AA39C]" />
                      {timeRemaining(selectedBatch.estimated_expiry)}
                    </span>
                  </div>
                </div>

                {/* Leaflet Map for Pickup */}
                <div className="h-44 rounded-[14px] overflow-hidden relative border border-[#E4F0E8]">
                  <div key={mapKey} ref={mapRef} className="w-full h-full" />
                  {userLat === null && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-[20px] backdrop-blur-[1px]">
                      <p className="text-xs text-[#9AA39C]">Memuat peta...</p>
                    </div>
                  )}
                </div>

                {/* Details Table */}
                <div className="grid grid-cols-2 gap-4 border-t border-[#F4F6F3] pt-4 text-xs font-semibold">
                  <div>
                    <span className="text-[10px] text-[#9AA39C] block">Lokasi Donor</span>
                    <span className="text-[#1B1F1C] mt-0.5 block leading-relaxed">{selectedBatch.location_label}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#9AA39C] block">Estimasi ke Lokasi Anda</span>
                    <span className="text-[#1B1F1C] mt-0.5 block leading-relaxed">
                      {selectedBatch.distance_km?.toFixed(1)} km - 5-7 menit
                    </span>
                  </div>
                </div>

                {/* Instructions Section */}
                <div className="border-t border-[#F4F6F3] pt-4">
                  <h3 className="text-xs font-bold text-[#1B1F1C] mb-2.5">Instruksi Pickup</h3>
                  <ul className="space-y-1.5 text-[10px] text-[#5B655D] font-semibold list-disc list-inside leading-relaxed">
                    <li>Hubungi donor sebelum berangkat.</li>
                    <li>Ambil di meja kasir.</li>
                    <li>Bawa tas/kotak sendiri.</li>
                    <li>Datang sesuai jadwal.</li>
                  </ul>
                </div>

                {/* Actions row */}
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => selectedBatch && startClaimFlow(selectedBatch)}
                    disabled={isUpdating}
                    className="flex-1 h-10 bg-[#2F6E4F] hover:bg-[#1E4A35] text-white text-xs font-bold rounded-[8px]"
                  >
                    Klaim Surplus
                  </Button>
                  <Button
                    onClick={() => toggleFavorite(selectedBatch.id)}
                    variant="secondary"
                    className="w-10 h-10 rounded-[8px] border border-[#9AA39C] bg-white p-0 flex items-center justify-center"
                  >
                    <Heart
                      size={16}
                      className={favorites[selectedBatch.id] ? "fill-red-500 stroke-red-500" : "text-[#5B655D]"}
                    />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-8">
                <MapPin className="text-[#9AA39C] mb-2 animate-bounce" size={28} />
                <p className="text-xs font-bold text-[#1B1F1C]">Tidak Ada Surplus Terpilih</p>
                <p className="text-[10px] text-[#9AA39C] max-w-sm mt-1">
                  Pilih donasi pangan terdekat dari daftar untuk memvisualisasikan rute penjemputan terpadu.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      )} {/* end view === "list" */}

      {/* Full-screen Peta View */}
      {view === "map" && (
        <div className="relative rounded-[20px] overflow-hidden border border-[#E4F0E8]" style={{ minHeight: "calc(100vh - 280px)" }}>
          <div key={`full-${mapKey}`} ref={mapFullRef} className="w-full h-full absolute inset-0" />

          {/* Count badge — top-RIGHT to avoid Leaflet zoom controls */}
          <div className="absolute top-3 right-3 z-[400] bg-white/95 backdrop-blur-sm rounded-[10px] px-3 py-2 shadow-md border border-[#E4F0E8] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#2F6E4F] inline-block" />
            <span className="text-[11px] font-semibold text-[#1B1F1C]">{filteredBatches.length} surplus</span>
            <span className="text-[11px] text-[#9AA39C]">dalam {radiusKm === 99999 ? "semua jarak" : `${radiusKm} km`}</span>
          </div>

          {/* Legend — bottom-left */}
          <div className="absolute bottom-3 left-3 z-[400] flex items-center gap-3 bg-white/95 backdrop-blur-sm rounded-[10px] px-3 py-2 shadow-md border border-[#E4F0E8] text-[10px] font-semibold text-[#5B655D]">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#3AA65A] inline-block" />Layak</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#F0A93B] inline-block" />Segera</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#2F6E4F] inline-block border-2 border-white ring-1 ring-[#2F6E4F]" />Saya</span>
          </div>
        </div>
      )}

      <Modal
        isOpen={showConfirmClaim}
        onClose={() => {
          setShowConfirmClaim(false);
          setBatchToClaim(null);
        }}
        title="Konfirmasi Penyelamatan Pangan"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-[#5B655D] leading-relaxed">
            Apakah Anda yakin ingin mengklaim surplus pangan <strong>{batchToClaim?.name}</strong>?
          </p>
          <div className="bg-[#F4F6F3] rounded-[14px] p-4 text-xs space-y-2 text-[#5B655D]">
            <p className="font-bold text-[#1B1F1C] uppercase tracking-wider text-[10px]">Ketentuan Penyelamatan</p>
            <p>• Datang sesuai jadwal dan bawa wadah/tas sendiri.</p>
            <p>• Tunjukkan kode QR saat serah terima di lokasi.</p>
          </div>
          <div className="flex justify-end gap-3 font-sans pt-2">
            <Button
              variant="ghost"
              size="sm"
              className="border border-[#9AA39C] text-[#5B655D] hover:bg-[#F4F6F3]"
              onClick={() => {
                setShowConfirmClaim(false);
                setBatchToClaim(null);
              }}
            >
              Batal
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="bg-[#2F6E4F] hover:bg-[#1E4A35] text-white border-0"
              onClick={confirmClaimBatch}
              disabled={isUpdating}
            >
              Ya, Klaim
            </Button>
          </div>
        </div>
      </Modal>

      <style>{`
        .leaflet-div-icon {
          background: transparent !important;
          border: none !important;
        }
        .user-pulse-marker {
          position: relative;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .user-pulse-marker .core {
          width: 12px;
          height: 12px;
          background-color: #2F6E4F;
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 5px rgba(0,0,0,0.3);
          z-index: 2;
        }
        .user-pulse-marker .pulse {
          position: absolute;
          width: 24px;
          height: 24px;
          background-color: rgba(47, 110, 79, 0.4);
          border-radius: 50%;
          z-index: 1;
          animation: user-pulse-anim 1.8s infinite ease-in-out;
        }
        @keyframes user-pulse-anim {
          0% {
            transform: scale(0.6);
            opacity: 1;
          }
          100% {
            transform: scale(2.2);
            opacity: 0;
          }
        }

        .food-pin-container {
          width: 36px;
          height: 46px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .food-pin-container:hover {
          transform: scale(1.22) translateY(-5px);
          z-index: 9999 !important;
        }

        /* Leaflet Premium Popup Style Overrides */
        .leaflet-popup-content-wrapper {
          border-radius: 16px !important;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
          border: 1px solid #E4F0E8 !important;
          padding: 4px !important;
        }
        .leaflet-popup-content {
          margin: 12px !important;
        }
        .leaflet-popup-close-button {
          top: 10px !important;
          right: 10px !important;
          color: #9AA39C !important;
          font-size: 16px !important;
          font-weight: bold !important;
        }
        .leaflet-popup-tip {
          background: white !important;
          border: 1px solid #E4F0E8 !important;
          box-shadow: none !important;
        }
        .custom-full-map-marker {
          background: transparent !important;
          border: none !important;
          pointer-events: auto !important;
          cursor: pointer !important;
        }
      `}</style>
      </>
      }
    </div>
  );
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
