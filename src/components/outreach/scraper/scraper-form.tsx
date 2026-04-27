'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Loader2, Search, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { scraperSchema, type ScraperFormValues } from '@/lib/validations';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export function ScraperForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ScraperFormValues>({
    resolver: zodResolver(scraperSchema),
    defaultValues: {
      niches: '',
      location: '',
      max_results: 100,
      target_sheet: 'Hair Transplant Leads',
    },
  });

  const startScraper = useMutation({
    mutationFn: async (data: ScraperFormValues) => {
      const response = await axios.post('/api/scraper', data);
      return response.data;
    },
    onSuccess: (data) => {
      toast({
        title: 'Scraper completed!',
        description: `Found ${data.n8nResponse?.results?.valid_emails || 0} valid leads`,
      });
      queryClient.invalidateQueries({ queryKey: ['scraper-jobs'] });
      form.reset();
    },
    onError: (error: unknown) => {
      const message =
        axios.isAxiosError(error) ? error.response?.data?.error : 'Scraper failed';
      toast({
        title: 'Scraper failed',
        description: message,
        variant: 'destructive',
      });
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((d) => startScraper.mutate(d))} className="space-y-10">
        <div className="space-y-5">
          <div className="border-b border-gray-100 pb-4 mb-2">
            <h3 className="text-base font-black text-gray-900 tracking-tight uppercase mb-1">Search Configuration</h3>
            <p className="text-gray-500 text-sm">
              Configure what to search on Google Maps via Apify
            </p>
          </div>

          <div className="space-y-5">
            <FormField
              control={form.control}
              name="niches"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-xs font-bold text-gray-700 uppercase tracking-widest">Business Niches</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. hair clinic, beauty salon, cosmetic surgery"
                      className="h-14 px-4 bg-gray-50 border-gray-100 focus:bg-white transition-all text-base"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-gray-400">
                    Comma-separated list of business types to search on Google Maps
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-xs font-bold text-gray-700 uppercase tracking-widest">Location</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g. London, UK" 
                        className="h-14 px-4 bg-gray-50 border-gray-100 focus:bg-white transition-all text-base"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="max_results"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-xs font-bold text-gray-700 uppercase tracking-widest">Max Results</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={1000}
                        className="h-14 px-4 bg-gray-50 border-gray-100 focus:bg-white transition-all text-base"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription className="text-xs text-gray-400">Max 1000 results</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="target_sheet"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-xs font-bold text-gray-700 uppercase tracking-widest">Save to Sheet</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-14 px-4 bg-gray-50 border-gray-100 focus:bg-white transition-all text-base">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Hair Transplant Leads">Hair Transplant Leads</SelectItem>
                      <SelectItem value="Dental Treatment Leads">Dental Treatment Leads</SelectItem>
                      <SelectItem value="Cosmetic Surgery Leads">Cosmetic Surgery Leads</SelectItem>
                      <SelectItem value="IVF Fertility Leads">IVF Fertility Leads</SelectItem>
                      <SelectItem value="Eye Treatment Leads">Eye Treatment Leads</SelectItem>
                      <SelectItem value="All Services Leads">All Services Leads</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-xs text-gray-400">Target Google Sheet</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="rounded-[24px] bg-indigo-50/50 border border-indigo-100 p-8 flex items-start gap-4">
          <Activity className="w-6 h-6 text-indigo-600 mt-1 flex-shrink-0" />
          <p className="text-base text-indigo-900 leading-relaxed">
            <span className="font-black uppercase tracking-wider block mb-1">Processing Note</span>
            Scraping can take <span className="font-bold">2-5 minutes</span> depending on results count.
            The results table will update automatically when the process is complete.
          </p>
        </div>

        <Button
          type="submit"
          className="w-full bg-[#0077b6] hover:bg-[#005f8f] text-white"
          size="lg"
          disabled={startScraper.isPending}
        >
          {startScraper.isPending ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Search className="mr-2 h-5 w-5" />
          )}
          {startScraper.isPending ? 'Scraping Google Maps...' : 'Start Lead Scraper'}
        </Button>
      </form>
    </Form>
  );
}
