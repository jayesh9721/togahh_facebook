'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Loader2, Send } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { campaignSchema, type CampaignFormValues } from '@/lib/validations';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export function CampaignForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      campaign_name: '',
      service_type: 'Hair_Transplant',
      target_region: 'Europe',
      campaign_goal: 'Book a free consultation',
      campaign_message: '',
      cta_button_text: 'Book Free Analysis',
      cta_link: 'https://www.togahh.com/en/contact',
      tone: 'Warm and educational',
      selected_sheet: 'Hair Transplant Leads',
    },
  });

  const createCampaign = useMutation({
    mutationFn: async (data: CampaignFormValues) => {
      const response = await axios.post('/api/campaigns', data);
      return response.data;
    },
    onSuccess: (data) => {
      toast({
        title: 'Campaign launched successfully!',
        description: `${data.n8nResponse?.results?.successful_sends || 0} emails sent to Instantly.ai`,
      });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      form.reset();
    },
    onError: (error: unknown) => {
      const message =
        axios.isAxiosError(error) ? error.response?.data?.error : 'Something went wrong';
      toast({
        title: 'Failed to create campaign',
        description: message,
        variant: 'destructive',
      });
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((d) => createCampaign.mutate(d))} className="space-y-10">
        {/* Basic Info */}
        <div className="space-y-5">
          <div className="border-b border-gray-100 pb-4 mb-2">
            <h3 className="text-base font-black text-gray-900 tracking-tight uppercase mb-1">Campaign Details</h3>
            <p className="text-gray-500 text-sm">Basic information about your campaign</p>
          </div>

          <div className="space-y-5">
            <FormField
              control={form.control}
              name="campaign_name"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-xs font-bold text-gray-700 uppercase tracking-widest">Campaign Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. April Hair Transplant Awareness" 
                      className="h-14 px-4 bg-gray-50 border-gray-100 focus:bg-white transition-all text-base"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="service_type"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-xs font-bold text-gray-700 uppercase tracking-widest">Service Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-14 px-4 bg-gray-50 border-gray-100 focus:bg-white transition-all text-base">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Hair_Transplant">Hair Transplant</SelectItem>
                        <SelectItem value="Dental_Treatment">Dental Treatment</SelectItem>
                        <SelectItem value="Cosmetic_Surgery">Cosmetic Surgery</SelectItem>
                        <SelectItem value="Eye_Treatment">Eye Treatment</SelectItem>
                        <SelectItem value="IVF_Fertility">IVF Fertility</SelectItem>
                        <SelectItem value="Thermal_Wellness">Thermal Wellness</SelectItem>
                        <SelectItem value="All_Services">All Services</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="target_region"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-xs font-bold text-gray-700 uppercase tracking-widest">Target Region</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-14 px-4 bg-gray-50 border-gray-100 focus:bg-white transition-all text-base">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Europe">Europe</SelectItem>
                        <SelectItem value="Middle East">Middle East</SelectItem>
                        <SelectItem value="Asia">Asia</SelectItem>
                        <SelectItem value="North America">North America</SelectItem>
                        <SelectItem value="Global">Global</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="selected_sheet"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-xs font-bold text-gray-700 uppercase tracking-widest">Lead Sheet (Google Sheets)</FormLabel>
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
                  <FormDescription className="text-xs text-gray-400 font-medium">Which Google Sheet to pull leads from</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Email Content */}
        <div className="space-y-5">
          <div className="border-b border-gray-100 pb-4 mb-2">
            <h3 className="text-base font-black text-gray-900 tracking-tight uppercase mb-1">Email Content</h3>
            <p className="text-gray-500 text-sm">AI will generate the email based on your inputs</p>
          </div>

          <div className="space-y-5">
            <FormField
              control={form.control}
              name="campaign_message"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-xs font-bold text-gray-700 uppercase tracking-widest">Campaign Message / Brief</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what you want to communicate. The AI will craft a professional email from this..."
                      rows={6}
                      className="px-4 py-3 bg-gray-50 border-gray-100 focus:bg-white transition-all text-base min-h-[150px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-gray-400">Min 10 characters. Be specific about your offer.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="campaign_goal"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-xs font-bold text-gray-700 uppercase tracking-widest">Campaign Goal</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g. Book a free consultation" 
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
                name="tone"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-xs font-bold text-gray-700 uppercase tracking-widest">Email Tone</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-14 px-4 bg-gray-50 border-gray-100 focus:bg-white transition-all text-base">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Warm and educational">Warm and educational</SelectItem>
                        <SelectItem value="Professional and clinical">Professional and clinical</SelectItem>
                        <SelectItem value="Friendly and encouraging">Friendly and encouraging</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="space-y-5">
          <div className="border-b border-gray-100 pb-4 mb-2">
            <h3 className="text-base font-black text-gray-900 tracking-tight uppercase">Call to Action</h3>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="cta_button_text"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-xs font-bold text-gray-700 uppercase tracking-widest">Button Text</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Book Free Analysis" 
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
              name="cta_link"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-xs font-bold text-gray-700 uppercase tracking-widest">Button Link</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://www.togahh.com/en/contact" 
                      className="h-14 px-4 bg-gray-50 border-gray-100 focus:bg-white transition-all text-base"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full bg-[#0077b6] hover:bg-[#005f8f] text-white"
          size="lg"
          disabled={createCampaign.isPending}
        >
          {createCampaign.isPending ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Send className="mr-2 h-5 w-5" />
          )}
          {createCampaign.isPending ? 'Launching Campaign...' : 'Launch Campaign'}
        </Button>
      </form>
    </Form>
  );
}
