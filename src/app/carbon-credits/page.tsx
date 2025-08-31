
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Sparkles, Recycle, Trees, HandCoins, Info, Briefcase } from 'lucide-react';
import Image from 'next/image';

import { estimateCarbonCreditsAction } from '@/app/actions';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/page-header';
import { LanguageSwitcher } from '@/components/language-switcher';
import type { EstimateCarbonCreditsOutput } from '@/ai/schemas/carbon-credits';
import { useTranslation } from '@/hooks/use-translation';
import { useLanguage } from '@/hooks/use-language';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


const formSchema = z.object({
  projectType: z.enum(['agroforestry', 'rice_cultivation']),
  hectares: z.coerce.number().positive('Area is required.'),
  region: z.string().min(2, 'Region is required.'),
  treeCount: z.coerce.number().optional(),
  waterManagement: z.enum(['flooded', 'intermittent', 'drained']).optional(),
  tillage: z.enum(['conventional', 'no-till']).optional(),
});


export default function CarbonCreditsPage() {
  const { language } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<EstimateCarbonCreditsOutput | null>(null);
  const [projectType, setProjectType] = useState<'agroforestry' | 'rice_cultivation'>('agroforestry');

  const { toast } = useToast();
  const { t } = useTranslation(language);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectType: 'agroforestry',
      hectares: 1,
      region: '',
    },
  });

  const handleTabChange = (value: string) => {
    const newProjectType = value as 'agroforestry' | 'rice_cultivation';
    setProjectType(newProjectType);
    form.setValue('projectType', newProjectType);
    form.reset({
        projectType: newProjectType,
        hectares: 1,
        region: form.getValues('region'),
    })
    setResult(null);
  };


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);

    try {
      const response = await estimateCarbonCreditsAction({ ...values, language });
      if (response.success) {
        setResult(response.data);
      } else {
        toast({
          title: t('estimation_failed_title'),
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
      <PageHeader title={t('carbon_credits_title')}>
        <LanguageSwitcher />
      </PageHeader>
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardHeader>
                  <CardTitle>{t('carbon_credit_estimator_title')}</CardTitle>
                  <CardDescription>
                    {t('carbon_credit_estimator_description')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs value={projectType} onValueChange={handleTabChange} className="w-full mb-4">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="agroforestry">{t('agroforestry_tab')}</TabsTrigger>
                            <TabsTrigger value="rice_cultivation">{t('rice_cultivation_tab')}</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className="space-y-4">
                        <FormField
                            control={form.control}
                            name="hectares"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>{t('area_hectares_label')}</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="e.g., 2.5" {...field} />
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
                                <FormLabel>{t('region_country_label')}</FormLabel>
                                <FormControl>
                                    <Input placeholder={t('region_placeholder')} {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />

                        {projectType === 'agroforestry' && (
                             <FormField
                                control={form.control}
                                name="treeCount"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>{t('number_of_trees_label')}</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="e.g., 500" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        {projectType === 'rice_cultivation' && (
                           <>
                             <FormField
                                control={form.control}
                                name="waterManagement"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>{t('water_management_label')}</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('water_management_placeholder')} />
                                        </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="flooded">{t('water_management_flooded')}</SelectItem>
                                            <SelectItem value="intermittent">{t('water_management_intermittent')}</SelectItem>
                                            <SelectItem value="drained">{t('water_management_drained')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                                <FormField
                                control={form.control}
                                name="tillage"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>{t('tillage_practice_label')}</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('tillage_practice_placeholder')} />
                                        </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                             <SelectItem value="conventional">{t('tillage_conventional')}</SelectItem>
                                             <SelectItem value="no-till">{t('tillage_no_till')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                           </>
                        )}
                    </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    {isLoading ? t('estimating_button') : t('estimate_credits_button')}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>{t('estimation_results_title')}</CardTitle>
              <CardDescription>{t('estimation_results_description')}</CardDescription>
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
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('estimated_annual_credits_label')}</CardTitle>
                        <Trees className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-headline">{result.estimatedCredits.toFixed(2)} tCO₂e/year</div>
                        <p className="text-xs text-muted-foreground">{t('tonnes_co2_equivalent_desc')}</p>
                    </CardContent>
                  </Card>
                   <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('potential_revenue_label')}</CardTitle>
                        <HandCoins className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-headline">{result.potentialRevenue} / year</div>
                        <p className="text-xs text-muted-foreground">{t('potential_revenue_desc')}</p>
                    </CardContent>
                  </Card>
                  
                  <div className="space-y-2">
                    <h3 className="font-headline flex items-center gap-2 text-lg font-semibold">
                      <Info className="h-5 w-5" />
                      {t('how_it_was_calculated_label')}
                    </h3>
                    <p className="text-sm text-foreground/90">{result.explanation}</p>
                  </div>

                   <div className="space-y-2">
                    <h3 className="font-headline flex items-center gap-2 text-lg font-semibold">
                      <Briefcase className="h-5 w-5" />
                      {t('next_steps_label')}
                    </h3>
                    <p className="text-sm text-foreground/90 whitespace-pre-wrap">{result.nextSteps}</p>
                  </div>
                </div>
              )}
              {!isLoading && !result && (
                <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
                  <Image
                    src="https://placehold.co/600x400.png"
                    alt={t('carbon_credits_placeholder_alt')}
                    data-ai-hint="trees nature"
                    width={300}
                    height={200}
                    className="rounded-lg opacity-50"
                  />
                  <p className="mt-4">{t('carbon_credits_placeholder_text')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
