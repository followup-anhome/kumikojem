/**
 * geo-matcher.ts
 * 勤務地(Job)と物件(Property)の座標を比較し、
 * 半径 N km 以内の物件をフィルタリングするユーティリティ
 *
 * アルゴリズム: Haversine formula（球面三角法）
 * 精度: ±0.5% 程度（日本国内利用では十分）
 */

// ─────────────────────────────────────────
// 型定義
// ─────────────────────────────────────────
export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface JobLocation extends GeoPoint {
  id: string;
  location_name: string;
}

export interface PropertyWithDistance {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rent: number;
  management_company: string;
  distance_km: number; // 計算済み距離
}

// ─────────────────────────────────────────
// Haversine 距離計算
// ─────────────────────────────────────────
const EARTH_RADIUS_KM = 6371;

/**
 * 2点間の距離を km で返す（Haversine formula）
 */
export function calcDistanceKm(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);

  const h =
    sinDLat * sinDLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

// ─────────────────────────────────────────
// メイン: 半径 N km 以内の物件をフィルタ
// ─────────────────────────────────────────

/**
 * 求人の勤務地座標を中心に、指定半径内の物件を返す
 *
 * @param jobLocation 求人の位置情報
 * @param properties  全物件リスト
 * @param radiusKm    検索半径（デフォルト 5km）
 * @returns 距離昇順でソートされた物件リスト
 */
export function filterPropertiesWithinRadius<
  T extends { id: string; name: string; address: string; lat: number; lng: number; rent: number; management_company: string }
>(
  jobLocation: GeoPoint,
  properties: T[],
  radiusKm: number = 5
): (T & { distance_km: number })[] {
  return properties
    .map((p) => ({
      ...p,
      distance_km: Math.round(calcDistanceKm(jobLocation, p) * 100) / 100,
    }))
    .filter((p) => p.distance_km <= radiusKm)
    .sort((a, b) => a.distance_km - b.distance_km);
}

// ─────────────────────────────────────────
// バウンディングボックス事前フィルタ（最適化）
// DB クエリの WHERE 句に使える lat/lng 範囲を計算
// ─────────────────────────────────────────

/**
 * 半径 km から緯度・経度の差分（度）を計算し
 * DB の WHERE 句用のバウンディングボックスを返す
 *
 * 使用例:
 *   const bbox = getBoundingBox({ lat: 34.69, lng: 135.50 }, 5)
 *   WHERE lat BETWEEN bbox.minLat AND bbox.maxLat
 *     AND lng BETWEEN bbox.minLng AND bbox.maxLng
 */
export function getBoundingBox(center: GeoPoint, radiusKm: number) {
  // 緯度 1度 ≈ 111km
  const latDelta = radiusKm / 111;
  // 経度 1度 ≈ 111km × cos(緯度)
  const lngDelta = radiusKm / (111 * Math.cos(toRad(center.lat)));

  return {
    minLat: center.lat - latDelta,
    maxLat: center.lat + latDelta,
    minLng: center.lng - lngDelta,
    maxLng: center.lng + lngDelta,
  };
}

// ─────────────────────────────────────────
// Prisma 連携版: DB から物件を取得してマッチング
// ─────────────────────────────────────────

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Job ID を受け取り、その勤務地から半径 5km 以内の
 * 利用可能な AN_HOME 物件を返す
 *
 * @param jobId     対象求人 ID
 * @param radiusKm  検索半径（デフォルト 5km）
 */
export async function findPropertiesNearJob(
  jobId: string,
  radiusKm: number = 5
): Promise<PropertyWithDistance[]> {
  // 1. 求人の座標を取得
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: { id: true, location_lat: true, location_lng: true, location_name: true },
  });

  if (!job) throw new Error(`Job not found: ${jobId}`);

  const jobPoint: GeoPoint = { lat: job.location_lat, lng: job.location_lng };

  // 2. バウンディングボックスで DB 絞り込み（全件スキャン回避）
  const bbox = getBoundingBox(jobPoint, radiusKm);

  const candidates = await prisma.property.findMany({
    where: {
      available: true,
      lat: { gte: bbox.minLat, lte: bbox.maxLat },
      lng: { gte: bbox.minLng, lte: bbox.maxLng },
    },
  });

  // 3. Haversine で正確な距離計算 + フィルタ
  const results = filterPropertiesWithinRadius(jobPoint, candidates, radiusKm);

  return results.map((p) => ({
    id: p.id,
    name: p.name,
    address: p.address,
    lat: p.lat,
    lng: p.lng,
    rent: p.rent,
    management_company: p.management_company,
    distance_km: p.distance_km,
  }));
}
