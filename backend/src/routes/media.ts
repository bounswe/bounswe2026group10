import { Router, type Request, type Response } from "express";
import multer from "multer";
import path from "path";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/auth.js";
import { createUserClient } from "../config/supabase.js";
import { successResponse, errorResponse } from "../utils/response.js";
import type { AuthenticatedRequest } from "../types/index.js";

const router = Router();

// ─── Constants ────────────────────────────────────────────────────────────────

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_VIDEO_TYPES = ["video/mp4"];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;  // 10 MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100 MB
const STORAGE_BUCKET = "media";

// ─── Multer (memory storage) ──────────────────────────────────────────────────

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_VIDEO_SIZE },
});

// ─── POST /media/upload ───────────────────────────────────────────────────────

/**
 * Upload an image or video file to Supabase Storage.
 * Auth required: Yes. Restricted to cook and expert roles.
 *
 * Request: multipart/form-data, field name "file"
 * Images: JPEG, PNG, WebP — max 10 MB
 * Videos: MP4 — max 100 MB
 *
 * Response 201: { url, type, size }
 */
router.post(
  "/upload",
  requireAuth,
  requireRole("cook", "expert"),
  (req: Request, res: Response, next) => {
    upload.single("file")(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          res
            .status(400)
            .json(errorResponse("FILE_TOO_LARGE", "File exceeds the maximum allowed size (100 MB)."));
          return;
        }
        res.status(400).json(errorResponse("UPLOAD_ERROR", err.message));
        return;
      }
      if (err) {
        res.status(400).json(errorResponse("UPLOAD_ERROR", (err as Error).message));
        return;
      }
      next();
    });
  },
  async (req: Request, res: Response): Promise<void> => {
    if (!req.file) {
      res.status(400).json(errorResponse("MISSING_FILE", "No file provided. Use field name 'file'."));
      return;
    }

    const { mimetype, size, originalname, buffer } = req.file;

    // ── Validate MIME type ──
    const isImage = ALLOWED_IMAGE_TYPES.includes(mimetype);
    const isVideo = ALLOWED_VIDEO_TYPES.includes(mimetype);

    if (!isImage && !isVideo) {
      res.status(400).json(
        errorResponse("INVALID_FILE_TYPE", "Only JPEG, PNG, WebP images and MP4 videos are allowed.")
      );
      return;
    }

    // ── Images have a stricter size limit than videos ──
    if (isImage && size > MAX_IMAGE_SIZE) {
      res.status(400).json(errorResponse("FILE_TOO_LARGE", "Images must be under 10 MB."));
      return;
    }

    const type = isImage ? "image" : "video";
    const folder = isImage ? "images" : "videos";
    const ext = path.extname(originalname).toLowerCase() || (isImage ? ".jpg" : ".mp4");
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    const storagePath = `${folder}/${filename}`;

    // ── Upload to Supabase Storage using the user's JWT ──
    const user = (req as AuthenticatedRequest).user;
    const userClient = createUserClient(user.accessToken);

    const { error: uploadError } = await userClient.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, buffer, {
        contentType: mimetype,
        upsert: false,
      });

    if (uploadError) {
      res.status(500).json(errorResponse("UPLOAD_FAILED", "Failed to upload file to storage."));
      return;
    }

    const { data: urlData } = userClient.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(storagePath);

    res.status(201).json(
      successResponse({
        url: urlData.publicUrl,
        type,
        size,
      })
    );
  }
);

export default router;
