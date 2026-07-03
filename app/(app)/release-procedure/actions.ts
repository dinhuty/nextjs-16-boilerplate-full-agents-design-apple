"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  releaseProcedures,
  type ProcedureBlock,
  type ProcedureLanguage,
  type ProcedureVariables,
} from "@/db/schema";
import { requireUser } from "@/lib/auth/dal";

export type ProcedureInput = {
  title: string;
  language: ProcedureLanguage;
  blocks: ProcedureBlock[];
  variables: ProcedureVariables;
};

export async function createProcedure(input: ProcedureInput): Promise<void> {
  const user = await requireUser();
  const rows = await db
    .insert(releaseProcedures)
    .values({
      title: input.title,
      language: input.language,
      blocks: input.blocks,
      variables: input.variables,
      createdBy: user.id,
    })
    .returning({ id: releaseProcedures.id });

  revalidatePath("/release-procedure");
  redirect(`/release-procedure/${rows[0].id}`);
}

export async function updateProcedure(
  id: number,
  input: ProcedureInput,
): Promise<void> {
  await requireUser();
  await db
    .update(releaseProcedures)
    .set({
      title: input.title,
      language: input.language,
      blocks: input.blocks,
      variables: input.variables,
      updatedAt: new Date(),
    })
    .where(eq(releaseProcedures.id, id));

  revalidatePath("/release-procedure");
  revalidatePath(`/release-procedure/${id}`);
  redirect(`/release-procedure/${id}`);
}

export async function deleteProcedure(id: number): Promise<void> {
  await requireUser();
  await db.delete(releaseProcedures).where(eq(releaseProcedures.id, id));
  revalidatePath("/release-procedure");
  redirect("/release-procedure");
}
