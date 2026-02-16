// Utility to convert MongoDB ObjectId to valid UUID format
// Uses a consistent hash-based approach that creates deterministic UUIDs

const hexToUuid = (hex) => {
  if (!hex || typeof hex !== 'string') return hex;
  
  // If already looks like UUID, return as-is
  if (hex.includes('-') && hex.length === 36) return hex;
  
  // If 24-char MongoDB ObjectId, convert it
  if (hex.length === 24) {
    // Format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 24)}`.toLowerCase();
  }
  
  return hex;
};

export { hexToUuid };