import { z } from 'zod';
import type { ZodType} from 'zod';

// Parses a JSON string to the passed in schema
export function parseJson<
	Input = unknown,
	Output = unknown
>(
	input: string,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	type: ZodType<Output, any, Input>,
): z.SafeParseReturnType<Input, Output> {
	const parseSchema = z.string()
		.transform((str, ctx): z.infer<z.ZodAny> => {
			try {
				return JSON.parse(str);
			} catch ( e ) {
				ctx.addIssue({ code: 'custom', message: 'Invalid JSON' });
				return z.NEVER;
			}
		});

	const parser = parseSchema.safeParse(input);
	if (!parser.success) {
		return { success: false, error: (parser.error as z.ZodError<Input>) };
	}

	return type.safeParse(parser.data);
}
