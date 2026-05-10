import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const pdfParse = require("pdf-parse");
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let text = "";

    if (file.type === "application/pdf") {
      const data = await pdfParse(buffer);
      text = data.text;
    } else if (file.type === "text/plain" || file.name.endsWith(".md") || file.name.endsWith(".txt")) {
      text = buffer.toString("utf-8");
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload a PDF or text file." },
        { status: 400 }
      );
    }

    return NextResponse.json({ text });
  } catch (error) {
    console.error("Error parsing file:", error);
    return NextResponse.json({ error: "Failed to parse file" }, { status: 500 });
  }
}
