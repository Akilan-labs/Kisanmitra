'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Sparkles, ShieldCheck, TrendingUp, CloudSun, Leaf, Info, ShieldAlert, LineChart } from 'lucide-react';
import Image from 'next/image';

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

const formSchema = z.object({
  crop: z.string().min(2, 'Please enter a crop name.'),
  region: z.string().min(2, 'Please enter a region.'),
});

const getPriorityVariant = (priority: 'Low' | 'Medium' | 'High'): "default" | "secondary" | "destructive" => {
    switch (priority) {
        case 'High':
            return 'destructive';
        case 'Medium':
            return 'secondary';
        case 'Low':
        default:
            return 'default';
    }
}

const categoryIconMap = {
    Weather: <CloudSun className="h-5 w-5" />,
    Disease: <ShieldAlert className="h-5 w-5" />,
    Irrigation: <Leaf className="h-5 w-5" />,
    Market: <LineChart className="h-5 w-5" />,
    General: <Info className="h-5 w-5" />,
}

export default function FarmDashboardPage() {
  const { language, setLanguage } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GetFarmInsightsOutput | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation(language);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      crop: '',
      region: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    try {
      const response = await getFarmInsightsAction({ ...values, language });
      if (response.success) {
        setResult(response.data);
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
                <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

          {result && (
             <Card>
                <CardHeader>
                    <CardTitle>{t('weekly_insights_title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {result.insights.length > 0 ? result.insights.map((insight, index) => (
                        <Card key={index} className="flex items-start gap-4 p-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                                {categoryIconMap[insight.category]}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold font-headline">{insight.title}</h3>
                                    <Badge variant={getPriorityVariant(insight.priority)}>{insight.priority}</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{insight.recommendation}</p>
                                <p className="text-xs text-muted-foreground/80 mt-1">Source: {insight.source}</p>
                            </div>
                        </Card>
                    )) : (
                        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-16 text-center text-muted-foreground">
                          <ShieldCheck className="h-12 w-12 text-green-500"/>
                          <h3 className="mt-4 text-lg font-semibold">All Clear!</h3>
                          <p className="mt-1 text-sm">No critical alerts for your farm this week. Keep up the great work!</p>
                        </div>
                    )}
                </CardContent>
             </Card>
          )}

          {!isLoading && !result && (
              <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-24 text-center text-muted-foreground">
                <Image src="https://picsum.photos/600/400" alt={t('insights_placeholder_alt')} data-ai-hint="farm landscape" width={300} height={200} className="rounded-lg opacity-50"/>
                <h2 className="mt-6 text-xl font-semibold font-headline">{t('insights_placeholder_title')}</h2>
                <p className="mt-2 max-w-sm">{t('insights_placeholder_text')}</p>
              </div>
            )}
        </div>
      </main>
    </div>
  );
}
