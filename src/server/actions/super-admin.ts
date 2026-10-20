"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirSuperAdmin } from "@/server/auth/sessao";
import { criarAdminEmpresa, guardarEmpresa } from "@/server/services/super-admin";
import { formParaObjeto } from "@/server/validation/esquemas";

export async function guardarEmpresaAction(fd: FormData) {
  const ctx = await exigirSuperAdmin();
  const data = formParaObjeto(fd);
  const nome = data.nome?.trim();
  if (!nome || nome.length > 150) redirect("/admin/empresas?erro=nome");
  const telefone = data.telefone?.trim() || null;
  if (telefone && telefone.length > 30) redirect("/admin/empresas?erro=telefone");
  try {
    await guardarEmpresa(ctx, { id: data.id || undefined, nome, telefone });
  } catch {
    redirect("/admin/empresas?erro=guardar");
  }
  revalidatePath("/admin");
  revalidatePath("/admin/empresas");
  redirect("/admin/empresas?guardada=1");
}

export async function criarAdminEmpresaAction(fd: FormData) {
  await exigirSuperAdmin();
  const data = formParaObjeto(fd);
  if (!data.nome?.trim() || data.nome.trim().length > 100) redirect("/admin/admins?erro=nome");
  const email = data.email?.trim().toLowerCase() ?? "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) redirect("/admin/admins?erro=email");
  if (!data.password || data.password.length < 8 || data.password.length > 100) redirect("/admin/admins?erro=password");
  if (!data.escolaId) redirect("/admin/admins?erro=empresa");
  try {
    await criarAdminEmpresa({ nome: data.nome.trim(), email, password: data.password, escolaId: data.escolaId });
  } catch {
    redirect("/admin/admins?erro=guardar");
  }
  revalidatePath("/admin/admins");
  revalidatePath("/admin");
  redirect("/admin/admins?criado=1");
}
