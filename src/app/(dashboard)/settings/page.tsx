'use client';

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { UserSettingsForm, UserSettingsFormValues } from "@/components/forms/user-settings-form";

const SettingsPage = () => {
    const { data: session, status } = useSession();
    const [userSettings, setUserSettings] = useState<Partial<UserSettingsFormValues> | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUserSettings = async () => {
            if (status === 'loading') return;
            
            if (!session?.user?.id) {
                setError('Not authenticated');
                setIsLoading(false);
                return;
            }

            try {
                const response = await fetch('/api/user');
                
                if (!response.ok) {
                    throw new Error('Failed to fetch user settings');
                }

                const userData = await response.json();
                setUserSettings({
                    name: userData.name,
                    currency: userData.currency,
                });
            } catch (err) {
                console.error('Error fetching user settings:', err);
                setError(err instanceof Error ? err.message : 'Failed to fetch user settings');
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserSettings();
    }, [session, status]);

    if (status === 'loading' || isLoading) {
        return (
            <div className="max-w-screen-2xl mx-auto w-full pb-10 -mt-24">
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-screen-2xl mx-auto w-full pb-10 -mt-24">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{error}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-screen-2xl mx-auto w-full pb-10 -mt-24">
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
                    <p className="text-white/80">
                        Manage your account settings and preferences.
                    </p>
                </div>

                <div className="max-w-2xl">
                    <UserSettingsForm defaultValues={userSettings || undefined} />
                </div>
            </div>
        </div>
    );
};

export default SettingsPage; 