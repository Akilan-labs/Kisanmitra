
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Sparkles, Replace, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

import { getCropRecommendationsAction } from '@/app/actions';
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
import { useTranslation } from '@/hooks/use-translation';
import { useLanguage } from '@/hooks/use-language';
import { Textarea } from '@/components/ui/textarea';
import { GetCropRecommendationsOutput } from '@/ai/schemas/crop-recommendations';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

const formSchema = z.object({
  currentCrop: z.string().min(2, 'Please enter a crop name.'),
  region: z.string().min(2, 'Please enter a region.'),
  soilReport: z.string().optional(),
  history: z.string().optional(),
  candidateCrops: z.string().min(1, 'Please provide at least one candidate crop.'),
});

type FormValues = z.infer<typeof formSchema>;

export default function CropSwitchingAdvisorPage() {
  const { language } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [recommendationsResult, setRecommendationsResult] = useState<GetCropRecommendationsOutput | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation(language);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currentCrop: '',
      region: '',
      soilReport: '',
      history: '',
      candidateCrops: '',
    },
  });

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    setRecommendationsResult(null);

    const candidateCrops = values.candidateCrops.split(',').map(s => s.trim()).filter(Boolean);
    if (candidateCrops.length === 0) {
      toast({
        title: 'No Alternative Crops',
        description: 'Please enter at least one alternative crop to analyze.',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    try {
      const response = await getCropRecommendationsAction({
        ...values,
        language,
        candidateCrops,
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
        setIsLoading(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader title={t('crop_advisor_title')}>
        <LanguageSwitcher />
      </PageHeader>
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          <Card>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardHeader>
                  <CardTitle>{t('crop_advisor_card_title')}</CardTitle>
                  <CardDescription>
                    {t('crop_advisor_card_description')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="currentCrop"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('current_crop_label')}</FormLabel>
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
                   <FormField
                      control={form.control}
                      name="candidateCrops"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('candidate_crops_label')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('candidate_crops_placeholder')} {...field} />
                          </FormControl>
                           <p className="text-sm text-muted-foreground">{t('candidate_crops_description')}</p>
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
                      <Replace className="mr-2 h-4 w-4" />
                    )}
                    {isLoading ? t('analyzing_button') : t('get_recommendations_button')}
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

          {recommendationsResult && (
            <Card>
                <CardHeader>
                    <CardTitle>{t('recommendation_results_title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recommendationsResult.recommendations.map((rec, index) => (
                      <Card key={index} className="border-l-4 border-primary">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-xl">#{index + 1}: {rec.cropName}</CardTitle>
                              <CardDescription>{rec.suitability.split('.')[0]}.</CardDescription>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <Badge variant="secondary">{rec.profitabilityScore}</Badge>
                              <Badge variant={rec.riskScore.includes('Low') ? 'default' : rec.riskScore.includes('Medium') ? 'secondary' : 'destructive'}>{rec.riskScore}</Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <h4 className="font-semibold">{t('profitability_risk_analysis_label')}</h4>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{rec.profitabilityAnalysis}</p>
                          </div>
                            <div>
                            <h4 className="font-semibold">{t('suitability_analysis_label')}</h4>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{rec.suitability}</p>
                          </div>
                            <div>
                            <h4 className="font-semibold">{t('actionable_advice_label')}</h4>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{rec.actionableAdvice}</p>
                          </div>
                        </CardContent>
                      </Card>
                  ))}
                   {recommendationsResult.recommendations.length === 0 && (
                      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-16 text-center text-muted-foreground">
                          <h3 className="mt-4 text-lg font-semibold">{t('no_recommendations_title')}</h3>
                          <p className="mt-1 text-sm">{t('no_recommendations_description')}</p>
                      </div>
                   )}
                </CardContent>
            </Card>
          )}

        </div>
      </main>
    </div>
  );
}
