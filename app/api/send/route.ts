import { handleEmailFire } from "@/emails/helper"; // Keeping existing transport logic
import { registry } from "@/emails/registry";
import { config } from "@/project.config";
import { renderEmail } from "@emails/renderer"; // Using our new renderer
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// The master payload schema matches the registry keys
const requestSchema = z.object({
  template_key: z.enum(Object.keys(registry) as [string, ...string[]]),
  targets: z.array(z.string().email()),
  subject: z.string(),
  // Payload is flexible here because specific validation happens in `renderEmail`
  payload: z.record(z.any()),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Validate the Request Structure
    const res = requestSchema.safeParse(body);
    if (!res.success) {
      return NextResponse.json(
        { error: "Invalid Request Structure", details: res.error.format() },
        { status: 400 }
      );
    }

    const { template_key, targets, subject, payload } = res.data;

    console.log(`[Email] Rendering ${template_key} for ${targets.length} targets`);

    // 2. Render & Validate Template Specifics
    // This will throw if payload doesn't match the specific template schema
    let emailHtml: string;
    try {
      // Explicitly cast template_key to match the registry key type
      emailHtml = await renderEmail(template_key as keyof typeof registry, payload);
    } catch (e: any) {
      return NextResponse.json(
        { error: "Template Validation Failed", message: e.message },
        { status: 400 }
      );
    }
    console.log("[handleEmailFire]:", res.data.payload)
    // 3. Send Email
    const response = await handleEmailFire(config.email.sender, {
      to: targets,
      subject: subject,
      html: emailHtml,
    });

    if (response.rejected.length > 0) {
      return NextResponse.json(
        { error: "Some emails were rejected", rejected: response.rejected },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { data: response.accepted },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Internal Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error.message },
      { status: 500 }
    );
  }
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type,X-Authorization, Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version",
  "Access-Control-Max-Age": "86400",
};
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}
