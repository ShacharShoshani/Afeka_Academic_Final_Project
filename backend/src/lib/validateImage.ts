import { type Request, type Response } from 'express';

// Shared image validation for base64 data URLs.
// Allowed MIME types: jpeg, jpg, png, webp. SVG explicitly blocked.
// Max payload: ~5 MB raw → ~6.7 MB base64 — enforced at 7 MB base64 length.

const ALLOWED_MIME_RE = /^data:image\/(jpeg|jpg|png|webp);base64,/i;
const MAX_B64_LENGTH = 7 * 1024 * 1024; // 7 MB in characters

export type ImageValidationError =
    | 'MISSING'
    | 'INVALID_FORMAT'
    | 'UNSUPPORTED_TYPE'
    | 'TOO_LARGE';

export function validateImageDataUrl(value: unknown): ImageValidationError | null {
    if (value === null || value === undefined || value === '') return 'MISSING';
    if (typeof value !== 'string') return 'INVALID_FORMAT';
    if (!value.startsWith('data:image/')) return 'INVALID_FORMAT';
    if (!ALLOWED_MIME_RE.test(value)) return 'UNSUPPORTED_TYPE'; // catches SVG and unknown types
    if (value.length > MAX_B64_LENGTH) return 'TOO_LARGE';
    return null;
}

export function imageErrorMessage(err: ImageValidationError): string {
    switch (err) {
        case 'MISSING': return 'Image is required';
        case 'INVALID_FORMAT': return 'Image must be a base64 data URL';
        case 'UNSUPPORTED_TYPE': return 'Image must be a JPEG, PNG, or WebP';
        case 'TOO_LARGE': return 'Image must be under 5 MB';
    }
}

export function checkBodyImage(req: Request, res: Response): boolean {
    if (!req.body.image) return true;
    const err = validateImageDataUrl(req.body.image);
    if (err) { res.status(400).json({ error: imageErrorMessage(err) }); return false; }
    return true;
}

// Zod refinement helper — use with z.string().
// Returns false (fails) when the image is invalid; message comes from the refine context.
export const zImageDataUrl = (z: typeof import('zod')) =>
    z.string().superRefine((val, ctx) => {
        const err = validateImageDataUrl(val);
        if (err) {
            ctx.addIssue({ code: 'custom', message: imageErrorMessage(err) });
        }
    });
