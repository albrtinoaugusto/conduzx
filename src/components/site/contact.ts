/** Contactos públicos do ConduzX — fonte única para a landing e páginas legais. */
export const CONTACT = {
  email: "contacto@conduzx.app",
  phone: "84 813 1298",
  phoneHref: "tel:+258848131298",
  addressLine: "Av. Julius Nyerere, n.º 1000",
  city: "Maputo, Moçambique",
} as const;

export const SOCIALS = [
  { label: "Instagram", handle: "@consduzx", href: "https://www.instagram.com/consduzx" },
  { label: "Facebook", handle: "@consduzx", href: "https://www.facebook.com/consduzx" },
  { label: "LinkedIn", handle: "/in/consduzx", href: "https://www.linkedin.com/in/consduzx" },
] as const;

export const LEGAL_LINKS = [
  { label: "Política de Privacidade", href: "/privacy" },
  { label: "Termos de Uso", href: "/terms-of-use" },
] as const;

export const demoMailto = `mailto:${CONTACT.email}?subject=${encodeURIComponent("Pedido de demonstração ConduzX")}`;
