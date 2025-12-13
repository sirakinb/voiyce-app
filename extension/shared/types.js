/**
 * Message types for communication between components
 */

export const MSG_TYPES = {
  // Content script -> Background
  START_RECORDING: 'START_RECORDING',
  STOP_RECORDING: 'STOP_RECORDING',
  ANALYZE_CONTENT: 'ANALYZE_CONTENT',
  
  // Background -> Popup/Content
  TRANSCRIPTION_UPDATE: 'TRANSCRIPTION_UPDATE',
  ANALYSIS_RESULT: 'ANALYSIS_RESULT',
  ERROR: 'ERROR',
  
  // Popup -> Background
  GET_STATUS: 'GET_STATUS',
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
};

/**
 * @typedef {Object} ExtensionMessage
 * @property {string} type - One of MSG_TYPES
 * @property {any} [payload] - Data associated with the message
 */

/**
 * @typedef {Object} AnalysisResult
 * @property {string} summary - Summary of the content
 * @property {string[]} keywords - Key topics extracted
 * @property {string} sentiment - Sentiment analysis result
 */
