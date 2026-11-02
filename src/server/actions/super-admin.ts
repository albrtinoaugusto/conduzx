"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/server/auth/session";
import { MAX_TRIAL_DAYS } from "@/server/domain/school-access";
import { createCompanyAdmin, deleteCompany, saveCompany, setCompanySuspended } from "@/server/services/super-admin";
import { formToObject } from "@/server/validation/schemas";

export async function saveCompanyAction(fd: FormData) {
  const ctx = await requireSuperAdmin();
  const data = formToObject(fd);
  const name = data.name?.trim();
  if (!name || name.length > 150) redirect("/admin/empresas?error=name");
  const phone = data.phone?.trim() || null;
  if (phone && phone.length > 30) redirect("/admin/empresas?error=phone");
  // Vazio = sem limite
  const trialText = data.trialDays?.trim() ?? "";
  const trialDays = trialText ? Number(trialText) : null;
  if (trialDays !== null && (!Number.isInteger(trialDays) || trialDays < 1 || trialDays > MAX_TRIAL_DAYS)) {
    redirect("/admin/empresas?error=trial");
  }
  try {
    await saveCompany(ctx, { id: data.id || undefined, name, phone, trialDays });
  } catch {
    redirect("/admin/empresas?error=save");
  }
  revalidatePath("/admin");
  revalidatePath("/admin/empresas");
  redirect("/admin/empresas?saved=1");
}

export async function setCompanySuspendedAction(fd: FormData) {
  const ctx = await requireSuperAdmin();
  const data = formToObject(fd);
  const suspend = data.suspend === "1";
  try {
    await setCompanySuspended(ctx, data.id ?? "", suspend);
  } catch {
    redirect("/admin/empresas?error=save");
  }
  revalidatePath("/admin");
  revalidatePath("/admin/empresas");
  redirect(`/admin/empresas?done=${suspend ? "suspended" : "reactivated"}`);
}

export async function deleteCompanyAction(fd: FormData) {
  const ctx = await requireSuperAdmin();
  const data = formToObject(fd);
  try {
    await deleteCompany(ctx, data.id ?? "", data.confirmName?.trim() ?? "");
  } catch {
    redirect("/admin/empresas?error=delete");
  }
  revalidatePath("/admin");
  revalidatePath("/admin/empresas");
  revalidatePath("/admin/admins");
  redirect("/admin/empresas?done=deleted");
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
