/// <reference types="astro/client" />

declare namespace App {
	export interface Locals {
		runtime: {
			env: Env;
		}
		user: UserResponse;
	}
}
