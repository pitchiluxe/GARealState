import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let helpful = true;
  try {
    const body = await req.json();
    if (typeof body.helpful === "boolean") helpful = body.helpful;
  } catch { /* no body — default to helpful=true */ }

  await prisma.kBArticle.update({
    where: { id: params.id },
    data: helpful ? { helpful: { increment: 1 } } : { notHelpful: { increment: 1 } },
  });

  return NextResponse.json({ success: true });
}
