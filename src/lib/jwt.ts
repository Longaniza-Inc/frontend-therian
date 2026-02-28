/**
 * Decodifica un JWT sin verificar la firma (solo para cliente)
 */
export function decodeJWT(token: string): Record<string, any> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const decoded = JSON.parse(atob(parts[1]));
    
    // Verificar expiración
    if (decoded.exp) {
      const expirationDate = new Date(decoded.exp * 1000);
      const now = new Date();
      const isExpired = now > expirationDate;
      
      console.log("⏰ JWT Expiración:", {
        exp_timestamp: decoded.exp,
        expirationDate: expirationDate.toISOString(),
        now: now.toISOString(),
        isExpired: isExpired,
        secondsRemaining: Math.round((decoded.exp * 1000 - now.getTime()) / 1000),
      });
      
      if (isExpired) {
        console.error("❌ JWT EXPIRADO - Token inválido");
      }
    }
    
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

  console.log("🔐 JWT Payload completo:", decoded);
  console.log("📋 Campos disponibles en JWT:", Object.keys(decoded));

  // El JWT puede tener el user_id en diferentes campos dependiendo del backend
  // Intenta varios nombres comunes
  const userId =
    decoded.user_id ||
    decoded.userId ||
    decoded.id ||
    decoded.sub ||
    decoded.google_id ||  // Google ID como fallback
    decoded.user?.id ||
    null;

  console.log("🆔 User ID extraído:", userId);
  console.log("📍 Fuente del ID:", {
    user_id: decoded.user_id,
    userId: decoded.userId,
    id: decoded.id,
    sub: decoded.sub,
    google_id: decoded.google_id,
  });

  return userId ? Number(userId) : null;
}
