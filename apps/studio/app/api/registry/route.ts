import { registry } from "@/emails/registry";
import { type NextRequest, NextResponse } from "next/server";
import { zodToJsonSchema } from "zod-to-json-schema";



export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;

        const include_schema = searchParams.get("include_schema");
        if (include_schema) {
            const registry_list = Object.entries(registry).map(([key, value]) => {
                return {
                    key,
                    schema: zodToJsonSchema(value?.schema)
                }
            });
            return NextResponse.json(
                { data: registry_list },
                { status: 200 }
            );
        }
        const registry_list = Object.keys(registry);

        return NextResponse.json(
            { data: registry_list },
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
