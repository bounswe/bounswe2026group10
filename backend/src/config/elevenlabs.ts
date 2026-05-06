import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env["ELEVENLABS_API_KEY"];

if (!apiKey) {
  throw new Error("Missing ELEVENLABS_API_KEY environment variable.");
}

export const ELEVENLABS_API_KEY: string = apiKey;

/** ElevenLabs Speech-to-Text endpoint. */
export const ELEVENLABS_STT_URL = "https://api.elevenlabs.io/v1/speech-to-text";

/** Default Speech-to-Text model — Scribe v1 supports 99+ languages incl. English & Turkish. */
export const ELEVENLABS_STT_MODEL = "scribe_v1";
