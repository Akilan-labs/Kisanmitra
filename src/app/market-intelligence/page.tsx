'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Mic, Sparkles, TrendingUp } from 'lucide-react';
import Image from 'next/image';

import { getMarketPriceAction, speechToTextAction } from '@/app/actions';
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
import type { GetMarketPriceOutput } from '@/ai/flows/get-market-price';

const formSchema = z.object({
  crop: z.string().min(2, 'Please enter a crop name.'),
  mandi: z.string().min(2, 'Please enter a mandi name.'),
});

type FieldName = 'crop' | 'mandi';

export default function MarketIntelligencePage() {
  const [language, setLanguage] = useState('en');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GetMarketPriceOutput | null>(null);
  const [isRecording, setIsRecording] = useState<FieldName | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      crop: '',
      mandi: '',
    },
  });

  const handleMicClick = async (field: FieldName) => {
    if (isRecording === field) {
      mediaRecorderRef.current?.stop();
      setIsRecording(null);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      const audioChunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      recorder.onstop = async () => {
        setIsRecording(null);
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64data = reader.result as string;
          if (!base64data) return;

          try {
            const response = await speechToTextAction({ audio: base64data, language });
            if (response.success) {
              form.setValue(field, response.data.text, { shouldValidate: true });
            } else {
              toast({ title: 'Transcription Failed', description: response.error, variant: 'destructive' });
            }
          } catch (error) {
            toast({ title: 'Error', description: 'Failed to process audio.', variant: 'destructive' });
          }
        };
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setIsRecording(field);
    } catch (error) {
      toast({
        title: 'Microphone Access Denied',
        description: 'Please enable microphone permissions in your browser settings.',
        variant: 'destructive',
      });
    }
  };


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    try {
      const response = await getMarketPriceAction({ ...values, language });
      if (response.success) {
        setResult(response.data);
      } else {
        toast({
          title: 'Analysis Failed',
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
      <PageHeader title="Market Intelligence">
        <LanguageSwitcher language={language} onLanguageChange={setLanguage} />
      </PageHeader>
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardHeader>
                  <CardTitle>Check Market Prices</CardTitle>
                  <CardDescription>
                    Enter a crop and mandi to get real-time price analysis.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="crop"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Crop Name</FormLabel>
                        <FormControl>
                           <div className="relative">
                            <Input placeholder="e.g., Tomato, Wheat" {...field} className="pr-10"/>
                            <Button size="icon" variant={isRecording === 'crop' ? 'destructive' : 'ghost'} type="button" onClick={() => handleMicClick('crop')} className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-muted-foreground hover:bg-transparent">
                               <Mic className="h-4 w-4" />
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="mandi"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mandi Name</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input placeholder="e.g., Yeshwanthpur, Azadpur" {...field} className="pr-10" />
                             <Button size="icon" variant={isRecording === 'mandi' ? 'destructive' : 'ghost'} type="button" onClick={() => handleMicClick('mandi')} className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-muted-foreground hover:bg-transparent">
                               <Mic className="h-4 w-4" />
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading || isRecording ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    {isLoading ? 'Analyzing...' : isRecording ? 'Recording...' : 'Get Prices'}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
           <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Market Analysis</CardTitle>
              <CardDescription>
                AI-powered price and trend information.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              {isLoading && (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              )}
              {result && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg font-headline">Current Price</h3>
                    <p className="text-2xl font-bold text-primary">{result.price}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg font-headline flex items-center gap-2">
                        <TrendingUp className="h-5 w-5"/>
                        Trend Analysis
                    </h3>
                    <p className="text-foreground/90 whitespace-pre-wrap">{result.trendAnalysis}</p>
                  </div>
                </div>
              )}
              {!isLoading && !result && (
                <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
                   <Image src="https://placehold.co/600x400.png" alt="Market stall with fresh produce" data-ai-hint="market produce" width={300} height={200} className="rounded-lg opacity-50"/>
                  <p className="mt-4">Your market analysis will appear here.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
