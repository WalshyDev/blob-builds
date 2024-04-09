import { ZodType, ZodObjectDef, z } from 'zod';
import * as errors from '~/api/errors';
import { Ctx } from '~/types/hono';

const uploadSchema = z.object({
	checksum: z.string().length(64),
	supported_versions: z.string().optional(), // Deprecated: Remove when possible
	supportedVersions: z.string().optional(),
	dependencies: z.array(z.string()).optional(),
	release_notes: z.string().optional(), // Deprecated: Remove when possible
	releaseNotes: z.string().optional(),
	commitHash: z.string()
		.min(7, 'commitHash needs to be at least 7 characters')
		.max(64, 'commitHash needs to be at most 64 characters')
		.regex(/^[a-f0-9]+$/g, 'commitHash doesn\'t look like a valid commit hash')
		.optional(),
});

export type UploadMetadata = z.infer<typeof uploadSchema>;

export type Handler<T> = (ctx: Ctx, file: File, metadata: T) => Response | Promise<Response>;

type ZodSchema = ZodType<unknown, ZodObjectDef, unknown>;

export default function uploadValidator(
	controller: Handler<z.infer<ZodSchema>>,
	schema: ZodSchema = uploadSchema,
) {
	return async (ctx: Ctx) => {
		let formData: FormData;
		try {
			formData = await ctx.req.formData();
		} catch(_) {
			return errors.InvalidUpload('Invalid form data').toResponse(ctx);
		}

		const file = formData.get('file') as (string | File);
		if (!(file instanceof File)) {
			return errors.InvalidUpload('File not provided').toResponse(ctx);
		}

		const metadata = formData.get('metadata');
		if (metadata === null || typeof metadata !== 'string') {
			return errors.InvalidUpload('Metadata not provided').toResponse(ctx);
		}

		let json: object;
		try {
			json = JSON.parse(metadata);
		} catch(_) {
			return errors.InvalidUpload('Metadata is invalid json').toResponse(ctx);
		}

		const parsed = schema.safeParse(json);

		if (parsed.success === true) {
			return controller(ctx, file, parsed.data);
		} else {
			return errors.InvalidJson(
				// Try to return something useful to the user
				// Example output (single error):
				// commitHash: commitHash needs to be at least 7 characters
				// Example output (multiple errors):
				// commitHash: commitHash needs to be at least 7 characters -- commitHash doesn't look like a valid commit hash
				// Example output (multiple fields):
				// supportedVersions: Expected string, received number
				// commitHash: commitHash needs to be at least 7 characters -- commitHash doesn't look like a valid commit hash
				Object.entries(parsed.error.flatten().fieldErrors)
					.map(([key, value]) => `${key}: ${(Array.isArray(value) ? value.join(' -- ') : value)}`)
					.join('\n'),
			).toResponse(ctx);
		}
	};
}
