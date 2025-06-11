'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { DateRange } from 'react-day-picker';
import { useSession } from 'next-auth/react';
import { formatCurrency } from '@/lib/utils';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const ReportsPage = () => {
  const { data: session } = useSession();
  const currency = session?.user?.currency || 'INR';

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
    to: new Date(),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['expenses-by-category', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateRange?.from) params.append('from', dateRange.from.toISOString());
      if (dateRange?.to) params.append('to', dateRange.to.toISOString());

      const response = await fetch(`/api/reports/expenses-by-category?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch report data');
      }
      const reportData = await response.json();
      return reportData.map((item: any) => ({
          ...item,
          value: item.value / 100, // Convert from cents
      }));
    },
    enabled: !!dateRange && !!session,
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-200 rounded-md shadow-sm">
          <p className="font-semibold">{`${payload[0].name}`}</p>
          <p className="text-sm">{`${formatCurrency(payload[0].value, currency)}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-screen-2xl mx-auto w-full pb-10 -mt-24">
        <h1 className="text-3xl font-bold text-white mb-6">Reports</h1>
        <Card>
            <CardHeader>
                <CardTitle>Expenses by Category</CardTitle>
                <div className="pt-4">
                    <DateRangePicker date={dateRange} onDateChange={setDateRange} />
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="h-[350px] w-full flex items-center justify-center">
                        <div className="h-16 w-16 border-4 border-dashed rounded-full animate-spin border-primary" />
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={350}>
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                nameKey="name"
                                label
                            >
                                {data?.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    </div>
  );
};

export default ReportsPage; 