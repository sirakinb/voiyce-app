/**
 * Constants for the extension
 */

// TODO: Replace with actual API keys or fetch them from a secure backend
export const ASSEMBLYAI_API_KEY = 'TODO_ASSEMBLYAI_API_KEY';
export const GEMINI_API_KEY = 'TODO_GEMINI_API_KEY';

export const BACKEND_URL = 'http://localhost:3000';

export const API_ENDPOINTS = {
  ASSEMBLYAI_TRANSCRIPT: 'https://api.assemblyai.com/v2/transcript',
  GEMINI_GENERATE: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
  BACKEND_HEALTH: `${BACKEND_URL}/health`,
  BACKEND_PROCESS: `${BACKEND_URL}/process`,
};

export const EXTENSION_NAME = 'AI Assistant Extension';
