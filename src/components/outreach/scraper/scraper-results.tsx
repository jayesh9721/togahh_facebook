'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';
import { Search, Mail, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDuration } from '@/lib/utils';
import type { ScraperJob } from '@/types';

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, 'success' | 'destructive' | 'secondary' | 'warning'> = {
    SUCCESS: 'success',
    FAILED: 'destructive',
    RUNNING: 'secondary',
    PENDING: 'warning',
  };
  return <Badge variant={map[status] || 'secondary'}>{status}</Badge>;
}

export function ScraperResults() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['scraper-jobs'],
    queryFn: async () => {
      const res = await axios.get<{ jobs: ScraperJob[] }>('/api/scraper/jobs');
      return res.data.jobs;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-600 py-8 justify-center">
        <AlertCircle className="h-5 w-5" />
        Failed to load scraper history
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <Search className="h-12 w-12 mb-3 opacity-30" />
        <p className="text-lg font-medium">No scraper jobs yet</p>
        <p className="text-sm">Run a scraper to find leads from Google Maps</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <Table className="min-w-[1000px]">
        <TableHeader className="bg-gray-50/50">
          <TableRow className="hover:bg-transparent border-gray-100">
            <TableHead className="font-bold text-gray-900 uppercase tracking-wider h-14 min-w-[180px]">Niches</TableHead>
            <TableHead className="font-bold text-gray-900 uppercase tracking-wider h-14 min-w-[120px]">Location</TableHead>
            <TableHead className="font-bold text-gray-900 uppercase tracking-wider h-14 min-w-[150px]">Target Sheet</TableHead>
            <TableHead className="font-bold text-gray-900 uppercase tracking-wider h-14 w-[80px]">Total</TableHead>
            <TableHead className="font-bold text-green-600 uppercase tracking-wider h-14 w-[80px]">Valid</TableHead>
            <TableHead className="font-bold text-red-500 uppercase tracking-wider h-14 w-[80px]">Invalid</TableHead>
            <TableHead className="font-bold text-gray-900 uppercase tracking-wider h-14 min-w-[100px]">Status</TableHead>
            <TableHead className="font-bold text-gray-900 uppercase tracking-wider h-14 min-w-[100px]">Duration</TableHead>
            <TableHead className="font-bold text-gray-900 uppercase tracking-wider h-14 text-right min-w-[100px]">Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((job) => (
            <TableRow key={job.id} className="border-gray-50 hover:bg-gray-50/50 transition-colors">
              <TableCell className="py-5 font-medium text-sm max-w-[180px] truncate">
                {Array.isArray(job.niches) ? job.niches.join(', ') : job.niches}
              </TableCell>
              <TableCell className="py-5 text-sm">{job.location}</TableCell>
              <TableCell className="py-5 text-sm text-gray-500">{job.targetSheet}</TableCell>
              <TableCell className="py-5 font-bold text-gray-900">{job.totalScraped}</TableCell>
              <TableCell className="py-5 text-green-600 font-bold">{job.validEmails}</TableCell>
              <TableCell className="py-5 text-red-500 font-medium">{job.invalidEmails}</TableCell>
              <TableCell className="py-5">
                <StatusBadge status={job.execution.status} />
              </TableCell>
              <TableCell className="py-5 text-sm text-gray-400">
                {formatDuration(job.execution.duration)}
              </TableCell>
              <TableCell className="py-5 text-sm text-gray-400 text-right">
                {format(new Date(job.createdAt), 'MMM dd')}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
