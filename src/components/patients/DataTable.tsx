import { ExtractedPatientData } from '@/types/patient';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';

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
    <div className="border rounded-lg">
      <ScrollArea className="h-[600px] w-full">
        <div className="overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead className="min-w-[50px]">S.No</TableHead>
                <TableHead className="min-w-[180px]">Patient Name</TableHead>
                <TableHead className="min-w-[80px]">Age</TableHead>
                <TableHead className="min-w-[80px]">Sex</TableHead>
                <TableHead className="min-w-[120px]">EB Number</TableHead>
                <TableHead className="min-w-[250px]">Address</TableHead>
                <TableHead className="min-w-[200px]">Contact Numbers</TableHead>
                <TableHead className="min-w-[150px]">Diagnosis</TableHead>
                <TableHead className="min-w-[200px]">Surgical Plan</TableHead>
                <TableHead className="min-w-[120px]">Date of Surgery</TableHead>
                <TableHead className="min-w-[150px]">Surgeon Name</TableHead>
                <TableHead className="min-w-[200px]">Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((patient, index) => (
                <TableRow key={index}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="font-medium">{patient.patient_name || '-'}</TableCell>
                  <TableCell>{patient.age || '-'}</TableCell>
                  <TableCell>{patient.sex || '-'}</TableCell>
                  <TableCell>{patient.eb_number || '-'}</TableCell>
                  <TableCell className="max-w-[250px]">
                    <div className="truncate" title={patient.address}>
                      {patient.address || '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    {patient.contact_numbers && patient.contact_numbers.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {patient.contact_numbers.map((num, i) => (
                          <span key={i} className="text-sm">{num}</span>
                        ))}
                      </div>
                    ) : ('-')}
                  </TableCell>
                  <TableCell>
                    {patient.diagnosis ? (
                      <div className="flex flex-col gap-1">
                        {patient.diagnosis_eye && (
                          <span className="text-xs font-semibold">{patient.diagnosis_eye}</span>
                        )}
                        <span className="text-sm">{patient.diagnosis}</span>
                        {patient.diagnosis_left && patient.diagnosis_eye_left && (
                          <>
                            <span className="text-xs font-semibold mt-1">{patient.diagnosis_eye_left}</span>
                            <span className="text-sm">{patient.diagnosis_left}</span>
                          </>
                        )}
                      </div>
                    ) : ('-')}
                  </TableCell>
                  <TableCell>
                    {patient.surgery_type ? (
                      <div className="flex flex-col gap-1">
                        {patient.surgery_eye && (
                          <span className="text-xs font-semibold">{patient.surgery_eye}</span>
                        )}
                        <span className="text-sm">{patient.surgery_type}</span>
                        {patient.surgery_custom && (
                          <span className="text-xs text-muted-foreground">({patient.surgery_custom})</span>
                        )}
                        {patient.iol_option && (
                          <span className="text-xs">IOL: {patient.iol_option}</span>
                        )}
                      </div>
                    ) : ('-')}
                  </TableCell>
                  <TableCell>{patient.surgery_date || '-'}</TableCell>
                  <TableCell>{patient.surgeon_name || '-'}</TableCell>
                  <TableCell className="max-w-[200px]">
                    <div className="truncate" title={patient.remarks}>
                      {patient.remarks || '-'}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ScrollArea>
    </div>
  );
}
