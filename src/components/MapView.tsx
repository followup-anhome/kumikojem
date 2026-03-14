"use client";

/**
 * MapView.tsx
 * react-leaflet を使用した勤務地 + アンホーム物件マップ。
 * SSRを避けるため、呼び出し側で `dynamic(() => import(...), { ssr: false })` を使うこと。
 */

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// ─── Leaflet デフォルトアイコンの修正 (Next.js対応) ───────
function fixLeafletIcons() {
  // @ts-expect-error private property
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

// ─── カスタムアイコン ──────────────────────────────────────
const createDivIcon = (emoji: string, bgColor: string) =>
  L.divIcon({
    html: `<div style="
      background:${bgColor};
      border:2px solid white;
      border-radius:50%;
      width:36px;
      height:36px;
      display:flex;
      align-items:center;
      justify-content:center;
      font-size:18px;
      box-shadow:0 2px 6px rgba(0,0,0,0.3);
    ">${emoji}</div>`,
    className: "",
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });

const JOB_ICON = createDivIcon("🏭", "#1d4ed8");
const PROPERTY_ICON = createDivIcon("🏠", "#dc2626");

// ─── マップ中心を動的に変更するヘルパー ───────────────────
function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 13, { animate: true });
  }, [lat, lng, map]);
  return null;
}

// ─── Props ────────────────────────────────────────────────
export interface MapProperty {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rent: number;
  floor_plan?: string;
  distance_km?: number;
}

export interface MapViewProps {
  jobLat: number;
  jobLng: number;
  jobTitle: string;
  jobLocation: string;
  properties: MapProperty[];
  radiusKm?: number;
}

// ─── コンポーネント ────────────────────────────────────────
export default function MapView({
  jobLat,
  jobLng,
  jobTitle,
  jobLocation,
  properties,
  radiusKm = 5,
}: MapViewProps) {
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      fixLeafletIcons();
      initialized.current = true;
    }
  }, []);

  return (
    <div className="w-full h-full rounded-xl overflow-hidden">
      <MapContainer
        center={[jobLat, jobLng]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* 中心追従 */}
        <RecenterMap lat={jobLat} lng={jobLng} />

        {/* 半径サークル */}
        <Circle
          center={[jobLat, jobLng]}
          radius={radiusKm * 1000}
          pathOptions={{
            color: "#1d4ed8",
            fillColor: "#1d4ed8",
            fillOpacity: 0.06,
            weight: 1.5,
            dashArray: "6 4",
          }}
        />

        {/* 勤務地マーカー */}
        <Marker position={[jobLat, jobLng]} icon={JOB_ICON}>
          <Popup>
            <div className="text-sm font-medium text-slate-900">{jobTitle}</div>
            <div className="text-xs text-slate-500 mt-0.5">{jobLocation}</div>
          </Popup>
        </Marker>

        {/* 物件マーカー */}
        {properties.map((p) => (
          <Marker key={p.id} position={[p.lat, p.lng]} icon={PROPERTY_ICON}>
            <Popup>
              <div className="min-w-[180px]">
                <div className="font-semibold text-slate-900 text-sm">{p.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">{p.address}</div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-blue-600 font-semibold text-sm">
                    ¥{p.rent.toLocaleString()}/月
                  </span>
                  {p.floor_plan && (
                    <span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                      {p.floor_plan}
                    </span>
                  )}
                </div>
                {p.distance_km !== undefined && (
                  <div className="text-xs text-emerald-600 mt-1">
                    📍 勤務地まで {p.distance_km.toFixed(1)}km
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
