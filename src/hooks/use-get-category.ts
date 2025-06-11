import { useQuery } from '@tanstack/react-query';
import { ICategory } from '@/models/category.model';

export function useGetCategory(id?: string) {
    const query = useQuery<ICategory>({
        enabled: !!id,
        queryKey: ['categories', { id }],
        queryFn: async () => {
            const res = await fetch(`/api/categories/${id}`);
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Failed to fetch category');
            }
            return res.json();
        },
    });

    return query;
} 