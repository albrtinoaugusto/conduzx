export const EXAM_QUESTIONS = 25;
export const EXAM_DURATION_S = 25 * 60;
export const EXAM_PASS_MARK = 22;
/** Margem para o envio automático às 00:00 chegar ao servidor em redes lentas. */
export const EXAM_GRACE_S = 120;

export type ExamAnswers = Record<string, number>;

/** Fica só com respostas a perguntas deste teste e com uma opção que exista. */
export function sanitizeAnswers(raw: unknown, questions: Array<{ id: string; optionCount: number }>): ExamAnswers {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const input = raw as Record<string, unknown>;
  const clean: ExamAnswers = {};
  for (const q of questions) {
    const v = input[q.id];
    if (typeof v === "number" && Number.isInteger(v) && v >= 0 && v < q.optionCount) clean[q.id] = v;
  }
  return clean;
}

/** Pergunta em branco conta como errada: 22 certas aprovam, 4 ou mais erradas reprovam. */
export function gradeExam(questions: Array<{ id: string; correct: number }>, answers: ExamAnswers) {
  const correct = questions.filter((q) => answers[q.id] === q.correct).length;
  return { correct, wrong: questions.length - correct, passed: correct >= EXAM_PASS_MARK };
}

/** Normaliza o que o aluno escreve na entrada: pode ser o BI ou o telefone. */
export function parseStudentIdentifier(value: string) {
  const idNumber = value.toUpperCase().replace(/\s/g, "");
  const digits = value.replace(/\D/g, "");
  // Últimos 9 dígitos: o telefone pode estar guardado com ou sem o indicativo +258
  return { idNumber, phoneDigits: digits.length >= 9 ? digits.slice(-9) : null };
}
