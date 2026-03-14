import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("photo") as File | null;

    if (!file) {
      return NextResponse.json({ error: "ファイルが見つかりません" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "JPEG・PNG・WebP・GIF のみ対応しています" },
        { status: 400 }
      );
    }
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: "ファイルサイズは 5MB 以下にしてください" },
        { status: 400 }
      );
    }

    const ext = file.type.split("/")[1].replace("jpeg", "jpg");
    const filename = `${randomUUID()}.${ext}`;
    const uploadsDir = join(process.cwd(), "public", "uploads");

    await mkdir(uploadsDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(join(uploadsDir, filename), buffer);

    return NextResponse.json({ url: `/uploads/${filename}` });
  } catch (err) {
    console.error("[upload/photo]", err);
    return NextResponse.json({ error: "アップロードに失敗しました" }, { status: 500 });
  }
}
