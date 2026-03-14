export const dynamic = "force-dynamic"

/**
 * POST /api/property-recommend
 *
 * 求人の勤務地（座標 or 地名）から半径 N km 以内の
 * アンホーム管理物件を自動レコメンドする。
 *
 * Request:
 *   {
 *     job_lat?: number,
 *     job_lng?: number,
 *     location_name?: string,   // 座標不明時のオフラインジオコーディング用
 *     radius_km?: number,       // デフォルト 5
 *     an_home_only?: boolean,   // デフォルト false（全物件）
 *   }
 *
 * Response:
 *   {
 *     job_location: { lat, lng, resolved_name? },
 *     radius_km: number,
 *     count: number,
 *     properties: PropertyRecommendation[]
 *   }
 */

import { NextRequest, NextResponse } from "next/server";
import { filterPropertiesWithinRadius } from "@/lib/geo-matcher";
import { MOCK_PROPERTIES, type MockProperty } from "@/lib/mock-data";

// ── オフラインジオコーディング辞書 ─────────────────────────────
// 本番は Google Geocoding API or Geocoding JP API に差し替え
const GEOCODE_DICT: { pattern: RegExp; lat: number; lng: number; label: string }[] = [
  { pattern: /西淀川/,           lat: 34.6937, lng: 135.4576, label: "大阪市西淀川区" },
  { pattern: /尼崎/,             lat: 34.7328, lng: 135.4148, label: "兵庫県尼崎市" },
  { pattern: /淀川区/,           lat: 34.7344, lng: 135.4967, label: "大阪市淀川区" },
  { pattern: /北区.*大阪|大阪.*北区/, lat: 34.7024, lng: 135.4959, label: "大阪市北区" },
  { pattern: /中央区.*大阪|大阪.*中央区/, lat: 34.6851, lng: 135.5200, label: "大阪市中央区" },
  { pattern: /天王寺/,           lat: 34.6465, lng: 135.5136, label: "大阪市天王寺区" },
  { pattern: /住之江|住ノ江/,    lat: 34.6133, lng: 135.4880, label: "大阪市住之江区" },
  { pattern: /堺市/,             lat: 34.5733, lng: 135.4830, label: "大阪府堺市" },
  { pattern: /豊中/,             lat: 34.7833, lng: 135.4696, label: "大阪府豊中市" },
  { pattern: /吹田/,             lat: 34.7656, lng: 135.5157, label: "大阪府吹田市" },
  { pattern: /東大阪/,           lat: 34.6794, lng: 135.6011, label: "大阪府東大阪市" },
  { pattern: /神戸/,             lat: 34.6901, lng: 135.1956, label: "兵庫県神戸市" },
  { pattern: /西宮/,             lat: 34.7367, lng: 135.3409, label: "兵庫県西宮市" },
  { pattern: /伊丹/,             lat: 34.7869, lng: 135.4025, label: "兵庫県伊丹市" },
];

function geocodeOffline(locationName: string): { lat: number; lng: number; label: string } | null {
  for (const entry of GEOCODE_DICT) {
    if (entry.pattern.test(locationName)) {
      return { lat: entry.lat, lng: entry.lng, label: entry.label };
    }
  }
  return null;
}

// ── レコメンド理由文を生成 ────────────────────────────────────
function buildRecommendReason(
  p: MockProperty & { distance_km: number }
): { ja: string; en: string } {
  const distJa =
    p.distance_km < 1
      ? `職場まで約${Math.round(p.distance_km * 1000)}m（徒歩圏内）`
      : `職場まで${p.distance_km}km`;

  const distEn =
    p.distance_km < 1
      ? `~${Math.round(p.distance_km * 1000)}m from workplace (walking distance!)`
      : `${p.distance_km}km from workplace`;

  const mgmtJa = p.management_company === "AN_HOME" ? "アンホーム直接管理" : "外部管理";
  const mgmtEn = p.management_company === "AN_HOME" ? "Managed by AN HOME (direct support)" : "External management";

  return {
    ja: `${distJa} ・ 家賃¥${p.rent.toLocaleString()} ・ ${p.floor_plan} ・ ${mgmtJa}`,
    en: `${distEn} ・ ¥${p.rent.toLocaleString()}/mo ・ ${p.floor_plan} ・ ${mgmtEn}`,
  };
}

// ── ハンドラ ──────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      job_lat,
      job_lng,
      location_name,
      radius_km = 5,
      an_home_only = false,
    } = body as {
      job_lat?: number;
      job_lng?: number;
      location_name?: string;
      radius_km?: number;
      an_home_only?: boolean;
    };

    let lat = job_lat;
    let lng = job_lng;
    let resolvedName: string | undefined;

    // 座標が未指定の場合はオフラインジオコーディング
    if ((!lat || !lng) && location_name) {
      const geo = geocodeOffline(location_name);
      if (geo) {
        lat = geo.lat;
        lng = geo.lng;
        resolvedName = geo.label;
      }
    }

    if (!lat || !lng) {
      return NextResponse.json(
        {
          error: "座標を特定できませんでした。job_lat/job_lng または location_name を指定してください。",
          hint: "現在対応エリア: 大阪市各区、尼崎市、豊中市、吹田市、堺市、神戸市、西宮市、伊丹市",
        },
        { status: 400 }
      );
    }

    // フィルタリング（アンホーム管理物件のみ or 全物件）
    const source = an_home_only
      ? MOCK_PROPERTIES.filter((p) => p.management_company === "AN_HOME")
      : MOCK_PROPERTIES;

    const nearby = filterPropertiesWithinRadius({ lat, lng }, source, radius_km);

    const properties = nearby.map((p) => ({
      id: p.id,
      name: p.name,
      address: p.address,
      lat: p.lat,
      lng: p.lng,
      rent: p.rent,
      floor_plan: p.floor_plan,
      management_company: p.management_company,
      house_maker: p.house_maker,
      available: p.available,
      distance_km: p.distance_km,
      interior_images: p.interior_images,
      recommend_reason: buildRecommendReason(p),
    }));

    return NextResponse.json({
      job_location: { lat, lng, resolved_name: resolvedName },
      radius_km,
      count: properties.length,
      properties,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
