import { describe, expect, it } from "vitest";
import { isMobileRequest } from "@/lib/device";
import { createStudentToken, createToken, readStudentToken, readToken } from "@/server/auth/token";
import { gradeExam, parseStudentIdentifier, sanitizeAnswers } from "./practice-exam";
import { theoryExamProgress, todayInMaputo } from "./theory-exam";

process.env.SESSION_SECRET = "x".repeat(40);

describe("contagem do exame teórico", () => {
  it("só fica pronto ao fim de 45 dias completos", () => {
    expect(theoryExamProgress("2026-01-01", "2026-02-14")).toMatchObject({ ready: false, daysLeft: 1, readyDate: "2026-02-15" });
    expect(theoryExamProgress("2026-01-01", "2026-02-15")).toMatchObject({ ready: true, daysLeft: 0, percentage: 100 });
  });

  it("não começa antes da primeira aula", () => {
    const p = theoryExamProgress("2026-03-08", "2026-03-01");
    expect(p).toMatchObject({ started: false, ready: false, elapsedDays: 0, daysLeft: 52 });
  });

  it("aluno matriculado há muito tempo fica logo pronto", () => {
    expect(theoryExamProgress("2024-01-01", "2026-03-01")).toMatchObject({ ready: true, elapsedDays: 45 });
  });

  it("usa a data de Moçambique, não a do servidor", () => {
    expect(todayInMaputo(new Date("2026-03-01T22:30:00Z"))).toBe("2026-03-02");
  });
});

describe("correção do teste", () => {
  const questions = Array.from({ length: 25 }, (_, i) => ({ id: `q${i}`, correct: 1 }));
  const answers = (n: number) => Object.fromEntries(questions.slice(0, n).map((q) => [q.id, 1]));

  it("aprova com 22 certas e reprova com 4 erradas", () => {
    expect(gradeExam(questions, answers(22))).toEqual({ correct: 22, wrong: 3, passed: true });
    expect(gradeExam(questions, answers(21))).toEqual({ correct: 21, wrong: 4, passed: false });
  });

  it("perguntas em branco contam como erradas", () => {
    expect(gradeExam(questions, {})).toEqual({ correct: 0, wrong: 25, passed: false });
  });

  it("ignora respostas a outras perguntas ou opções inexistentes", () => {
    const qs = [{ id: "a", optionCount: 3 }, { id: "b", optionCount: 3 }];
    expect(sanitizeAnswers({ a: 2, b: 3, c: 0 }, qs)).toEqual({ a: 2 });
    expect(sanitizeAnswers({ a: "1", b: 1.5 }, qs)).toEqual({});
    expect(sanitizeAnswers([1, 2], qs)).toEqual({});
  });
});

describe("entrada do aluno", () => {
  it("aceita BI ou telefone, com ou sem indicativo", () => {
    expect(parseStudentIdentifier(" 110100123456a ").idNumber).toBe("110100123456A");
    expect(parseStudentIdentifier("+258 84 123 4567").phoneDigits).toBe("841234567");
    expect(parseStudentIdentifier("84 123").phoneDigits).toBeNull();
  });

  it("sessão de aluno e sessão de funcionário não são intercambiáveis", () => {
    expect(readToken(createStudentToken("aluno-1"))).toBeNull();
    expect(readStudentToken(createToken("user-1"))).toBeNull();
    expect(readStudentToken(createStudentToken("aluno-1"))).toBe("aluno-1");
  });
});

describe("deteção de telemóvel", () => {
  it("distingue telemóvel de computador", () => {
    expect(isMobileRequest("Mozilla/5.0 (Linux; Android 13; SM-A135F) Mobile Safari/537.36", null)).toBe(true);
    expect(isMobileRequest("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)", null)).toBe(true);
    expect(isMobileRequest("Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120", "?0")).toBe(false);
    expect(isMobileRequest(null, "?1")).toBe(true);
  });
});
