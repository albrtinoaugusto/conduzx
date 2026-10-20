import { z } from "zod";
import { parseMeticais } from "@/lib/money";
import { FORMATOS, TAMANHO_MAXIMO, TIPOS_DOCUMENTO } from "@/server/domain/documentos";

/** Texto opcional: "" → null, com trim. */
const opcional = (max = 200) =>
  z
    .string()
    .trim()
    .max(max, `Máximo de ${max} caracteres.`)
    .optional()
    .transform((v) => (v ? v : null));

const dinheiro = (obrigatorio = true) =>
  z
    .string()
    .trim()
    .optional()
    .transform((v, c) => {
      if (!v) {
        if (obrigatorio) c.addIssue({ code: "custom", message: "Indique o valor." });
        return null;
      }
      const centavos = parseMeticais(v);
      if (centavos === null) {
        c.addIssue({ code: "custom", message: "Valor inválido. Ex.: 1500 ou 1.500,50" });
        return null;
      }
      return centavos;
    });

const uuid = z.string().uuid("Seleção inválida.");

export const alunoSchema = z.object({
  nomeCompleto: z
    .string()
    .trim()
    .min(3, "Indique o nome completo.")
    .max(150, "Nome demasiado longo."),
  dataNascimento: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Indique a data de nascimento.")
    .refine((v) => {
      const d = new Date(`${v}T00:00:00Z`);
      return !Number.isNaN(d.getTime()) && d < new Date() && d.getUTCFullYear() > 1900;
    }, "Data de nascimento inválida."),
  biNumero: opcional(30).transform((v) => (v ? v.toUpperCase().replace(/\s/g, "") : null)),
  telefone: opcional(30),
  email: opcional(150).refine(
    (v) => v === null || z.string().email().safeParse(v).success,
    "Email inválido.",
  ),
  endereco: opcional(250),
});
export type AlunoInput = z.output<typeof alunoSchema>;

export const metodos = ["dinheiro", "mpesa", "emola", "transferencia", "outro"] as const;
export const estadosInatro = ["nao_registado", "pendente", "registado"] as const;
export const estadosAluno = ["ativo", "desistiu", "concluido"] as const;

export const inscricaoSchema = z
  .object({
    modoAluno: z.enum(["existente", "novo"]),
    alunoId: z.string().optional(),
    categoriaId: uuid,
    estadoInatro: z.enum(estadosInatro),
    inatroNumeroProcesso: opcional(60),
    inatroNota: opcional(500),
    primeiroPagamento: dinheiro(false),
    metodo: z.enum(metodos).default("dinheiro"),
    referencia: opcional(80),
  })
  .superRefine((v, c) => {
    if (v.modoAluno === "existente" && !z.string().uuid().safeParse(v.alunoId).success) {
      c.addIssue({ code: "custom", path: ["alunoId"], message: "Escolha o aluno." });
    }
    if (v.estadoInatro === "registado" && !v.inatroNumeroProcesso) {
      c.addIssue({
        code: "custom",
        path: ["inatroNumeroProcesso"],
        message: "Indique o número de processo do INATRO.",
      });
    }
  });

export const pagamentoSchema = z.object({
  inscricaoId: uuid,
  valor: dinheiro(true),
  metodo: z.enum(metodos),
  referencia: opcional(80),
});

export const anulacaoSchema = z.object({
  pagamentoId: uuid,
  motivo: z.string().trim().min(5, "Explique o motivo (mín. 5 caracteres).").max(300),
});

export const inatroSchema = z
  .object({
    inscricaoId: uuid,
    estado: z.enum(estadosInatro),
    numeroProcesso: opcional(60),
    nota: opcional(500),
  })
  .superRefine((v, c) => {
    if (v.estado === "registado" && !v.numeroProcesso) {
      c.addIssue({
        code: "custom",
        path: ["numeroProcesso"],
        message: "Indique o número de processo do INATRO.",
      });
    }
  });

export const estadoAlunoSchema = z.object({
  inscricaoId: uuid,
  estado: z.enum(estadosAluno),
});

export const categoriaSchema = z.object({
  codigo: z
    .string()
    .trim()
    .min(1, "Indique o código.")
    .max(10)
    .transform((v) => v.toUpperCase()),
  nome: z.string().trim().min(2, "Indique o nome.").max(80),
  preco: dinheiro(true),
  ativo: z
    .string()
    .optional()
    .transform((v) => v === "on" || v === "true"),
});

export const documentoSchema = z.object({
  alunoId: uuid,
  inscricaoId: z
    .string()
    .optional()
    .transform((v) => (v ? v : null))
    .pipe(uuid.nullable()),
  tipo: z.enum(TIPOS_DOCUMENTO, { errorMap: () => ({ message: "Escolha o tipo de documento." }) }),
  ficheiro: z
    .instanceof(File, { message: "Escolha o ficheiro." })
    .refine((f) => f.size > 0, "Escolha o ficheiro.")
    .refine((f) => f.size <= TAMANHO_MAXIMO, "O ficheiro excede o máximo de 5 MB.")
    .refine(
      (f) => f.type in FORMATOS || /\.(pdf|jpe?g|png)$/i.test(f.name),
      "Formato não permitido. Use PDF, JPG ou PNG.",
    ),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email inválido."),
  password: z.string().min(1, "Indique a palavra-passe."),
});

const password = z
  .string()
  .min(8, "A palavra-passe deve ter pelo menos 8 caracteres.")
  .max(100);

export const utilizadorSchema = z.object({
  nome: z.string().trim().min(2, "Indique o nome.").max(100),
  email: z.string().trim().toLowerCase().email("Email inválido."),
  papel: z.enum(["atendente", "gestor", "admin"]),
  password,
});

export const atualizarUtilizadorSchema = z.object({
  utilizadorId: uuid,
  papel: z.enum(["atendente", "gestor", "admin"]),
  ativo: z
    .string()
    .optional()
    .transform((v) => v === "on" || v === "true"),
  password: z
    .string()
    .optional()
    .transform((v) => (v ? v : null))
    .pipe(password.nullable()),
});

/** Converte FormData num objeto simples (campos repetidos: o último ganha). */
export function formParaObjeto(fd: FormData): Record<string, string> {
  const obj: Record<string, string> = {};
  fd.forEach((v, k) => {
    if (typeof v === "string" && !k.startsWith("$ACTION")) obj[k] = v;
  });
  return obj;
}

export function errosZod(e: z.ZodError): Record<string, string> {
  const campos: Record<string, string> = {};
  for (const issue of e.issues) {
    const k = issue.path.join(".") || "_";
    if (!campos[k]) campos[k] = issue.message;
  }
  return campos;
}
