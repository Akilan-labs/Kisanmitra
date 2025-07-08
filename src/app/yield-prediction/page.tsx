'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BarChart, Info, Loader2, Sparkles, Warehouse } from 'lucide-react';
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

const formSchema = z.object({
  crop: z.string().min(2, 'Please enter a crop name.'),
  area: z.coerce.number().positive('Area must be a positive number.'),
  soilType: z.string().min(1, 'Please select a soil type.'),
  rainfall: z.coerce.number().positive('Rainfall must be a positive number.'),
  region: z.string().min(2, 'Please enter a region.'),
});

const soilTypes = ['Loamy', 'Sandy', 'Clay', 'Silt', 'Peat', 'Chalky'];

export default function YieldPredictionPage() {
  const [language, setLanguage] = useState('en');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PredictYieldOutput | null>(null);
  const { toast } = useToast();

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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    try {
      const response = await predictYieldAction({ ...values, language });
      if (response.success) {
        setResult(response.data);
      } else {
        toast({
          title: 'Prediction Failed',
          description: response.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Yield Prediction">
        <LanguageSwitcher language={language} onLanguageChange={setLanguage} />
      </PageHeader>
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardHeader>
                  <CardTitle>Enter Crop Details</CardTitle>
                  <CardDescription>
                    Provide the following details to get a yield prediction.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="crop"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Crop Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Rice, Wheat" {...field} />
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
                        <FormLabel>Area (in acres)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g., 5" {...field} />
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
                        <FormLabel>Soil Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a soil type" />
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
                        <FormLabel>Annual Rainfall (mm)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g., 1200" {...field} />
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
                        <FormLabel>Region/State</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Punjab, Karnataka" {...field} />
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
                    {isLoading ? 'Predicting...' : 'Predict Yield'}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Prediction Result</CardTitle>
              <CardDescription>AI-powered yield forecast and recommendations.</CardDescription>
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
                      Predicted Yield
                    </h3>
                    <p className="text-2xl font-bold text-primary">{result.predictedYield}</p>
                  </div>
                  <div>
                    <h3 className="font-headline mb-1 flex items-center gap-2 text-lg font-semibold">
                      <BarChart className="h-5 w-5" />
                      Confidence
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
                      Recommendations
                    </h3>
                    <p className="whitespace-pre-wrap text-foreground/90">{result.recommendations}</p>
                  </div>
                </div>
              )}
              {!isLoading && !result && (
                <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
                  <Image
                    src="https://placehold.co/600x400.png"
                    alt="Lush green field"
                    data-ai-hint="field crops"
                    width={300}
                    height={200}
                    className="rounded-lg opacity-50"
                  />
                  <p className="mt-4">Your yield prediction will appear here.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
