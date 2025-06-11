import { useQuery } from '@tanstack/react-query';
import { ICategory } from '@/models/category.model';

export const useGetCategories = () => {
    const query = useQuery<ICategory[]>({
        queryKey: ['categories'],
        queryFn: async () => {
            const response = await fetch('/api/categories');
            if (!response.ok) {
                throw new Error('Failed to fetch categories');
            }
            const data = await response.json();
            return data;
        }
    });
    return { categories: query.data || [], isLoading: query.isLoading };
}; 