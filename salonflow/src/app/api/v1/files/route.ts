import { readFile } from "node:fs/promises";
import path from "node:path";

import { env } from "@/config/env";
import { getRequestContext } from "@/server/auth/context";
import { canViewMedicalPhoto } from "@/server/permissions/mask";
import { isSafeStorageKey, verifySignedUrl } from "@/server/storage/signed-url";
import { jsonError } from "@/server/api/response";

/**
 * GET /api/v1/files?key=…&expires=…&signature=…
 *
 * Serves a private file behind a signed, short-lived URL.
 *
 * Two independent checks, on purpose: the signature proves the URL was minted
 * by this server and has not expired, and the session check proves the person
 * presenting it is still entitled to the content. A forwarded link therefore
 * does not leak a chart photo to someone without the permission — the URL
 * alone is not sufficient.
 */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);

  const verified = verifySignedUrl(url.searchParams);
  if (!verified.ok) {
    const status = verified.reason === "expired" ? 410 : 403;
    return jsonError("INVALID_SIGNATURE", "このURLは利用できません", request, { status });
  }

  if (!isSafeStorageKey(verified.key)) {
    return jsonError("INVALID_KEY", "不正なファイル指定です", request, { status: 400 });
  }

  const context = await getRequestContext();
  if (!context) {
    return jsonError("UNAUTHORIZED", "ログインが必要です", request, { status: 401 });
  }
  if (!canViewMedicalPhoto(context)) {
    return jsonError("FORBIDDEN", "このファイルを閲覧する権限がありません", request, {
      status: 403,
    });
  }

  if (env().STORAGE_DRIVER !== "local") {
    // PLACEHOLDER: the S3 adapter would redirect to a provider-signed URL here.
    return jsonError("STORAGE_NOT_CONFIGURED", "オブジェクトストレージ連携は未設定です", request, {
      status: 501,
    });
  }

  const root = path.resolve(process.cwd(), env().STORAGE_LOCAL_DIR);
  const resolved = path.resolve(root, verified.key);

  // Belt and braces against traversal: the resolved path must stay under root.
  if (!resolved.startsWith(root + path.sep)) {
    return jsonError("INVALID_KEY", "不正なファイル指定です", request, { status: 400 });
  }

  try {
    const file = await readFile(resolved);
    return new Response(new Uint8Array(file), {
      headers: {
        "content-type": guessContentType(resolved),
        // Private and short-lived: a shared proxy must never keep a copy.
        "cache-control": "private, max-age=60, no-store",
        "content-disposition": "inline",
        "x-content-type-options": "nosniff",
      },
    });
  } catch {
    return jsonError("NOT_FOUND", "ファイルが見つかりません", request, { status: 404 });
  }
}

function guessContentType(filePath: string): string {
  const extension = path.extname(filePath).toLowerCase();
  switch (extension) {
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    case ".avif":
      return "image/avif";
    case ".pdf":
      return "application/pdf";
    default:
      return "application/octet-stream";
  }
}
