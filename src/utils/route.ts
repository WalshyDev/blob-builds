type Params = string[];

export class Route {

	#parts: TemplateStringsArray;
	#params: Params;

	constructor(parts: TemplateStringsArray, params: Params) {
		this.#parts = parts;
		this.#params = params;
	}

	toUrl(obj: Record<Params[number], string>) {
		// Validation
		if (this.#params.length !== Object.keys(obj).length) {
			throw new Error('Route does not have the right parameters!');
		}

		// Build the URL
		let url = '';
		for (let i = 0; i < this.#parts.length; i++) {
			url += this.#parts[i];
			if (i < this.#params.length) {
				url += obj[this.#params[i]];
			}
		}

		return url;
	}
}

export function route(parts: TemplateStringsArray, ...params: string[]): Route {
	return new Route(parts, params);
}
