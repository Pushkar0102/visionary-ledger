import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
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
} from '@/components/ui/form';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuditLog } from '@/hooks/useAuditLog';
import { toast } from 'sonner';
import {
  DIAGNOSIS_OPTIONS,
  SURGERY_OPTIONS,
  IOL_OPTIONS,
  SEX_OPTIONS,
  Patient,
  SexType,
  EyeType,
  SurgeryType,
  IOLOption,
} from '@/types/database';

interface PatientEditFormProps {
  patient: Patient;
  onSuccess: () => void;
  onCancel: () => void;
}

const patientSchema = z.object({
  patient_name: z.string().min(1, 'Patient name is required').max(100),
  age: z.number().min(0, 'Age must be positive').max(150, 'Invalid age'),
  sex: z.enum(['Male', 'Female', 'Other'] as const),
  address: z.string().max(500).optional(),
  contact_numbers: z.array(z.object({
    number: z.string().regex(/^[0-9]{10}$/, 'Must be 10 digits')
  })).min(1, 'At least one contact number required'),
  eb_number: z.string().max(50).optional(),
  diagnosis_eye: z.enum(['RE', 'LE'] as const).optional().nullable(),
  diagnosis: z.string().optional(),
  diagnosis_eye_left: z.enum(['RE', 'LE'] as const).optional().nullable(),
  diagnosis_left: z.string().optional(),
  surgery_eye: z.enum(['RE', 'LE'] as const).optional().nullable(),
  surgery_type: z.enum(['PK', 'Tectonic PK', 'TPK', 'DSAEK', 'DALK', 'DMEK', 'Others'] as const).optional().nullable(),
  surgery_custom: z.string().max(100).optional(),
  iol_option: z.enum(['with IOL', 'without IOL', '±IOL'] as const).optional().nullable(),
  surgeon_name: z.string().max(100).optional(),
  remarks: z.string().max(1000).optional(),
  is_operated: z.boolean().optional(),
  operation_date: z.string().optional(),
});

type PatientFormData = z.infer<typeof patientSchema>;

export function PatientEditForm({ patient, onSuccess, onCancel }: PatientEditFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { logAction } = useAuditLog();

  const contactNumbers = (patient.contact_numbers || []).map(n => ({ number: n }));
  if (contactNumbers.length === 0) contactNumbers.push({ number: '' });

  const form = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      patient_name: patient.patient_name,
      age: patient.age,
      sex: patient.sex as 'Male' | 'Female' | 'Other',
      address: patient.address || '',
      contact_numbers: contactNumbers,
      eb_number: patient.eb_number || '',
      diagnosis_eye: patient.diagnosis_eye as 'RE' | 'LE' | undefined,
      diagnosis: patient.diagnosis || '',
      diagnosis_eye_left: patient.diagnosis_eye_left as 'RE' | 'LE' | undefined,
      diagnosis_left: patient.diagnosis_left || '',
      surgery_eye: patient.surgery_eye as 'RE' | 'LE' | undefined,
      surgery_type: patient.surgery_type as 'PK' | 'Tectonic PK' | 'TPK' | 'DSAEK' | 'DALK' | 'DMEK' | 'Others' | undefined,
      surgery_custom: patient.surgery_custom || '',
      iol_option: patient.iol_option as 'with IOL' | 'without IOL' | '±IOL' | undefined,
      surgeon_name: patient.surgeon_name || '',
      remarks: patient.remarks || '',
      is_operated: patient.is_operated || false,
      operation_date: patient.operation_date || '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'contact_numbers',
  });

  const watchSurgeryType = form.watch('surgery_type');
  const watchIsOperated = form.watch('is_operated');

  const onSubmit = async (data: PatientFormData) => {
    setIsSubmitting(true);
    try {
      const contactNumbers = data.contact_numbers.map(c => c.number).filter(Boolean);
      
      const updateData = {
        patient_name: data.patient_name,
        age: data.age,
        sex: data.sex as SexType,
        address: data.address || null,
        contact_numbers: contactNumbers,
        eb_number: data.eb_number || null,
        diagnosis_eye: (data.diagnosis_eye as EyeType) || null,
        diagnosis: data.diagnosis || null,
        diagnosis_eye_left: (data.diagnosis_eye_left as EyeType) || null,
        diagnosis_left: data.diagnosis_left || null,
        surgery_eye: (data.surgery_eye as EyeType) || null,
        surgery_type: (data.surgery_type as SurgeryType) || null,
        surgery_custom: data.surgery_type === 'Others' ? data.surgery_custom || null : null,
        iol_option: (data.iol_option as IOLOption) || null,
        surgeon_name: data.surgeon_name || null,
        remarks: data.remarks || null,
        is_operated: data.is_operated || false,
        operation_date: data.is_operated ? data.operation_date || null : null,
      };

      const { error } = await supabase
        .from('patients')
        .update(updateData)
        .eq('id', patient.id);

      if (error) throw error;

      await logAction('UPDATE', 'patients', patient.id, patient as unknown as Record<string, unknown>, updateData as unknown as Record<string, unknown>);
      toast.success('Patient updated successfully');
      onSuccess();
    } catch (error: any) {
      console.error('Error updating patient:', error);
      toast.error(error.message || 'Failed to update patient');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="patient_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Patient Name *</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-2">
            <FormField
              control={form.control}
              name="age"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Age *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
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
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SEX_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Textarea className="resize-none" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Contact Numbers */}
        <div className="space-y-2">
          <Label>Contact Numbers *</Label>
          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-2">
              <FormField
                control={form.control}
                name={`contact_numbers.${index}.number`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input maxLength={10} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {fields.length > 1 && (
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              )}
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => append({ number: '' })}>
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        </div>

        {/* Diagnosis */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid grid-cols-2 gap-2">
            <FormField
              control={form.control}
              name="diagnosis_eye"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dx Eye</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="-" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="RE">RE</SelectItem>
                      <SelectItem value="LE">LE</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="diagnosis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Diagnosis</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="-" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {DIAGNOSIS_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <FormField
              control={form.control}
              name="surgery_eye"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sx Eye</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="-" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="RE">RE</SelectItem>
                      <SelectItem value="LE">LE</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="surgery_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Surgery</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="-" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SURGERY_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>
        </div>

        {watchSurgeryType === 'Others' && (
          <FormField
            control={form.control}
            name="surgery_custom"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Custom Surgery Type</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="iol_option"
            render={({ field }) => (
              <FormItem>
                <FormLabel>IOL Option</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ''}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="-" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {IOL_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="surgeon_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Surgeon</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {/* Operation Status */}
        <div className="space-y-3 p-3 border rounded-lg bg-muted/50">
          <FormField
            control={form.control}
            name="is_operated"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="!mt-0">Operated</FormLabel>
              </FormItem>
            )}
          />
          {watchIsOperated && (
            <FormField
              control={form.control}
              name="operation_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Operation Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          )}
        </div>

        <FormField
          control={form.control}
          name="remarks"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Remarks</FormLabel>
              <FormControl>
                <Textarea className="resize-none" {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
}
