// ---------------------------------------------------------------------------
// api/curriculum — the Premium Course Curriculum PDF download.
// The real PDF file comes from Siam (Section 19 placeholder). Until then
// this serves a clearly marked placeholder PDF so the button works.
// ---------------------------------------------------------------------------
import { NextResponse } from "next/server";

// A minimal one-page PDF that says it is a placeholder.
const PLACEHOLDER_PDF = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length 260 >> stream
BT /F1 20 Tf 72 720 Td (LearnChart FX - Premium Course Curriculum) Tj ET
BT /F1 12 Tf 72 680 Td ([Placeholder - the real curriculum PDF comes from Siam.]) Tj ET
BT /F1 12 Tf 72 650 Td (10 lessons / 1.5 hrs - Forex Trading Premium Course) Tj ET
BT /F1 12 Tf 72 620 Td (Mentors: Siam Chowdhury & Rex Mizan) Tj ET
endstream endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000280 00000 n
0000000591 00000 n
trailer << /Size 6 /Root 1 0 R >>
startxref
680
%%EOF`;

export async function GET() {
  return new NextResponse(PLACEHOLDER_PDF, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="LearnChart-FX-Curriculum.pdf"',
    },
  });
}
