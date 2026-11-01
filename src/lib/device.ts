const MOBILE_UA = /Android|iPhone|iPad|iPod|webOS|BlackBerry|Opera Mini|IEMobile|Mobile/i;

/** Telemóvel ou tablet, pelos cabeçalhos do pedido. Corre no middleware (edge). */
export function isMobileRequest(userAgent: string | null, chUaMobile: string | null) {
  return chUaMobile === "?1" || MOBILE_UA.test(userAgent ?? "");
}
