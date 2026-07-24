export function getAiPredictUrl(env = process.env) {
  return env.REACT_APP_AI_PREDICT_URL || env.VITE_AI_PREDICT_URL || '';
}
