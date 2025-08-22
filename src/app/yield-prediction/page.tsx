
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BarChart, FileImage, Info, Loader2, Sparkles, Warehouse } from 'lucide-react';
import Image from 'next/image';

import { predictYieldAction } from '@/app/actions';
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
import type { PredictYieldOutput } from '@/ai/flows/predict-yield';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/hooks/use-translation';
import { useLanguage } from '@/hooks/use-language';

const formSchema = z.object({
  crop: z.string().min(2, 'Please enter a crop name.'),
  area: z.coerce.number().positive('Area must be a positive number.'),
  soilType: z.string().min(1, 'Please select a soil type.'),
  rainfall: z.coerce.number().positive('Rainfall must be a positive number.'),
  region: z.string().min(2, 'Please enter a region.'),
});

const soilTypes = ['Loamy', 'Sandy', 'Clay', 'Silt', 'Peat', 'Chalky'];

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

export default function YieldPredictionPage() {
  const { language, setLanguage } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PredictYieldOutput | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation(language);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      crop: '',
      area: 1,
      soilType: '',
      rainfall: 1000,
      region: '',
    },
  });
  
  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    setResult(null);
  };

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
      const response = await predictYieldAction({ ...values, language, photoDataUri });
      if (response.success) {
        setResult(response.data);
      } else {
        toast({
          title: t('prediction_failed_title'),
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
      <PageHeader title={t('yield_prediction_title')}>
        <LanguageSwitcher />
      </PageHeader>
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardHeader>
                  <CardTitle>{t('enter_crop_details_title')}</CardTitle>
                  <CardDescription>
                    {t('enter_crop_details_description')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    <Label htmlFor="crop-image">{t('crop_field_image_label')}</Label>
                    <Input
                      id="crop-image"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div className="flex aspect-video w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed bg-muted/50 hover:bg-muted/75" onClick={() => document.getElementById('crop-image')?.click()}>
                      {imagePreview ? (
                        <Image
                          src={imagePreview}
                          alt={t('crop_field_preview_alt')}
                          width={600}
                          height={400}
                          className="h-full w-full object-contain rounded-lg"
                        />
                      ) : (
                        <div className="text-center text-muted-foreground">
                          <FileImage className="mx-auto h-12 w-12" />
                          <p className="mt-2">{t('upload_image_prompt')}</p>
                          <p className="text-xs">{t('field_image_accuracy_note')}</p>
                        </div>
                      )}
                    </div>
                  </div>

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
                      name="area"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('area_label')}</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder={t('area_placeholder')} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="soilType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('soil_type_label')}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('soil_type_placeholder')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {soilTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="rainfall"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('annual_rainfall_label')}</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder={t('annual_rainfall_placeholder')} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="region"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                          <FormLabel>{t('region_label')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('region_placeholder')} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    {isLoading ? t('predicting_button') : t('predict_yield_button')}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>{t('prediction_result_title')}</CardTitle>
              <CardDescription>{t('prediction_result_description')}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              {isLoading && (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              )}
              {result && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-headline mb-1 flex items-center gap-2 text-lg font-semibold">
                      <Warehouse className="h-5 w-5" />
                      {t('predicted_yield_label')}
                    </h3>
                    <p className="text-2xl font-bold text-primary">{result.predictedYield}</p>
                  </div>
                  <div>
                    <h3 className="font-headline mb-1 flex items-center gap-2 text-lg font-semibold">
                      <BarChart className="h-5 w-5" />
                      {t('confidence_label')}
                    </h3>
                    <Badge
                      variant={
                        result.confidence.toLowerCase() === 'high'
                          ? 'default'
                          : result.confidence.toLowerCase() === 'medium'
                          ? 'secondary'
                          : 'destructive'
                      }
                    >
                      {result.confidence}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="font-headline mb-1 flex items-center gap-2 text-lg font-semibold">
                      <Info className="h-5 w-5" />
                      {t('recommendations_label')}
                    </h3>
                    <p className="whitespace-pre-wrap text-foreground/90">{result.recommendations}</p>
                  </div>
                </div>
              )}
              {!isLoading && !result && (
                <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
                  <Image
                    src="https://placehold.co/600x400.png"
                    alt={t('yield_placeholder_alt')}
                    data-ai-hint="field crops"
                    width={300}
                    height={200}
                    className="rounded-lg opacity-50"
                  />
                  <p className="mt-4">{t('yield_placeholder_text')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
