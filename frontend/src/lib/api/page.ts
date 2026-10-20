// One page of a list, as the backend's PageResponse sends it. Pages count from 0.
export interface PageResponse<T> {
    items: T[];
    page: number;
    size: number;
    totalItems: number;
    totalPages: number;
}
