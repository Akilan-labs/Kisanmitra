
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Sparkles, Recycle, Trees, HandCoins, Info, Briefcase, FileImage } from 'lucide-react';
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
import { Label } from '@/components/ui/label';

const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const formSchema = z.object({
  projectType: z.enum(['agroforestry', 'rice_cultivation']),
  hectares: z.coerce.number().positive('Area is required.'),
  region: z.string().min(2, 'Region is required.'),
  
  // Agroforestry
  treeCount: z.coerce.number().optional(),
  plantingYear: z.coerce.number().optional(),

  // Rice
  waterManagement: z.enum(['flooded', 'intermittent_awd', 'drained']).optional(),
  strawManagement: z.enum(['removed', 'incorporated_retained', 'burned']).optional(),
  plantingDate: z.string().optional(),
  harvestDate: z.string().optional(),
});


export default function CarbonCreditsPage() {
  const { language } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<EstimateCarbonCreditsOutput | null>(null);
  const [projectType, setProjectType] = useState<'agroforestry' | 'rice_cultivation'>('agroforestry');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTabChange = (value: string) => {
    const newProjectType = value as 'agroforestry' | 'rice_cultivation';
    setProjectType(newProjectType);
    form.setValue('projectType', newProjectType);
    form.reset({
        projectType: newProjectType,
        hectares: form.getValues('hectares') || 1,
        region: form.getValues('region'),
    })
    setResult(null);
  };


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);

    let photoDataUri: string | undefined = undefined;
    if (imageFile) {
      try {
        photoDataUri = await fileToDataUri(imageFile);
      } catch (error) {
        toast({
          title: t('image_error_title'),
          description: t('image_error_description'),
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }
    }

    try {
      const response = await estimateCarbonCreditsAction({ ...values, language, photoDataUri });
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        </div>


                        {projectType === 'agroforestry' && (
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                <FormField
                                    control={form.control}
                                    name="plantingYear"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>{t('planting_year_label')}</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="e.g., 2020" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}

                        {projectType === 'rice_cultivation' && (
                           <div className="space-y-4">
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                              <SelectItem value="intermittent_awd">{t('water_management_intermittent_awd')}</SelectItem>
                                              <SelectItem value="drained">{t('water_management_drained')}</SelectItem>
                                          </SelectContent>
                                      </Select>
                                      <FormMessage />
                                      </FormItem>
                                  )}
                                  />
                                  <FormField
                                    control={form.control}
                                    name="strawManagement"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>{t('straw_management_label')}</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('straw_management_placeholder')} />
                                            </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="removed">{t('straw_management_removed')}</SelectItem>
                                                <SelectItem value="incorporated_retained">{t('straw_management_incorporated')}</SelectItem>
                                                <SelectItem value="burned">{t('straw_management_burned')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                  />
                              </div>
                               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <FormField
                                      control={form.control}
                                      name="plantingDate"
                                      render={({ field }) => (
                                          <FormItem>
                                          <FormLabel>{t('planting_date_label')}</FormLabel>
                                          <FormControl>
                                              <Input type="date" {...field} />
                                          </FormControl>
                                          <FormMessage />
                                          </FormItem>
                                      )}
                                  />
                                   <FormField
                                      control={form.control}
                                      name="harvestDate"
                                      render={({ field }) => (
                                          <FormItem>
                                          <FormLabel>{t('harvest_date_label')}</FormLabel>
                                          <FormControl>
                                              <Input type="date" {...field} />
                                          </FormControl>
                                          <FormMessage />
                                          </FormItem>
                                      )}
                                  />
                              </div>
                           </div>
                        )}
                         <div className="space-y-2">
                            <Label htmlFor="farm-photo">{t('farm_photo_label')}</Label>
                             <Input id="farm-photo" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                             <div className="flex aspect-video w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed bg-muted/50 hover:bg-muted/75" onClick={() => document.getElementById('farm-photo')?.click()}>
                                {imagePreview ? (
                                    <Image
                                    src={imagePreview}
                                    alt={t('farm_photo_preview_alt')}
                                    width={600}
                                    height={400}
                                    className="h-full w-full object-contain rounded-lg"
                                    />
                                ) : (
                                    <div className="text-center text-muted-foreground">
                                    <FileImage className="mx-auto h-12 w-12" />
                                    <p className="mt-2">{t('upload_geotagged_photo_prompt')}</p>
                                    </div>
                                )}
                            </div>
                         </div>
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
                    <p className="text-sm text-foreground/90 whitespace-pre-wrap">{result.explanation}</p>
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
                    src="https://picsum.photos/600/400"
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
