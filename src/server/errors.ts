/** Erro de regra de negócio com mensagem pronta a mostrar ao utilizador. */
export class BusinessError extends Error {
  constructor(
    message: string,
    public field?: string,
    public link?: { href: string; text: string },
  ) {
    super(message);
    this.name = "ErroNegocio";
  }
}

/** Estado devolvido pelas server actions aos formulários. */
export type FormState = {
  ok?: boolean;
  message?: string;
  error?: string;
  link?: { href: string; text: string };
  fields?: Record<string, string>;
  t?: number; // muda a cada resposta, para os formulários reagirem
};

export const initialFormState: FormState = {};
