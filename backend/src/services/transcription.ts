import {
  ELEVENLABS_API_KEY,
  ELEVENLABS_STT_MODEL,
  ELEVENLABS_STT_URL,
} from "../config/elevenlabs.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export type TranscriptionLanguage = "en" | "tr" | "auto";

export interface TranscriptionResult {
  text: string;
  /** ISO 639-3 code returned by ElevenLabs (e.g. "eng", "tur"). */
  languageCode: string;
  /** Confidence in the detected language, 0..1. */
  languageProbability: number;
}

// ─── Mappings ─────────────────────────────────────────────────────────────────

/** Map our 2-letter UI codes to the ISO 639-3 codes ElevenLabs expects. */
const LANGUAGE_HINT_MAP: Record<Exclude<TranscriptionLanguage, "auto">, string> = {
  en: "eng",
  tr: "tur",
};

// ─── Transcription ────────────────────────────────────────────────────────────

/**
 * Transcribes audio data using the ElevenLabs Scribe Speech-to-Text API.
 * Auto-detects language by default; pass "en" or "tr" to force a language hint
 * for noisy or short clips.
 *
 * @param audio - Raw audio buffer (mp3/wav/webm/m4a/ogg/flac).
 * @param mimetype - MIME type of the audio (e.g. "audio/mpeg").
 * @param filename - Original filename — included in the multipart payload so
 *   ElevenLabs can detect the format from the extension as a fallback.
 * @param language - "en" | "tr" | "auto". Defaults to "auto".
 * @throws Error when the API call fails or the response contains no text.
 */
export async function transcribeAudio(
  audio: Buffer,
  mimetype: string,
  filename: string,
  language: TranscriptionLanguage = "auto"
): Promise<TranscriptionResult> {
  // Wrap the buffer in a Blob so the global FormData attaches it as a file part.
  // Convert Buffer → Uint8Array (the bytes are the same view) so the Blob
  // constructor type matches across Node fetch/undici versions.
  const blob = new Blob([new Uint8Array(audio)], {
    type: mimetype || "application/octet-stream",
  });

  const form = new FormData();
  form.append("file", blob, filename || "audio");
  form.append("model_id", ELEVENLABS_STT_MODEL);

  if (language !== "auto") {
    form.append("language_code", LANGUAGE_HINT_MAP[language]);
  }

  const response = await fetch(ELEVENLABS_STT_URL, {
    method: "POST",
    headers: {
      "xi-api-key": ELEVENLABS_API_KEY,
    },
    body: form,
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(
      `ElevenLabs STT failed (${response.status}): ${errorBody.slice(0, 200) || response.statusText}`
    );
  }

  const data = (await response.json()) as {
    text?: unknown;
    language_code?: unknown;
    language_probability?: unknown;
  };

  const text = String(data?.text ?? "").trim();
  if (!text) {
    throw new Error("ElevenLabs STT returned empty transcription.");
  }

  return {
    text,
    languageCode: String(data?.language_code ?? "unknown"),
    languageProbability: Number(data?.language_probability) || 0,
  };
}
