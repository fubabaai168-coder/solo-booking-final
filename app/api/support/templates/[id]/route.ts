import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = {
  params: { id: string };
};

export async function PATCH(req: Request, { params }: Params) {
  const { id } = params;
  try {
    const body = await req.json();
    const { title, prompt, reply, tags, isActive } = body;

    const updateData: {
      title?: string;
      prompt?: string;
      reply?: string;
      tags?: string[];
      isActive?: boolean;
    } = {};

    if (title !== undefined) updateData.title = title;
    if (prompt !== undefined) updateData.prompt = prompt;
    if (reply !== undefined) updateData.reply = reply;
    if (tags !== undefined) updateData.tags = tags;
    if (isActive !== undefined) updateData.isActive = isActive;

    const template = await prisma.supportTemplate.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ template });
  } catch (error) {
    console.error("[support/templates] PATCH error", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: Params) {
  const { id } = params;
  try {
    await prisma.supportTemplate.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[support/templates] DELETE error", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}









