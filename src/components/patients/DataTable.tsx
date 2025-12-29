import { ExtractedPatientData } from '@/types/patient';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface DataTableProps {
  data: ExtractedPatientData[];
}

export function DataTable({ data }: DataTableProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No data to display
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <ScrollArea className="h-[600px] w-full">
        <div className="min-w-max">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
              <TableRow>
                <TableHead className="min-w-[60px] font-semibold">S.No</TableHead>
                <TableHead className="min-w-[200px] font-semibold">Patient Name</TableHead>
                <TableHead className="min-w-[80px] font-semibold">Age</TableHead>
                <TableHead className="min-w-[80px] font-semibold">Sex</TableHead>
                <TableHead className="min-w-[130px] font-semibold">EB Number</TableHead>
                <TableHead className="min-w-[280px] font-semibold">Address</TableHead>
                <TableHead className="min-w-[180px] font-semibold">Contact Numbers</TableHead>
                <TableHead className="min-w-[200px] font-semibold">Diagnosis</TableHead>
                <TableHead className="min-w-[220px] font-semibold">Surgical Plan</TableHead>
                <TableHead className="min-w-[130px] font-semibold">Surgery Date</TableHead>
                <TableHead className="min-w-[180px] font-semibold">Surgeon Name</TableHead>
                <TableHead className="min-w-[250px] font-semibold">Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((patient, index) => (
                <TableRow key={index} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell className="font-medium">{patient.patient_name || '-'}</TableCell>
                  <TableCell>{patient.age || '-'}</TableCell>
                  <TableCell>{patient.sex || '-'}</TableCell>
                  <TableCell>{patient.eb_number || '-'}</TableCell>
                  <TableCell className="max-w-[280px]">
                    <div className="whitespace-normal" title={patient.address}>
                      {patient.address || '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    {patient.contact_numbers && patient.contact_numbers.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {patient.contact_numbers.map((num, i) => (
                          <span key={i} className="text-sm whitespace-nowrap">{num}</span>
                        ))}
                      </div>
                    ) : ('-')}
                  </TableCell>
                  <TableCell>
                    {patient.diagnosis ? (
                      <div className="flex flex-col gap-1">
                        {patient.diagnosis_eye && (
                          <span className="text-xs font-bold text-primary">{patient.diagnosis_eye}:</span>
                        )}
                        <span className="text-sm whitespace-normal">{patient.diagnosis}</span>
                        {patient.diagnosis_left && patient.diagnosis_eye_left && (
                          <>
                            <span className="text-xs font-bold text-primary mt-1">{patient.diagnosis_eye_left}:</span>
                            <span className="text-sm whitespace-normal">{patient.diagnosis_left}</span>
                          </>
                        )}
                      </div>
                    ) : ('-')}
                  </TableCell>
                  <TableCell>
                    {patient.surgical_plan ? (
                      <div className="flex flex-col gap-1">
                        {patient.surgery_eye && (
                          <span className="text-xs font-bold text-primary">{patient.surgery_eye}:</span>
                        )}
                        <span className="text-sm font-medium whitespace-normal">{patient.surgical_plan}</span>
                        {patient.surgery_custom && (
                          <span className="text-xs text-muted-foreground whitespace-normal">({patient.surgery_custom})</span>
                        )}
                        {patient.iol_option && (
                          <span className="text-xs bg-blue-100 dark:bg-blue-900 px-2 py-0.5 rounded w-fit">
                            {patient.iol_option}
                          </span>
                        )}
                      </div>
                    ) : ('-')}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{patient.surgery_date || '-'}</TableCell>
                  <TableCell>{patient.surgeon_name || '-'}</TableCell>
                  <TableCell className="max-w-[250px]">
                    <div className="whitespace-normal" title={patient.remarks}>
                      {patient.remarks || '-'}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
