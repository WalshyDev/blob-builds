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

interface WebhookMessage {
	id: number;
	type: number;
	content: string;
	channel_id: number;
	author: {
			id: number;
			username: string;
			avatar: string | null;
			discriminator?: number;
			public_flags: number;
			flags: number;
			bot: boolean;
			global_name: string | null;
	},
	attachments: object[],
	embeds: DiscordEmbed[],
	mentions: object[],
	mention_roles: object[],
	pinned: boolean;
	mention_everyone: boolean;
	tts: boolean;
	timestamp: string;
	edited_timestamp: string | null;
	flags: number;
	components: object[],
	webhook_id: number;
}
