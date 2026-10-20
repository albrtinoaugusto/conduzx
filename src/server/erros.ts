/** Erro de regra de negócio com mensagem pronta a mostrar ao utilizador. */
export class ErroNegocio extends Error {
  constructor(
    message: string,
    public campo?: string,
    public link?: { href: string; texto: string },
  ) {
    super(message);
    this.name = "ErroNegocio";
  }
}

/** Estado devolvido pelas server actions aos formulários. */
export type EstadoForm = {
  ok?: boolean;
  mensagem?: string;
  erro?: string;
  link?: { href: string; texto: string };
  campos?: Record<string, string>;
  t?: number; // muda a cada resposta, para os formulários reagirem
};

export const estadoInicial: EstadoForm = {};
