/**
 * 🔐 NOX Ephemeral QR Engine
 * Generates time-sensitive tokens for secure Entry/Exit validation.
 * Format: Base64(orderId:timestamp)
 */

export const encodeSessionToken = (orderId) => {
  if (!orderId) return '';
  const now = Date.now();
  // We use btoa for a simple but effective masking of the timestamp
  // In a professional environment, this would be signed with a secret key
  return btoa(`${orderId}:${now}`);
};

export const decodeSessionToken = (token) => {
  try {
    const decoded = atob(token);
    const [orderId, timestamp] = decoded.split(':');
    return { 
      orderId, 
      timestamp: parseInt(timestamp),
      isValidFormat: !!(orderId && timestamp)
    };
  } catch (e) {
    return { isValidFormat: false };
  }
};

// Legacy support for other parts of the app if needed
export const generateDynamicToken = (baseId) => encodeSessionToken(baseId);
