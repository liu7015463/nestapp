import { SelectTrashMode } from '@/modules/database/constants';

export type SearchType = 'mysql' | 'meili';

export interface ContentConfig {
    SearchType?: SearchType;
}

export interface SearchOption {
    trashed?: SelectTrashMode;
    isPublished?: boolean;
    page?: number;
    limit?: number;
}
