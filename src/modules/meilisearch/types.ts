import { Config } from 'meilisearch';

export type MeiliConfig = MeiliOption[];

export type MeiliOption = Config & { name: string };
