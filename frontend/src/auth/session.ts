/**
 * Oturum / token — ekibin depolama stratejisine göre doldurulacak (bellek, sessionStorage, httpOnly cookie).
 */

export function getAccessToken(): string | null {
  return null
}

export function setAccessToken(token: string | null): void {
  void token
  /* TODO: persist token */
}
