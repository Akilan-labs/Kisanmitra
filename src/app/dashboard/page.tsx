
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Sparkles, ShieldCheck, CloudSun, Leaf, Info, ShieldAlert, LineChart, Droplets, Calendar as CalendarIcon, TestTube2, Replace } from 'lucide-react';
import Image from 'next/image';

import { getFarmInsightsAction, getCropRecommendationsAction } from '@/app/actions';
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
import { format } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import { GetCropRecommendationsOutput } from '@/ai/schemas/crop-recommendations';
import { Label } from '@/components/ui/label';

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

const getPriorityStyles = (priority: 'Low' | 'Medium' | 'High'): { variant: "default" | "secondary" | "destructive", className: string } => {
    switch (priority) {
        case 'High':
            return { variant: 'destructive', className: 'border-destructive/50' };
        case 'Medium':
            return { variant: 'secondary', className: 'border-yellow-500/50' };
        case 'Low':
        default:
            return { variant: 'default', className: 'border-primary/20' };
    }
}

const categoryIconMap: Record<GetFarmInsightsOutput['insights'][0]['category'], React.ReactNode> = {
    Weather: <CloudSun className="h-5 w-5" />,
    Disease: <ShieldAlert className="h-5 w-5" />,
    Irrigation: <Droplets className="h-5 w-5" />,
    Market: <LineChart className="h-5 w-5" />,
    Fertilizer: <TestTube2 className="h-5 w-5" />,
    General: <Info className="h-5 w-5" />,
}

export default function FarmDashboardPage() {
  const { language } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [isAdvisorLoading, setIsAdvisorLoading] = useState(false);
  const [farmData, setFarmData] = useState<FormValues | null>(null);
  const [insightsResult, setInsightsResult] = useState<GetFarmInsightsOutput | null>(null);
  const [recommendationsResult, setRecommendationsResult] = useState<GetCropRecommendationsOutput | null>(null);
  const [alternativeCrops, setAlternativeCrops] = useState('');
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
    setRecommendationsResult(null);
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

  async function onGetRecommendations() {
    if (!farmData) return;
     const candidateCrops = alternativeCrops.split(',').map(s => s.trim()).filter(Boolean);
    if (candidateCrops.length === 0) {
      toast({
        title: 'No Alternative Crops',
        description: 'Please enter at least one alternative crop to analyze.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsAdvisorLoading(true);
    setRecommendationsResult(null);
    try {
      const response = await getCropRecommendationsAction({
        currentCrop: farmData.crop,
        region: farmData.region,
        soilReport: farmData.soilReport,
        history: farmData.history,
        language,
        candidateCrops: candidateCrops,
      });
       if (response.success) {
        setRecommendationsResult(response.data);
      } else {
        toast({
          title: 'Failed to get recommendations',
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
        setIsAdvisorLoading(false);
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
                          <FormLabel>Soil Report Data (Optional)</FormLabel>
                          <FormControl>
                            <Textarea placeholder="e.g., pH: 6.5, N: 120kg/ha, P: 50kg/ha, K: 80kg/ha" {...field} />
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
                          <FormLabel>Past Crop & Treatment History (Optional)</FormLabel>
                          <FormControl>
                            <Textarea placeholder="e.g., Last year: Maize, yield 2.5t/acre. Applied fungicide in July." {...field} />
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

          <Card>
              <CardHeader>
                  <CardTitle>AI Crop Switching Advisor</CardTitle>
                  <CardDescription>Get AI-powered recommendations for alternative crops. Fill out the form above, then enter the crops you want to compare below.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="space-y-2">
                    <Label htmlFor="alternative-crops">Crops to Consider</Label>
                    <Input
                        id="alternative-crops"
                        placeholder="e.g., Chili, Soybean, Marigold"
                        value={alternativeCrops}
                        onChange={(e) => setAlternativeCrops(e.target.value)}
                        disabled={!farmData}
                    />
                    <p className="text-sm text-muted-foreground">Enter a comma-separated list of crops you want to evaluate.</p>
                 </div>
                  <Button onClick={onGetRecommendations} disabled={isAdvisorLoading || !farmData}>
                    {isAdvisorLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Replace className="mr-2 h-4 w-4" />}
                    {isAdvisorLoading ? 'Analyzing Alternatives...' : 'Find Alternative Crops'}
                  </Button>
                  {isAdvisorLoading && <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/></div>}
                  {recommendationsResult && (
                  <div className="mt-6 space-y-4">
                    {recommendationsResult.recommendations.map((rec, index) => (
                        <Card key={index} className="border-l-4 border-primary">
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-xl">#{index + 1}: {rec.cropName}</CardTitle>
                                <CardDescription>{rec.suitability.split('.')[0]}.</CardDescription>
                              </div>
                              <Badge variant="secondary">{rec.profitabilityScore}</Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div>
                              <h4 className="font-semibold">Profitability & Risk Analysis</h4>
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{rec.profitabilityAnalysis}</p>
                            </div>
                              <div>
                              <h4 className="font-semibold">Suitability Analysis</h4>
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{rec.suitability}</p>
                            </div>
                              <div>
                              <h4 className="font-semibold">Actionable Advice</h4>
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{rec.actionableAdvice}</p>
                            </div>
                          </CardContent>
                        </Card>
                    ))}
                  </div>
                  )}
              </CardContent>
          </Card>


          {isLoading && (
            <div className="flex h-64 items-center justify-center text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}

          {insightsResult ? (
              <Card>
                  <CardHeader>
                      <CardTitle>{t('weekly_insights_title')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                      {insightsResult.insights.length > 0 ? insightsResult.insights.map((insight, index) => {
                      const priorityStyles = getPriorityStyles(insight.priority);
                      return (
                          <Card key={index} className={cn("flex items-start gap-4 p-4 border-l-4", priorityStyles.className)}>
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                                  {categoryIconMap[insight.category]}
                              </div>
                              <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                      <h3 className="font-semibold font-headline text-lg">{insight.title}</h3>
                                      <Badge variant={priorityStyles.variant}>{insight.priority}</Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{insight.recommendation}</p>
                                  <p className="text-xs text-muted-foreground/80 mt-2">Source: {insight.source}</p>
                              </div>
                          </Card>
                      )
                      }) : (
                          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-16 text-center text-muted-foreground">
                          <ShieldCheck className="h-12 w-12 text-green-500"/>
                          <h3 className="mt-4 text-lg font-semibold">All Clear!</h3>
                          <p className="mt-1 text-sm">No critical alerts for your farm this week. Keep up the great work!</p>
                          </div>
                      )}
                  </CardContent>
              </Card>
          ) : (
            !isLoading && !farmData && (
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-24 text-center text-muted-foreground">
                  <h2 className="mt-6 text-xl font-semibold font-headline">{t('insights_placeholder_title')}</h2>
                  <p className="mt-2 max-w-sm">{t('insights_placeholder_text')}</p>
                </div>
              )
          )}
        </div>
      </main>
    </div>
  );
}
