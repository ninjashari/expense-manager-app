/**
 * Bill Settings Form Component
 * 
 * This component provides a comprehensive form for configuring credit card bill
 * generation settings. It includes validation, error handling, and supports
 * various billing configurations like due dates, minimum payments, and notifications.
 */

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Loader2, Settings, Calendar, Bell, CreditCard } from 'lucide-react';
import type { BillGenerationSettings } from '@/types/credit-card-bill.types';

// Form validation schema
const billSettingsSchema = z.object({
  billGenerationDay: z.number()
    .min(1, 'Day must be between 1 and 31')
    .max(31, 'Day must be between 1 and 31'),
  billDueDay: z.number()
    .min(1, 'Day must be between 1 and 31')
    .max(31, 'Day must be between 1 and 31'),
  interestRate: z.number()
    .min(0, 'Interest rate cannot be negative')
    .max(100, 'Interest rate cannot exceed 100%')
    .optional(),
  minimumPaymentPercentage: z.number()
    .min(0.1, 'Minimum payment must be at least 0.1%')
    .max(100, 'Minimum payment cannot exceed 100%')
    .optional(),
  gracePeriodDays: z.number()
    .min(0, 'Grace period cannot be negative')
    .max(30, 'Grace period cannot exceed 30 days')
    .optional(),
  lateFeeAmount: z.number()
    .min(0, 'Late fee cannot be negative')
    .optional(),
  enableAutoGeneration: z.boolean().optional(),
  enableNotifications: z.boolean().optional(),
  notificationDays: z.array(z.number()).optional(),
  enableEmailNotifications: z.boolean().optional(),
  enableSmsNotifications: z.boolean().optional(),
  currency: z.string().optional(),
  notes: z.string().optional(),
}).refine((data) => {
  // Ensure due day is after generation day
  if (data.billDueDay <= data.billGenerationDay) {
    return data.billDueDay + 30 > data.billGenerationDay; // Handle month rollover
  }
  return true;
}, {
  message: "Due day must be after generation day",
  path: ["billDueDay"],
});



/**
 * Main Bill Settings Form Component
 * 
 * Provides a comprehensive interface for configuring bill generation settings
 * including due dates, payment terms, notifications, and automation options.
 */
interface BillSettingsFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings?: BillGenerationSettings;
  onSave: (settings: BillGenerationSettings) => void;
  isLoading?: boolean;
}

