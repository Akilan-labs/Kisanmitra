'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Sparkles, Shield, AlertTriangle, ShieldCheck } from 'lucide-react';
import Image from 'next/image';

import { forecastDiseaseOutbreakAction } from '@/app/actions';
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
import type { ForecastDiseaseOutbreakOutput } from '@/ai/flows/forecast-disease-outbreak';
import { useTranslation } from '@/hooks/use-translation';
import { useLanguage } from '@/hooks/use-language';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const formSchema = z.object({
  crop: z.string().min(2, 'Please enter a crop name.'),
  region: z.string().min(2, 'Please enter a region.'),
});

const getRiskVariant = (riskLevel: 'Low' | 'Medium' | 'High' | 'Very High'): "default" | "secondary" | "destructive" => {
    switch (riskLevel) {
        case 'High':
        case 'Very High':
            return 'destructive';
        case 'Medium':
            return 'secondary';
        case 'Low':
        default:
            return 'default';
    }
}

export default function DiseaseOutbreakForecastPage() {
  const { language, setLanguage } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ForecastDiseaseOutbreakOutput | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation(language);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      crop: '',
      region: '',
    },
  });

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    setResult(null);
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    try {
      const response = await forecastDiseaseOutbreakAction({ ...values, language });
      if (response.success) {
        setResult(response.data);
      } else {
        toast({
          title: t('forecast_failed_title'),
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
      <PageHeader title={t('disease_outbreak_forecast_title')}>
        <LanguageSwitcher />
      </PageHeader>
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardHeader>
                  <CardTitle>{t('forecast_disease_outbreaks_title')}</CardTitle>
                  <CardDescription>
                    {t('forecast_disease_outbreaks_description')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    {isLoading ? t('forecasting_button') : t('forecast_outbreak_button')}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>{t('risk_analysis_title')}</CardTitle>
              <CardDescription>
                {t('risk_analysis_description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              {isLoading && (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              )}
              {result && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                        <CardTitle>{t('forecast_summary_title')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">{result.forecastSummary}</p>
                    </CardContent>
                  </Card>

                  {result.diseaseRisks.length > 0 && (
                     <Accordion type="single" collapsible className="w-full" defaultValue="item-0">
                      {result.diseaseRisks.map((risk, index) => (
                          <AccordionItem value={`item-${index}`} key={index} className="bg-card border rounded-lg px-4 mb-2">
                              <AccordionTrigger className="hover:no-underline">
                                <div className="flex items-center gap-4">
                                     <Badge variant={getRiskVariant(risk.riskLevel)}>{risk.riskLevel} {t('risk_label')}</Badge>
                                     <span className="font-headline text-lg">{risk.diseaseName}</span>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="space-y-4 pt-2">
                                <div>
                                    <h4 className="font-semibold text-base flex items-center gap-2 mb-1">
                                      <AlertTriangle className="h-4 w-4 text-primary"/>
                                      {t('risk_factors_label')}
                                    </h4>
                                    <p className="text-sm text-muted-foreground">{risk.riskFactors}</p>
                                </div>
                                  <div>
                                    <h4 className="font-semibold text-base flex items-center gap-2 mb-1">
                                      <ShieldCheck className="h-4 w-4 text-primary"/>
                                      {t('preventive_actions_label')}
                                    </h4>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{risk.preventiveActions}</p>
                                </div>
                              </AccordionContent>
                          </AccordionItem>
                      ))}
                    </Accordion>
                  )}

                   {result.diseaseRisks.length === 0 && (
                    <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed text-center text-muted-foreground">
                        <p>{t('no_disease_risk_message')}</p>
                    </div>
                   )}

                </div>
              )}
              {!isLoading && !result && (
                <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
                  <Image src="https://placehold.co/600x400.png" alt={t('outbreak_placeholder_alt')} data-ai-hint="magnifying glass plant" width={300} height={200} className="rounded-lg opacity-50"/>
                  <p className="mt-4">{t('outbreak_placeholder_text')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
