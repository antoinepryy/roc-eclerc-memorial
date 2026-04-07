import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.pompes-funebres-roceclerc-nancy.com";
  const url = `${siteUrl}/memorial/${slug}`;

  const qrBuffer = await QRCode.toBuffer(url, {
    type: "png",
    width: 400,
    margin: 2,
    color: {
      dark: "#16234c",
      light: "#ffffff",
    },
  });

  return new NextResponse(new Uint8Array(qrBuffer), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `inline; filename="qr-memorial-${slug}.png"`,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
