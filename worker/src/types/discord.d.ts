interface DiscordEmbed {
	title?: string;
	type?: 'rich';
	description?: string;
	url?: string;
	timestamp?: string;
	color?: number;
	footer?: {
		text: string;
		icon_url?: string;
	};
	image?: {
		url: string;
	};
	thumbnail?: {
		url: string;
	};
	author?: {
		name: string;
		url?: string;
		icon_url?: string;
	};
	fields?: EmbedField[];
}

interface EmbedField {
	name: string;
	value: string;
	inline?: boolean;
}
