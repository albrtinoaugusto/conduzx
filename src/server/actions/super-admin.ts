"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/server/auth/session";
import { createCompanyAdmin, saveCompany } from "@/server/services/super-admin";
import { formToObject } from "@/server/validation/schemas";

export async function saveCompanyAction(fd: FormData) {
  const ctx = await requireSuperAdmin();
  const data = formToObject(fd);
  const name = data.name?.trim();
  if (!name || name.length > 150) redirect("/admin/empresas?error=name");
  const phone = data.phone?.trim() || null;
  if (phone && phone.length > 30) redirect("/admin/empresas?error=phone");
  try {
    await saveCompany(ctx, { id: data.id || undefined, name, phone });
  } catch {
    redirect("/admin/empresas?error=save");
  }
  revalidatePath("/admin");
  revalidatePath("/admin/empresas");
  redirect("/admin/empresas?saved=1");
}

export async function createCompanyAdminAction(fd: FormData) {
  await requireSuperAdmin();
  const data = formToObject(fd);
  if (!data.name?.trim() || data.name.trim().length > 100) redirect("/admin/admins?error=name");
  const email = data.email?.trim().toLowerCase() ?? "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) redirect("/admin/admins?error=email");
  if (!data.password || data.password.length < 8 || data.password.length > 100) redirect("/admin/admins?error=password");
  if (!data.schoolId) redirect("/admin/admins?error=company");
  try {
    await createCompanyAdmin({ name: data.name.trim(), email, password: data.password, schoolId: data.schoolId });
  } catch {
    redirect("/admin/admins?error=save");
  }
  revalidatePath("/admin/admins");
  revalidatePath("/admin");
  redirect("/admin/admins?created=1");
}
