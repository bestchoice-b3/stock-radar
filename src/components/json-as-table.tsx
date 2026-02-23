"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "./ui/badge";

type JsonAsTableProps = {
  data: object | any[] | null;
};

const renderValue = (value: any): React.ReactNode => {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground italic">N/A</span>;
  }
  if (typeof value === 'boolean') {
    return <Badge variant={value ? "default" : "destructive"} className={value ? "bg-[hsl(var(--chart-2))]" : ""}>{String(value)}</Badge>;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    if (typeof value === 'string' && (value.startsWith('http') || value.startsWith('https'))) {
        return <a href={value} target="_blank" rel="noopener noreferrer" className="text-accent underline hover:text-accent/80 break-all">{value}</a>
    }
    return String(value);
  }
  if (typeof value === 'object') {
    return <JsonAsTable data={value} />;
  }
  return String(value);
};


export default function JsonAsTable({ data }: JsonAsTableProps) {
  if (data === null || typeof data !== 'object') {
    return <div className="p-4 text-center text-muted-foreground">{data ? String(data) : 'Nenhum dado para exibir.'}</div>;
  }

  const isArrayOfObjects = Array.isArray(data) && data.length > 0 && data.every(item => typeof item === 'object' && item !== null && !Array.isArray(item));

  if (isArrayOfObjects) {
    const headers = Array.from(new Set(data.flatMap(item => Object.keys(item))));
    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((header) => (
                <TableHead key={header} className="whitespace-nowrap">{header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {headers.map((header) => (
                  <TableCell key={header}>{renderValue(row[header])}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }
  
  const isSimpleArray = Array.isArray(data) && !isArrayOfObjects;

  if (isSimpleArray) {
      return (
          <div className="flex flex-wrap gap-2 p-2">
              {data.map((item, index) => (
                  <Badge key={index} variant="outline">{renderValue(item)}</Badge>
              ))}
          </div>
      )
  }

  return (
    <div className="overflow-x-auto">
      <Table className="table-fixed">
        <TableBody>
          {Object.entries(data).map(([key, value]) => (
            <TableRow key={key}>
              <TableCell className="font-medium w-1/4 break-words align-top">{key}</TableCell>
              <TableCell className="w-3/4">{renderValue(value)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
