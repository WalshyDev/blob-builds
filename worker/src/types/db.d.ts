import { TableConfig } from 'drizzle-orm/sqlite-core';

type Columns<T extends TableConfig> = {
	[Key in keyof T['columns']]: T['columns'][Key];
}
