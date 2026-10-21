import { z } from "zod";
import { parseMeticais } from "@/lib/money";
import { FORMATS, MAX_FILE_SIZE, DOCUMENT_TYPES } from "@/server/domain/documents";

/** Texto opcional: "" → null, com trim. */
const optionalText = (max = 200) =>
  z
    .string()
    .trim()
    .max(max, `Máximo de ${max} caracteres.`)
    .optional()
    .transform((v) => (v ? v : null));

const moneyField = (required = true) =>
  z
    .string()
    .trim()
    .optional()
    .transform((v, c) => {
      if (!v) {
        if (required) c.addIssue({ code: "custom", message: "Indique o valor." });
        return null;
      }
      const cents = parseMeticais(v);
      if (cents === null) {
        c.addIssue({ code: "custom", message: "Valor inválido. Ex.: 1500 ou 1.500,50" });
        return null;
      }
      return cents;
    });

const uuid = z.string().uuid("Seleção inválida.");

export const studentSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, "Indique o nome completo.")
    .max(150, "Nome demasiado longo."),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Indique a data de nascimento.")
    .refine((v) => {
      const d = new Date(`${v}T00:00:00Z`);
      return !Number.isNaN(d.getTime()) && d < new Date() && d.getUTCFullYear() > 1900;
    }, "Data de nascimento inválida."),
  idNumber: optionalText(30).transform((v) => (v ? v.toUpperCase().replace(/\s/g, "") : null)),
  phone: optionalText(30),
  email: optionalText(150).refine(
    (v) => v === null || z.string().email().safeParse(v).success,
    "Email inválido.",
  ),
  address: optionalText(250),
});
export type StudentInput = z.output<typeof studentSchema>;

export const methods = ["dinheiro", "mpesa", "emola", "transferencia", "outro"] as const;
export const inatroStatuses = ["nao_registado", "pendente", "registado"] as const;
export const studentStatuses = ["ativo", "desistiu", "concluido"] as const;

export const enrollmentSchema = z
  .object({
    studentMode: z.enum(["existente", "novo"]),
    studentId: z.string().optional(),
    categoryId: uuid,
    inatroStatus: z.enum(inatroStatuses),
    inatroProcessNumber: optionalText(60),
    inatroNote: optionalText(500),
    firstPayment: moneyField(false),
    method: z.enum(methods).default("dinheiro"),
    reference: optionalText(80),
  })
  .superRefine((v, c) => {
    if (v.studentMode === "existente" && !z.string().uuid().safeParse(v.studentId).success) {
      c.addIssue({ code: "custom", path: ["studentId"], message: "Escolha o aluno." });
    }
    if (v.inatroStatus === "registado" && !v.inatroProcessNumber) {
      c.addIssue({
        code: "custom",
        path: ["inatroProcessNumber"],
        message: "Indique o número de processo do INATRO.",
      });
    }
  });

export const paymentSchema = z.object({
  enrollmentId: uuid,
  amount: moneyField(true),
  method: z.enum(methods),
  reference: optionalText(80),
});

export const voidSchema = z.object({
  paymentId: uuid,
  reason: z.string().trim().min(5, "Explique o motivo (mín. 5 caracteres).").max(300),
});

export const inatroSchema = z
  .object({
    enrollmentId: uuid,
    status: z.enum(inatroStatuses),
    processNumber: optionalText(60),
    note: optionalText(500),
  })
  .superRefine((v, c) => {
    if (v.status === "registado" && !v.processNumber) {
      c.addIssue({
        code: "custom",
        path: ["processNumber"],
        message: "Indique o número de processo do INATRO.",
      });
    }
  });

export const studentStatusSchema = z.object({
  enrollmentId: uuid,
  status: z.enum(studentStatuses),
});

export const categorySchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Indique o código.")
    .max(10)
    .transform((v) => v.toUpperCase()),
  name: z.string().trim().min(2, "Indique o nome.").max(80),
  price: moneyField(true),
  active: z
    .string()
    .optional()
    .transform((v) => v === "on" || v === "true"),
});

export const documentSchema = z.object({
  studentId: uuid,
  enrollmentId: z
    .string()
    .optional()
    .transform((v) => (v ? v : null))
    .pipe(uuid.nullable()),
  type: z.enum(DOCUMENT_TYPES, { errorMap: () => ({ message: "Escolha o tipo de documento." }) }),
  file: z
    .instanceof(File, { message: "Escolha o ficheiro." })
    .refine((f) => f.size > 0, "Escolha o ficheiro.")
    .refine((f) => f.size <= MAX_FILE_SIZE, "O ficheiro excede o máximo de 5 MB.")
    .refine(
      (f) => f.type in FORMATS || /\.(pdf|jpe?g|png)$/i.test(f.name),
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

export const userSchema = z.object({
  name: z.string().trim().min(2, "Indique o nome.").max(100),
  email: z.string().trim().toLowerCase().email("Email inválido."),
  role: z.enum(["atendente", "gestor", "admin"]),
  password,
});

export const updateUserSchema = z.object({
  userId: uuid,
  role: z.enum(["atendente", "gestor", "admin"]),
  active: z
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
export function formToObject(fd: FormData): Record<string, string> {
  const obj: Record<string, string> = {};
  fd.forEach((v, k) => {
    if (typeof v === "string" && !k.startsWith("$ACTION")) obj[k] = v;
  });
  return obj;
}

export function zodErrors(e: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of e.issues) {
    const k = issue.path.join(".") || "_";
    if (!fields[k]) fields[k] = issue.message;
  }
  return fields;
}
