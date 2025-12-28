import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { ArrowLeft, Loader2, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuditLog } from '@/hooks/useAuditLog';
import { toast } from 'sonner';
import { SEX_OPTIONS, SOURCE_OF_AWARENESS_OPTIONS, SexType } from '@/types/database';

interface DonorFormProps {
  onBack: () => void;
  onSuccess: () => void;
}

const donorSchema = z.object({
  donor_name: z.string().min(1, 'Donor name is required').max(100),
  age: z.number().min(0, 'Age must be positive').max(150, 'Invalid age'),
  sex: z.enum(['Male', 'Female', 'Other'] as const),
  cause_of_death: z.string().max(200).optional(),
  address: z.string().max(500).optional(),
  death_to_retrieval_hours: z.number().min(0).max(72).optional(),
  death_to_retrieval_minutes: z.number().min(0).max(59).optional(),
  eye_number_right: z.string().min(1, 'Right eye number is required').max(50),
  eye_number_left: z.string().min(1, 'Left eye number is required').max(50),
  source_of_awareness: z.string().max(100).optional(),
  retrieval_date: z.string().optional(),
});

type DonorFormData = z.infer<typeof donorSchema>;

export function DonorForm({ onBack, onSuccess }: DonorFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { logAction } = useAuditLog();

  const form = useForm<DonorFormData>({
    resolver: zodResolver(donorSchema),
    defaultValues: {
      donor_name: '',
      age: undefined,
      sex: undefined,
      cause_of_death: '',
      address: '',
      death_to_retrieval_hours: 0,
      death_to_retrieval_minutes: 0,
      eye_number_right: '',
      eye_number_left: '',
      source_of_awareness: '',
      retrieval_date: new Date().toISOString().split('T')[0],
    },
  });

  const onSubmit = async (data: DonorFormData) => {
    setIsSubmitting(true);
    try {
      const insertData = {
        donor_name: data.donor_name,
        age: data.age,
        sex: data.sex as SexType,
        cause_of_death: data.cause_of_death || null,
        address: data.address || null,
        death_to_retrieval_hours: data.death_to_retrieval_hours || 0,
        death_to_retrieval_minutes: data.death_to_retrieval_minutes || 0,
        eye_number_right: data.eye_number_right,
        eye_number_left: data.eye_number_left,
        source_of_awareness: data.source_of_awareness || null,
        retrieval_date: data.retrieval_date || new Date().toISOString().split('T')[0],
      };

      const { data: donor, error } = await supabase
        .from('donors')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      await logAction('INSERT', 'donors', donor.id, donor);
      toast.success(`Donor added successfully with Serial# ${donor.serial_number}`);
      onSuccess();
    } catch (error: any) {
      console.error('Error adding donor:', error);
      toast.error(error.message || 'Failed to add donor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const hours = form.watch('death_to_retrieval_hours') || 0;
  const minutes = form.watch('death_to_retrieval_minutes') || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Add New Donor</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Donor Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <FormField
                control={form.control}
                name="donor_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Donor Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Age *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Years"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sex"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sex *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select sex" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SEX_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="retrieval_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Retrieval Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cause_of_death"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Cause of Death</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter cause of death" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="md:col-span-2 lg:col-span-3">
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter address" className="resize-none" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Death to Retrieval Time */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Death to Retrieval Time (DRT)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="death_to_retrieval_hours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hours</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={72}
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          value={field.value ?? 0}
                        />
                      </FormControl>
                      <FormDescription>Max 72 hours</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="death_to_retrieval_minutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minutes</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={59}
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          value={field.value ?? 0}
                        />
                      </FormControl>
                      <FormDescription>0-59 minutes</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="mt-3 p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Total DRT: {hours}h {minutes}m</p>
              </div>
            </CardContent>
          </Card>

          {/* Eye Numbers */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Eye Numbers</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="eye_number_right"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Right Eye (RE) Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., EB2024-001-RE" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="eye_number_left"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Left Eye (LE) Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., EB2024-001-LE" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Source of Awareness */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="source_of_awareness"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source of Awareness</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SOURCE_OF_AWARENESS_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>How did the donor/family learn about eye donation?</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onBack} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add Donor
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
