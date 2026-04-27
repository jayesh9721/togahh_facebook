'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';
import { Mail, TrendingUp, Users, AlertCircle, Loader2 } from 'lucide-react';
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
import { formatServiceType, formatDuration } from '@/lib/utils';
import type { Campaign } from '@/types';

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, 'success' | 'destructive' | 'secondary' | 'warning'> = {
    SUCCESS: 'success',
    FAILED: 'destructive',
    RUNNING: 'secondary',
    PENDING: 'warning',
    CANCELLED: 'secondary',
  };
  return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
}

export function CampaignList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const res = await axios.get<{ campaigns: Campaign[] }>('/api/campaigns');
      return res.data.campaigns;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-600 py-8 justify-center">
        <AlertCircle className="h-5 w-5" />
        <span>Failed to load campaigns</span>
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <Mail className="h-12 w-12 mb-3 opacity-30" />
        <p className="text-lg font-medium">No campaigns yet</p>
        <p className="text-sm">Create your first campaign to get started</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <Table className="min-w-[1000px]">
        <TableHeader className="bg-gray-50/50">
          <TableRow className="hover:bg-transparent border-gray-100">
            <TableHead className="font-bold text-gray-900 uppercase tracking-wider h-14 min-w-[200px]">Campaign</TableHead>
            <TableHead className="font-bold text-gray-900 uppercase tracking-wider h-14 min-w-[150px]">Service</TableHead>
            <TableHead className="font-bold text-gray-900 uppercase tracking-wider h-14 min-w-[120px]">Region</TableHead>
            <TableHead className="font-bold text-gray-900 uppercase tracking-wider h-14 w-[80px]">Sent</TableHead>
            <TableHead className="font-bold text-green-600 uppercase tracking-wider h-14 w-[100px]">Success</TableHead>
            <TableHead className="font-bold text-gray-900 uppercase tracking-wider h-14 min-w-[120px]">Status</TableHead>
            <TableHead className="font-bold text-gray-900 uppercase tracking-wider h-14 min-w-[100px]">Duration</TableHead>
            <TableHead className="font-bold text-gray-900 uppercase tracking-wider h-14 text-right min-w-[100px]">Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((campaign) => (
            <TableRow key={campaign.id} className="border-gray-50 hover:bg-gray-50/50 transition-colors">
              <TableCell className="py-5 font-bold text-gray-900">{campaign.campaignName}</TableCell>
              <TableCell className="py-5 text-sm text-gray-600">
                {formatServiceType(campaign.serviceType)}
              </TableCell>
              <TableCell className="py-5 text-sm">{campaign.targetRegion}</TableCell>
              <TableCell className="py-5 text-sm font-bold text-gray-900">{campaign.totalLeadsSent}</TableCell>
              <TableCell className="py-5">
                <span className="text-green-600 font-black">{campaign.successfulSends}</span>
                {campaign.failedSends > 0 && (
                  <span className="text-red-500 text-xs ml-1 font-medium">(-{campaign.failedSends})</span>
                )}
              </TableCell>
              <TableCell className="py-5">
                <StatusBadge status={campaign.execution.status} />
              </TableCell>
              <TableCell className="py-5 text-sm text-gray-400">
                {formatDuration(campaign.execution.duration)}
              </TableCell>
              <TableCell className="py-5 text-sm text-gray-400 text-right">
                {format(new Date(campaign.createdAt), 'MMM dd')}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
