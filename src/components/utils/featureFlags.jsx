// Feature flags utility for gated features
export const FEATURE_FLAGS = {
  SMART_ALERTS: 'feature_smart_alerts',
  PERFORMANCE_INSIGHTS: 'feature_performance_insights',
  PREDICTIVE_WARNINGS: 'feature_predictive_warnings'
};

export const isFeatureEnabled = (flagName) => {
  // Check localStorage for feature flag override (dev/testing)
  const stored = localStorage.getItem(flagName);
  if (stored !== null) {
    return stored === 'true';
  }
  
  // Check environment variables
  const envKey = `REACT_APP_${flagName.toUpperCase()}`;
  if (window.env && window.env[envKey] !== undefined) {
    return window.env[envKey] === 'true';
  }
  
  // Default to false (disabled)
  return false;
};

export const enableFeature = (flagName) => {
  localStorage.setItem(flagName, 'true');
};

export const disableFeature = (flagName) => {
  localStorage.setItem(flagName, 'false');
};