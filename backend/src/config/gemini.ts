import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const geminiApiKey = process.env["GEMINI_API_KEY"];

if (!geminiApiKey) {
  throw new Error("Missing GEMINI_API_KEY environment variable.");
}

/**
 * Google Generative AI client instance.
 * Uses Gemini 2.5 Flash for fast, free-tier text parsing.
 */
export const genAI = new GoogleGenerativeAI(geminiApiKey);

/** Default model for recipe text parsing. */
export const GEMINI_MODEL = "gemini-2.5-flash";
