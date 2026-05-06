import { Router, type Request, type Response } from "express";
import multer from "multer";
import { z } from "zod";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import type { AuthenticatedRequest } from "../types/index.js";
import { errorResponse, successResponse } from "../utils/response.js";
import { parseRecipeText, standardizeUnits } from "../services/recipe-parser.js";
import {
  transcribeAudio,
  type TranscriptionLanguage,
} from "../services/transcription.js";

const router = Router();

// ─── Recipe-Audio/Video Upload Constants ─────────────────────────────────────
//
// ElevenLabs Scribe accepts both audio files and video containers (it extracts
// the audio track server-side), so we whitelist both. The 100 MB cap matches
// the video limit on /media/upload.

const ALLOWED_AUDIO_TYPES = [
  "audio/mpeg",        // mp3
  "audio/mp3",
  "audio/wav",
  "audio/wave",
  "audio/x-wav",
  "audio/webm",
  "audio/mp4",         // some m4a clients
  "audio/m4a",
  "audio/x-m4a",
  "audio/ogg",
  "audio/flac",
  "audio/x-flac",
];
const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime",   // .mov
  "video/webm",
  "video/x-matroska",  // .mkv
];
const ALLOWED_MEDIA_TYPES = [...ALLOWED_AUDIO_TYPES, ...ALLOWED_VIDEO_TYPES];

const MAX_MEDIA_SIZE = 100 * 1024 * 1024; // 100 MB (matches /media/upload video limit)
const MIN_TRANSCRIPTION_LENGTH = 10;      // matches /recipe-text minimum
const MAX_TRANSCRIPTION_LENGTH = 5000;    // matches /recipe-text maximum

const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_MEDIA_SIZE },
});

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const parseRecipeTextSchema = z.object({
  text: z
    .string({ message: "Text is required." })
    .min(10, { message: "Text must be at least 10 characters." })
    .max(5000, { message: "Text must be at most 5000 characters." }),
});

// ─── POST /parse/recipe-text ─────────────────────────────────────────────────

/**
 * Parse a free-text recipe narrative into structured components.
 * Returns structured ingredients, steps, and tools without storing anything.
 *
 * Auth required: Yes (cook or expert).
 */
router.post(
  "/recipe-text",
  requireAuth,
  requireRole("cook", "expert"),
  validate(parseRecipeTextSchema),
  async (req, res: Response): Promise<void> => {
    const { text } = req.body as z.infer<typeof parseRecipeTextSchema>;

    try {
      const parsed = await parseRecipeText(text);

      res.status(200).json(
        successResponse({
          title: parsed.title,
          ingredients: parsed.ingredients,
          steps: parsed.steps,
          tools: parsed.tools,
        })
      );
    } catch (err: any) {
      console.error("Recipe parse error (after retries):", err);
      res
        .status(500)
        .json(
          errorResponse(
            "PARSE_FAILED",
            "Failed to parse recipe text after multiple attempts. Please try again in a moment."
          )
        );
    }
  }
);

// ─── Zod Schema — Standardize Units ─────────────────────────────────────────

const standardizeUnitsSchema = z.object({
  ingredients: z
    .array(
      z.object({
        name: z.string().min(1),
        quantity: z.number().positive(),
        unit: z.string().min(1),
      })
    )
    .min(1, { message: "At least one ingredient is required." })
    .max(50, { message: "Maximum 50 ingredients allowed." }),
  steps: z
    .array(
      z.object({
        stepOrder: z.number().int().positive(),
        description: z.string().min(1),
      })
    )
    .max(50)
    .optional(),
  region: z.string().optional(),
});

// ─── POST /parse/standardize-units ──────────────────────────────────────────

/**
 * Convert informal/colloquial ingredient units and step descriptions
 * to standard measurements and clear instructions.
 * Accepts structured ingredients and optional steps (from parsing or manual entry).
 *
 * Auth required: Yes (cook or expert).
 */
router.post(
  "/standardize-units",
  requireAuth,
  requireRole("cook", "expert"),
  validate(standardizeUnitsSchema),
  async (req, res: Response): Promise<void> => {
    const { ingredients, steps, region } = req.body as z.infer<typeof standardizeUnitsSchema>;

    try {
      const standardized = await standardizeUnits(ingredients, steps, region);

      res.status(200).json(successResponse(standardized));
    } catch (err: any) {
      console.error("Standardization error:", err);
      res
        .status(500)
        .json(
          errorResponse(
            "STANDARDIZATION_FAILED",
            "Failed to standardize recipe. Please try again."
          )
        );
    }
  }
);

