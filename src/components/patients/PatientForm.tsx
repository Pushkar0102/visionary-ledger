import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
} from '@/components/ui/form';
import { ArrowLeft, Plus, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuditLog } from '@/hooks/useAuditLog';
import { toast } from 'sonner';
import {
  DIAGNOSIS_OPTIONS,
  SURGERY_OPTIONS,
  IOL_OPTIONS,
  SEX_OPTIONS,
  SexType,
  EyeType,
  SurgeryType,
  IOLOption,
} from '@/types/database';

interface PatientFormProps {
  onBack: () => void;
  onSuccess: () => void;
}

const patientSchema = z.object({
  patient_name: z.string().min(1, 'Patient name is required').max(100),
  age: z.number().min(0, 'Age must be positive').max(150, 'Invalid age'),
  sex: z.enum(['Male', 'Female', 'Other'] as const),
  address: z.string().max(500).optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  contact_numbers: z.array(z.object({
    number: z.string().regex(/^[0-9]{10}$/, 'Must be 10 digits')
  })).min(1, 'At least one contact number required'),
  eb_number: z.string().max(50).optional(),
  diagnosis_eye: z.enum(['RE', 'LE'] as const).optional(),
  diagnosis: z.string().optional(),
  diagnosis_eye_left: z.enum(['RE', 'LE'] as const).optional(),
  diagnosis_left: z.string().optional(),
  surgery_eye: z.enum(['RE', 'LE'] as const).optional(),
  surgery_type: z.enum(['PK', 'Tectonic PK', 'TPK', 'DSAEK', 'DALK', 'DMEK', 'Others'] as const).optional(),
  surgery_custom: z.string().max(100).optional(),
  iol_option: z.enum(['with IOL', 'without IOL', '±IOL'] as const).optional(),
  surgeon_name: z.string().max(100).optional(),
  remarks: z.string().max(1000).optional(),
});

type PatientFormData = z.infer<typeof patientSchema>;

export function PatientForm({ onBack, onSuccess }: PatientFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { logAction } = useAuditLog();

  const form = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      patient_name: '',
      age: undefined,
      sex: undefined,
      address: '',
      email: '',
      contact_numbers: [{ number: '' }],
      eb_number: '',
      diagnosis_eye: undefined,
      diagnosis: '',
      diagnosis_eye_left: undefined,
      diagnosis_left: '',
      surgery_eye: undefined,
      surgery_type: undefined,
      surgery_custom: '',
      iol_option: undefined,
      surgeon_name: '',
      remarks: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'contact_numbers',
  });

  const watchSurgeryType = form.watch('surgery_type');

  const onSubmit = async (data: PatientFormData) => {
    setIsSubmitting(true);
    try {
      const contactNumbers = data.contact_numbers.map(c => c.number).filter(Boolean);
      
      const insertData = {
        patient_name: data.patient_name,
        age: data.age,
        sex: data.sex as SexType,
        address: data.address || null,
        email: data.email || null,
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
      };

      const { data: patient, error } = await supabase
        .from('patients')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      await logAction('INSERT', 'patients', patient.id, patient);
      toast.success(`Patient added successfully with WL# ${patient.wl_number}`);
      onSuccess();
    } catch (error: any) {
      console.error('Error adding patient:', error);
      toast.error(error.message || 'Failed to add patient');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Add New Patient</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <FormField
                control={form.control}
                name="patient_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Patient Name *</FormLabel>
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
                name="eb_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>EB Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Eye Bank number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="patient@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
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

          {/* Contact Numbers */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Contact Numbers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-start">
                  <FormField
                    control={form.control}
                    name={`contact_numbers.${index}.number`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            placeholder="10-digit mobile number"
                            maxLength={10}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ number: '' })}
                className="mt-2"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Contact
              </Button>
            </CardContent>
          </Card>

          {/* Diagnosis */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Diagnosis</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-4">
                <Label className="text-sm font-medium text-muted-foreground">Primary Eye</Label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="diagnosis_eye"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Eye</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select eye" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="RE">RE (Right Eye)</SelectItem>
                            <SelectItem value="LE">LE (Left Eye)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="diagnosis"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Diagnosis</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select diagnosis" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {DIAGNOSIS_OPTIONS.map((option) => (
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
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-sm font-medium text-muted-foreground">Secondary Eye (if bilateral)</Label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="diagnosis_eye_left"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Eye</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select eye" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="RE">RE (Right Eye)</SelectItem>
                            <SelectItem value="LE">LE (Left Eye)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="diagnosis_left"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Diagnosis</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select diagnosis" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {DIAGNOSIS_OPTIONS.map((option) => (
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
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Surgery Details */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Surgery Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <FormField
                control={form.control}
                name="surgery_eye"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Surgery Eye</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select eye" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="RE">RE (Right Eye)</SelectItem>
                        <SelectItem value="LE">LE (Left Eye)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="surgery_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Surgery Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SURGERY_OPTIONS.map((option) => (
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

              {watchSurgeryType === 'Others' && (
                <FormField
                  control={form.control}
                  name="surgery_custom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custom Surgery</FormLabel>
                      <FormControl>
                        <Input placeholder="Specify surgery" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="iol_option"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IOL Option</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select IOL" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {IOL_OPTIONS.map((option) => (
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
                name="surgeon_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Surgeon Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter surgeon name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Remarks */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="remarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remarks</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any additional notes or remarks"
                        className="resize-none min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onBack}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add Patient
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
