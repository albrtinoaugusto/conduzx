import "server-only";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/server/db";
import { alunos, categorias, documentos, inscricoes, utilizadores } from "@/server/db/schema";
import type { Ctx } from "@/server/auth/sessao";
import { detetarFormato, limparNomeFicheiro, type TipoDocumento } from "@/server/domain/documentos";
import { ErroNegocio } from "@/server/erros";
import { armazenamento, novaChave } from "@/server/storage";
import { registarHistorico } from "./historico";

export type LinhaDocumento = Awaited<ReturnType<typeof listarDocumentos>>[number];

export async function listarDocumentos(ctx: Ctx, alunoId: string) {
  return db
    .select({
      id: documentos.id,
      tipo: documentos.tipo,
      nomeFicheiro: documentos.nomeFicheiro,
      mimeType: documentos.mimeType,
      criadoEm: documentos.criadoEm,
      inscricaoId: documentos.inscricaoId,
      categoria: categorias.nome,
      enviadoPor: utilizadores.nome,
    })
    .from(documentos)
    .leftJoin(inscricoes, eq(inscricoes.id, documentos.inscricaoId))
    .leftJoin(categorias, eq(categorias.id, inscricoes.categoriaId))
    .leftJoin(utilizadores, eq(utilizadores.id, documentos.enviadoPor))
    .where(and(eq(documentos.alunoId, alunoId), eq(documentos.escolaId, ctx.escolaId)))
    .orderBy(desc(documentos.criadoEm));
}

export async function carregarDocumento(
  ctx: Ctx,
  dados: {
    alunoId: string;
    inscricaoId: string | null;
    tipo: TipoDocumento;
    nomeFicheiro: string;
    conteudo: Uint8Array;
  },
) {
  const mime = detetarFormato(dados.conteudo);
  if (!mime) throw new ErroNegocio("O ficheiro não é um PDF, JPG ou PNG válido.", "ficheiro");

  const [aluno] = await db
    .select({ id: alunos.id })
    .from(alunos)
    .where(and(eq(alunos.id, dados.alunoId), eq(alunos.escolaId, ctx.escolaId), isNull(alunos.eliminadoEm)))
    .limit(1);
  if (!aluno) throw new ErroNegocio("Aluno não encontrado.");

  if (dados.inscricaoId) {
    const [insc] = await db
      .select({ id: inscricoes.id })
      .from(inscricoes)
      .where(
        and(
          eq(inscricoes.id, dados.inscricaoId),
          eq(inscricoes.alunoId, dados.alunoId),
          eq(inscricoes.escolaId, ctx.escolaId),
          isNull(inscricoes.eliminadoEm),
        ),
      )
      .limit(1);
    if (!insc) throw new ErroNegocio("A inscrição escolhida não pertence a este aluno.", "inscricaoId");
  }

  // Primeiro o ficheiro: se a base de dados falhar fica só um ficheiro órfão, nunca um registo sem ficheiro.
  const storageKey = novaChave(ctx.escolaId);
  await armazenamento.guardar(storageKey, dados.conteudo);

  return db.transaction(async (tx) => {
    const [novo] = await tx
      .insert(documentos)
      .values({
        escolaId: ctx.escolaId,
        alunoId: dados.alunoId,
        inscricaoId: dados.inscricaoId,
        tipo: dados.tipo,
        storageKey,
        nomeFicheiro: limparNomeFicheiro(dados.nomeFicheiro, mime),
        mimeType: mime,
        enviadoPor: ctx.userId,
      })
      .returning({ id: documentos.id });
    await registarHistorico(tx, ctx, "documento", novo.id, "carregou", {
      tipo: dados.tipo,
      alunoId: dados.alunoId,
      inscricaoId: dados.inscricaoId,
    });
    return novo.id;
  });
}

/** Documento e conteúdo, apenas se pertencer à escola do utilizador. */
export async function obterFicheiroDocumento(ctx: Ctx, id: string) {
  const [doc] = await db
    .select({
      storageKey: documentos.storageKey,
      nomeFicheiro: documentos.nomeFicheiro,
      mimeType: documentos.mimeType,
    })
    .from(documentos)
    .where(and(eq(documentos.id, id), eq(documentos.escolaId, ctx.escolaId)))
    .limit(1);
  if (!doc) return null;
  const conteudo = await armazenamento.ler(doc.storageKey);
  if (!conteudo) return null;
  return { ...doc, conteudo };
}
