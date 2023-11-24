import { getStore } from '~/utils/storage';

export function trace<T>(name: string, fn: (...args: unknown[]) => T) {
	getStore()?.sentry?.addBreadcrumb({ message: name });

	const value = fn();

	if (value instanceof Promise) {
		// TODO: when tracing, stop the span
		value.finally(() => { return null; });
	}

	return value;
}

export function traceMethod(name?: string, data: object = {}) {
	return (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) => {
		let caller = propertyKey;

		if (target && target.constructor) {
			caller = `${target.constructor.name}.${propertyKey}`;
		}

		const fn = descriptor.value;
		descriptor.value = function(...args: unknown[]) {
			getStore()?.sentry?.addBreadcrumb({ message: name ?? caller, data });
			return fn.apply(this, args);
		};
	};
}
