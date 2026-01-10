import { render } from "@react-email/components";
import { registry, TemplateKey } from "./registry";

/**
 * Generic function to get a template and validate its payload.
 */
export function getEmailTemplate<K extends TemplateKey>(
    key: K,
    payload: unknown
) {
    const entry = registry[key];
    if (!entry) {
        throw new Error(`Template key "${key}" not found in registry.`);
    }

    // Runtime Validation
    const parseResult = entry.schema.safeParse(payload);

    if (!parseResult.success) {
        console.error("Schema Validation Failed:", parseResult.error);
        throw new Error(`Invalid payload for template "${key}": ${parseResult.error.message}`);
    }

    const Component = entry.component as any; // Typing cast for generic usage
    return <Component {...parseResult.data} />;
}

/**
 * Helper to render an email to HTML string.
 */
export async function renderEmail<K extends TemplateKey>(
    key: K,
    payload: unknown
): Promise<string> {
    const template = getEmailTemplate(key, payload);
    return await render(template);
}