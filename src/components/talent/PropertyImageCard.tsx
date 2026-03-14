"use client";

/**
 * PropertyImageCard.tsx
 * 物件カード — 内装写真・ハウスメーカー名・距離付きで表示（英語UI）
 */

import { useState } from "react";
import type { MockProperty } from "@/lib/mock-data";

export interface PropertyCardProps {
  property: MockProperty;
  distance_km?: number;
  /** コンパクト表示（横スクロールリスト内で使用） */
  compact?: boolean;
}

const MAKER_BADGE: Record<string, { color: string; short: string }> = {
  "一建設":          { color: "bg-blue-600",  short: "ICHIKEN" },
  "東栄住宅":        { color: "bg-emerald-600", short: "TOEI" },
  "アンホーム不動産": { color: "bg-orange-600", short: "AN HOME" },
};

export default function PropertyImageCard({
  property,
  distance_km,
  compact = false,
}: PropertyCardProps) {
  const [imgIndex, setImgIndex] = useState(0);
  const [imgError, setImgError] = useState(false);

  const images = property.interior_images ?? [];
  const currentImg = images[imgIndex];
  const badge = MAKER_BADGE[property.house_maker] ?? { color: "bg-slate-600", short: property.house_maker };

  if (compact) {
    return (
      <div className="flex-shrink-0 w-48 rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm">
        {/* 画像 */}
        <div className="relative h-28 bg-slate-100">
          {currentImg && !imgError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentImg}
              alt={property.name}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl text-slate-300">
              🏠
            </div>
          )}
          {/* ハウスメーカーバッジ */}
          <div className={`absolute top-2 left-2 ${badge.color} text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md`}>
            {badge.short}
          </div>
          {/* 利用可能バッジ */}
          <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
            Available
          </div>
        </div>

        {/* 情報 */}
        <div className="p-2.5">
          <div className="text-xs font-semibold text-slate-800 truncate">{property.name}</div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm font-bold text-blue-600">
              ¥{(property.rent / 1000).toFixed(0)}K
              <span className="text-xs font-normal text-slate-400">/mo</span>
            </span>
            <span className="text-xs text-slate-400">{property.floor_plan}</span>
          </div>
          {distance_km !== undefined && (
            <div className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
              <span>📍</span>
              <span>{distance_km.toFixed(1)}km from work</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // フルカード表示
  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-md">
      {/* 画像ギャラリー */}
      <div className="relative h-52 bg-slate-100">
        {currentImg && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentImg}
            alt={`${property.name} interior`}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
            <span className="text-5xl">🏠</span>
            <span className="text-xs mt-2">Photo coming soon</span>
          </div>
        )}

        {/* ハウスメーカーバッジ */}
        <div className={`absolute top-3 left-3 ${badge.color} text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm`}>
          {badge.short}
        </div>

        {/* 利用可能バッジ */}
        {property.available && (
          <div className="absolute top-3 right-3 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-lg shadow-sm flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-white rounded-full" />
            Available
          </div>
        )}

        {/* 画像ナビ (複数画像がある場合) */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setImgIndex(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  i === imgIndex ? "bg-white scale-125" : "bg-white/50"
                }`}
              />
            ))}
          </div>
        )}

        {/* 画像切替ボタン */}
        {images.length > 1 && (
          <>
            <button
              onClick={() => setImgIndex((i) => Math.max(0, i - 1))}
              disabled={imgIndex === 0}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 hover:bg-black/50
                         text-white rounded-full flex items-center justify-center text-sm disabled:opacity-20 transition-colors"
            >
              ‹
            </button>
            <button
              onClick={() => setImgIndex((i) => Math.min(images.length - 1, i + 1))}
              disabled={imgIndex === images.length - 1}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 hover:bg-black/50
                         text-white rounded-full flex items-center justify-center text-sm disabled:opacity-20 transition-colors"
            >
              ›
            </button>
          </>
        )}
      </div>

      {/* 物件情報 */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-bold text-slate-900">{property.name}</h3>
            <p className="text-sm text-slate-500 mt-0.5">{property.address}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-xl font-black text-blue-600">
              ¥{property.rent.toLocaleString()}
            </div>
            <div className="text-xs text-slate-400">per month</div>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className="text-sm bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-medium">
            {property.floor_plan}
          </span>
          <span className="text-sm bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg font-medium">
            Managed by {property.house_maker}
          </span>
          {distance_km !== undefined && (
            <span className="text-sm bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg font-medium flex items-center gap-1">
              📍 {distance_km.toFixed(1)}km to work
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
