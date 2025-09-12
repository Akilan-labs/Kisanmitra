
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Sparkles, ShieldCheck, CloudSun, Leaf, Info, ShieldAlert, LineChart, Droplets, Calendar as CalendarIcon, TestTube2, AlertCircle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

import { getFarmInsightsAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/page-header';
import { LanguageSwitcher } from '@/components/language-switcher';
import type { GetFarmInsightsOutput } from '@/ai/schemas/farm-insights';
import { useTranslation } from '@/hooks/use-translation';
import { useLanguage } from '@/hooks/use-language';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';

const formSchema = z.object({
  crop: z.string().min(2, 'Please enter a crop name.'),
  region: z.string().min(2, 'Please enter a region.'),
  plantingDate: z.date({
    required_error: "A planting date is required.",
  }),
  soilReport: z.string().optional(),
  history: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const getPriorityStyles = (priority: 'Low' | 'Medium' | 'High'): { variant: "default" | "secondary" | "destructive", className: string, icon: React.ReactNode } => {
    switch (priority) {
        case 'High':
            return { variant: 'destructive', className: 'border-destructive/80', icon: <AlertCircle className="h-5 w-5" /> };
        case 'Medium':
            return { variant: 'secondary', className: 'border-yellow-500/80', icon: <AlertCircle className="h-5 w-5" /> };
        case 'Low':
        default:
            return { variant: 'default', className: 'border-primary/50', icon: <CheckCircle className="h-5 w-5" /> };
    }
}

const categoryIconMap: Record<GetFarmInsightsOutput['insights'][0]['category'], React.ReactNode> = {
    Weather: <CloudSun className="h-6 w-6" />,
    Disease: <ShieldAlert className="h-6 w-6" />,
    Irrigation: <Droplets className="h-6 w-6" />,
    Market: <LineChart className="h-6 w-6" />,
    Fertilizer: <TestTube2 className="h-6 w-6" />,
    General: <Info className="h-6 w-6" />,
}

export default function FarmDashboardPage() {
  const { language } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [farmData, setFarmData] = useState<FormValues | null>(null);
  const [insightsResult, setInsightsResult] = useState<GetFarmInsightsOutput | null>(null);

  const { toast } = useToast();
  const { t } = useTranslation(language);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      crop: '',
      region: '',
      soilReport: '',
      history: '',
    },
  });

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    setInsightsResult(null);
    setFarmData(values);
    try {
      const response = await getFarmInsightsAction({ 
        ...values,
        plantingDate: format(values.plantingDate, 'yyyy-MM-dd'),
        language 
      });
      if (response.success) {
        setInsightsResult(response.data);
      } else {
        toast({
          title: 'Failed to get insights',
          description: response.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: t('error'),
        description: t('unexpected_error'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader title={t('dashboard_title')}>
        <LanguageSwitcher />
      </PageHeader>
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          <Card>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardHeader>
                  <CardTitle>{t('farm_dashboard_title')}</CardTitle>
                  <CardDescription>
                    {t('farm_dashboard_description')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="crop"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('crop_name_label')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('crop_name_placeholder_yield')} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="region"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('region_label')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('region_placeholder')} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="plantingDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col sm:col-span-2">
                          <FormLabel>{t('planting_date_label')}</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>{t('planting_date_placeholder')}</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date > new Date() || date < new Date("1900-01-01")
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                   <FormField
                      control={form.control}
                      name="soilReport"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('soil_report_label')}</FormLabel>
                          <FormControl>
                            <Textarea placeholder={t('soil_report_placeholder')} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="history"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('history_label')}</FormLabel>
                          <FormControl>
                            <Textarea placeholder={t('history_placeholder')} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    {isLoading ? t('getting_insights_button') : t('get_insights_button')}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>

          {isLoading && (
            <div className="flex h-64 items-center justify-center text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}

          {insightsResult && (
            <Card>
                <CardHeader>
                    <CardTitle>{t('weekly_insights_title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {insightsResult.insights.length > 0 ? insightsResult.insights.map((insight, index) => {
                    const { variant, className, icon } = getPriorityStyles(insight.priority);
                    const recommendationParts = insight.recommendation.split('Why:');
                    const action = recommendationParts[0].replace('Recommendation:', '').trim();
                    const reason = recommendationParts[1]?.trim() ?? '';
                    
                    return (
                        <Card key={index} className={cn("border-l-4", className)}>
                          <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                               <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                  {categoryIconMap[insight.category]}
                               </div>
                               <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                      <CardTitle className="text-lg">{insight.title}</CardTitle>
                                      <Badge variant={variant}>{insight.priority}</Badge>
                                  </div>
                                  <CardDescription>Source: {insight.source}</CardDescription>
                               </div>
                          </CardHeader>
                          <CardContent>
                              <div className="space-y-2">
                                <h4 className="font-semibold flex items-center gap-2">{icon} Action</h4>
                                <p className="text-foreground/90 ml-7">{action}</p>
                              </div>
                              {reason && (
                                <div className="space-y-2 mt-3">
                                  <h4 className="font-semibold flex items-center gap-2"><Info className="h-5 w-5" /> Reason</h4>
                                  <p className="text-muted-foreground ml-7">{reason}</p>
                                </div>
                              )}
                          </CardContent>
                        </Card>
                    )
                    }) : (
                        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-16 text-center text-muted-foreground">
                        <ShieldCheck className="h-12 w-12 text-green-500"/>
                        <h3 className="mt-4 text-lg font-semibold">{t('no_critical_alerts_title')}</h3>
                        <p className="mt-1 text-sm">{t('no_critical_alerts_description')}</p>
                        </div>
                    )}
                </CardContent>
            </Card>
          )}

          {!isLoading && !farmData && (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-24 text-center text-muted-foreground">
              <Leaf className="h-12 w-12" />
              <h2 className="mt-6 text-xl font-semibold font-headline">{t('insights_placeholder_title')}</h2>
              <p className="mt-2 max-w-sm">{t('insights_placeholder_text')}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );

}