// ─── POST /parse/recipe-audio ───────────────────────────────────────────────

/**
 * Transcribe an uploaded recipe recording (English or Turkish) using
 * ElevenLabs Scribe, then run the transcription through the existing
 * Gemini recipe parser. Returns both the raw transcription and the
 * structured recipe so the caller can show the user what was heard.
 *
 * Accepts both audio-only files and video containers — Scribe extracts
 * the audio track from the video server-side. Most recipe content in this
 * project is captured on video, so the same endpoint serves both.
 *
 * Request: multipart/form-data
 *   - field "audio"     : audio (mp3/wav/webm/m4a/ogg/flac) or video
 *                         (mp4/mov/webm/mkv) file, max 100 MB
 *   - field "language"  : optional — "en" | "tr" | "auto" (default "auto")
 *
 * Auth required: Yes (cook or expert).
 */
router.post(
  "/recipe-audio",
  requireAuth,
  requireRole("cook", "expert"),
  (req: Request, res: Response, next) => {
    audioUpload.single("audio")(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          res
            .status(400)
            .json(errorResponse("FILE_TOO_LARGE", "File must be under 100 MB."));
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
      res
        .status(400)
        .json(
          errorResponse(
            "MISSING_FILE",
            "No file provided. Use field name 'audio' (also accepts video files)."
          )
        );
      return;
    }

    const { mimetype, originalname, buffer } = req.file;

    if (!ALLOWED_MEDIA_TYPES.includes(mimetype)) {
      res
        .status(400)
        .json(
          errorResponse(
            "INVALID_FILE_TYPE",
            "Unsupported format. Allowed audio: mp3, wav, webm, m4a, ogg, flac. Allowed video: mp4, mov, webm, mkv."
          )
        );
      return;
    }

    const langInput = String(req.body?.["language"] ?? "auto").toLowerCase();
    const language: TranscriptionLanguage =
      langInput === "en" || langInput === "tr" ? langInput : "auto";

    // ── Step 1: transcribe via ElevenLabs ──
    let transcriptionText: string;
    let languageCode: string;
    let languageProbability: number;
    try {
      const result = await transcribeAudio(
        buffer,
        mimetype,
        originalname || "audio",
        language
      );
      transcriptionText = result.text;
      languageCode = result.languageCode;
      languageProbability = result.languageProbability;
    } catch (err) {
      console.error("Transcription error:", err);
      res
        .status(500)
        .json(
          errorResponse(
            "TRANSCRIPTION_FAILED",
            "Failed to transcribe audio. Please ensure the recording is clear and try again."
          )
        );
      return;
    }

    // ── Step 2: guard against unusable transcripts ──
    if (transcriptionText.length < MIN_TRANSCRIPTION_LENGTH) {
      res
        .status(400)
        .json(
          errorResponse(
            "TRANSCRIPTION_TOO_SHORT",
            "The transcribed text was too short to parse as a recipe. Please record a longer or clearer audio."
          )
        );
      return;
    }

    // Cap to the same upper bound the text endpoint enforces, so the parser
    // does not get an unbounded blob from a long recording.
    const textForParser =
      transcriptionText.length > MAX_TRANSCRIPTION_LENGTH
        ? transcriptionText.slice(0, MAX_TRANSCRIPTION_LENGTH)
        : transcriptionText;

    // ── Step 3: parse the transcription into a structured recipe ──
    try {
      const parsed = await parseRecipeText(textForParser);

      const sourceKind: "audio" | "video" = ALLOWED_VIDEO_TYPES.includes(mimetype)
        ? "video"
        : "audio";

      res.status(200).json(
        successResponse({
          transcription: {
            text: transcriptionText,
            languageCode,
            languageProbability,
            truncated: transcriptionText.length > MAX_TRANSCRIPTION_LENGTH,
            source: sourceKind,
          },
          recipe: {
            title: parsed.title,
            ingredients: parsed.ingredients,
            steps: parsed.steps,
            tools: parsed.tools,
          },
        })
      );
    } catch (err) {
      console.error("Recipe parse error after transcription (after retries):", err);
      res
        .status(500)
        .json(
          errorResponse(
            "PARSE_FAILED",
            "Audio transcribed successfully but the recipe parser failed after multiple attempts. Please try again in a moment."
          )
        );
    }
  }
);

export default router;
