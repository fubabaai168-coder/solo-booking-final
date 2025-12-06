import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const templates = await prisma.supportTemplate.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ templates });
  } catch (error) {
    console.error("[support/templates] GET error", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      title,
      prompt,
      reply,
      tags,
      isActive,
    }: {
      title: string;
      prompt: string;
      reply: string;
      tags?: string[];
      isActive?: boolean;
    } = body;

    if (!title || !prompt || !reply) {
      return NextResponse.json(
        { error: "title, prompt, reply are required" },
        { status: 400 }
      );
    }

    const template = await prisma.supportTemplate.create({
      data: {
        title,
        prompt,
        reply,
        tags: tags ?? [],
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error("[support/templates] POST error", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}









