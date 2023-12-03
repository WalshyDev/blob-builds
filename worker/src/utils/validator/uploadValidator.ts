import { ZodType, z } from 'zod';
import * as errors from '~/api/errors';
import { Ctx } from '~/types/hono';

const uploadSchema = z.object({
	checksum: z.string().length(64),
	supported_versions: z.string().optional(),
	dependencies: z.array(z.string()).optional(),
	release_notes: z.string().optional(),
});

export type UploadMetadata = z.infer<typeof uploadSchema>;

export type Handler<T> = (ctx: Ctx, file: File, metadata: T) => Response | Promise<Response>;

type ZodSchema = ZodType<unknown, unknown, unknown>;

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
			return errors.InvalidJson(parsed.error.errors[0].message).toResponse(ctx);
		}
	};
}