export function BillSettingsForm({
  open,
  onOpenChange,
  settings,
  onSave,
  isLoading = false,
}: BillSettingsFormProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'automation'>('general');

  // Form setup with validation
  const form = useForm<BillGenerationSettings>({
    resolver: zodResolver(billSettingsSchema),
    defaultValues: {
      billGenerationDay: 1,
      billDueDay: 15,
      gracePeriodDays: 3,
      minimumPaymentPercentage: 5,
      interestRate: 18,
      lateFeeAmount: 25,
      enableAutoGeneration: true,
      enableNotifications: true,
      notificationDays: [7, 3, 1],
      enableEmailNotifications: true,
      enableSmsNotifications: false,
      ...settings,
    },
  });

  // Update form when settings change
  useEffect(() => {
    if (settings) {
      form.reset(settings);
    }
  }, [settings, form]);

  // Handle form submission
  const handleSubmit = (data: BillGenerationSettings) => {
    try {
      onSave(data);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle form errors
  const handleError = (errors: Record<string, { message?: string }>) => {
    const firstError = Object.values(errors)[0];
    toast({
      title: 'Validation Error',
      description: firstError?.message || 'Please check your input and try again.',
      variant: 'destructive',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Bill Generation Settings
          </DialogTitle>
          <DialogDescription>
            Configure how credit card bills are generated and managed for your accounts.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit, handleError)} className="space-y-6">
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-muted p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTab('general')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'general'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <CreditCard className="h-4 w-4 inline mr-2" />
              General
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('notifications')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'notifications'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Bell className="h-4 w-4 inline mr-2" />
              Notifications
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('automation')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'automation'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Calendar className="h-4 w-4 inline mr-2" />
              Automation
            </button>
          </div>

          {/* General Settings Tab */}
          {activeTab === 'general' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">General Bill Settings</CardTitle>
                <CardDescription>
                  Configure basic bill generation parameters and payment terms.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="billDueDay">Bill Due Day</Label>
                    <Select
                      value={form.watch('billDueDay')?.toString()}
                      onValueChange={(value) => form.setValue('billDueDay', parseInt(value))}
                    >
                      <SelectTrigger id="billDueDay">
                        <SelectValue placeholder="Select due day" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                          <SelectItem key={day} value={day.toString()}>
                            {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.billDueDay && (
                      <p className="text-sm text-red-600 mt-1">
                        {form.formState.errors.billDueDay.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="gracePeriodDays">Grace Period (Days)</Label>
                    <Input
                      id="gracePeriodDays"
                      type="number"
                      min="0"
                      max="30"
                      {...form.register('gracePeriodDays', { valueAsNumber: true })}
                    />
                    {form.formState.errors.gracePeriodDays && (
                      <p className="text-sm text-red-600 mt-1">
                        {form.formState.errors.gracePeriodDays.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="minimumPaymentPercentage">Minimum Payment (%)</Label>
                    <Input
                      id="minimumPaymentPercentage"
                      type="number"
                      min="1"
                      max="100"
                      step="0.1"
                      {...form.register('minimumPaymentPercentage', { valueAsNumber: true })}
                    />
                    {form.formState.errors.minimumPaymentPercentage && (
                      <p className="text-sm text-red-600 mt-1">
                        {form.formState.errors.minimumPaymentPercentage.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="interestRate">Interest Rate (% per annum)</Label>
                    <Input
                      id="interestRate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      {...form.register('interestRate', { valueAsNumber: true })}
                    />
                    {form.formState.errors.interestRate && (
                      <p className="text-sm text-red-600 mt-1">
                        {form.formState.errors.interestRate.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="lateFeeAmount">Late Fee Amount</Label>
                    <Input
                      id="lateFeeAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      {...form.register('lateFeeAmount', { valueAsNumber: true })}
                    />
                    {form.formState.errors.lateFeeAmount && (
                      <p className="text-sm text-red-600 mt-1">
                        {form.formState.errors.lateFeeAmount.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={form.watch('currency')}
                      onValueChange={(value) => form.setValue('currency', value)}
                    >
                      <SelectTrigger id="currency">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                        <SelectItem value="INR">INR (₹)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notification Settings</CardTitle>
                <CardDescription>
                  Configure when and how you receive bill notifications.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enableNotifications">Enable Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications about upcoming bills and due dates
                    </p>
                  </div>
                  <Switch
                    id="enableNotifications"
                    checked={form.watch('enableNotifications')}
                    onCheckedChange={(checked) => form.setValue('enableNotifications', checked)}
                  />
                </div>

                {form.watch('enableNotifications') && (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="enableEmailNotifications">Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Send notifications via email
                        </p>
                      </div>
                      <Switch
                        id="enableEmailNotifications"
                        checked={form.watch('enableEmailNotifications')}
                        onCheckedChange={(checked) => form.setValue('enableEmailNotifications', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="enableSmsNotifications">SMS Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Send notifications via SMS
                        </p>
                      </div>
                      <Switch
                        id="enableSmsNotifications"
                        checked={form.watch('enableSmsNotifications')}
                        onCheckedChange={(checked) => form.setValue('enableSmsNotifications', checked)}
                      />
                    </div>

                    <div>
                      <Label>Notification Days</Label>
                      <p className="text-sm text-muted-foreground mb-2">
                        Days before due date to send notifications (comma-separated)
                      </p>
                      <Input
                        placeholder="7, 3, 1"
                        value={form.watch('notificationDays')?.join(', ')}
                        onChange={(e) => {
                          const days = e.target.value
                            .split(',')
                            .map(d => parseInt(d.trim()))
                            .filter(d => !isNaN(d) && d > 0);
                          form.setValue('notificationDays', days);
                        }}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Automation Tab */}
          {activeTab === 'automation' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Automation Settings</CardTitle>
                <CardDescription>
                  Configure automatic bill generation and processing options.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enableAutoGeneration">Auto Generate Bills</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically generate bills based on transaction data
                    </p>
                  </div>
                  <Switch
                    id="enableAutoGeneration"
                    checked={form.watch('enableAutoGeneration')}
                    onCheckedChange={(checked) => form.setValue('enableAutoGeneration', checked)}
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any additional notes or instructions for bill generation..."
                    {...form.register('notes')}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Settings
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 