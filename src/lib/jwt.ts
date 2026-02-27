/**
 * Decodifica un JWT sin verificar la firma (solo para cliente)
 */
export function decodeJWT(token: string): Record<string, any> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const decoded = JSON.parse(atob(parts[1]));
    return decoded;
  } catch (error) {
    console.error("Error decodificando JWT:", error);
    return null;
  }
}

/**
 * Extrae el user_id del JWT
 */
export function getUserIdFromToken(token: string): number | null {
  const decoded = decodeJWT(token);
  if (!decoded) return null;

  // El JWT puede tener el user_id en diferentes campos dependiendo del backend
  // Intenta varios nombres comunes
  const userId =
    decoded.user_id ||
    decoded.userId ||
    decoded.id ||
    decoded.sub ||
    decoded.user?.id ||
    null;

  return userId ? Number(userId) : null;
}
