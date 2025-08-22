'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Mic, Search, Sparkles, Volume2 } from 'lucide-react';
import Image from 'next/image';

import { findGovernmentSchemesAction, speechToTextAction, textToSpeechAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/page-header';
import type { FindGovernmentSchemesOutput } from '@/ai/flows/find-government-schemes';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useTranslation } from '@/hooks/use-translation';

const formSchema = z.object({
  query: z.string().min(3, 'Please enter at least 3 characters.'),
});

export default function GovernmentSchemesPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<FindGovernmentSchemesOutput | null>(null);
  const [language, setLanguage] = useState('en');
  const [isRecording, setIsRecording] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  const { t } = useTranslation(language);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { query: '' },
  });

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    setResult(null);
    setAudioUrl(null);
  };

  const handleMicClick = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
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
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64data = reader.result as string;
          if (!base64data) return;

          try {
            const response = await speechToTextAction({ audio: base64data, language });
            if (response.success) {
              form.setValue('query', response.data.text, { shouldValidate: true });
            } else {
              toast({ title: t('transcription_failed_title'), description: response.error, variant: 'destructive' });
            }
          } catch (error) {
            toast({ title: t('error'), description: t('audio_processing_error'), variant: 'destructive' });
          }
        };
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setIsRecording(true);
    } catch (error) {
      toast({
        title: t('mic_denied_title'),
        description: t('mic_denied_description'),
        variant: 'destructive',
      });
    }
  };

  const handlePlayAudio = async () => {
    if (!result) return;
    setIsAudioLoading(true);
    setAudioUrl(null);

    const textToSpeak = result.schemes
      .map(
        (scheme) =>
          `${scheme.title}. ${t('eligibility_label')}: ${scheme.eligibility}. ${t('benefits_label')}: ${scheme.benefits}. ${t('application_process_label')}: ${scheme.applicationProcess}`
      )
      .join('\n\n');
    
    try {
      const response = await textToSpeechAction({ text: textToSpeak, language });
      if (response.success) {
        setAudioUrl(response.data.audio);
      } else {
        toast({ title: t('audio_generation_failed_title'), description: response.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: t('error'), description: t('audio_generation_error'), variant: 'destructive' });
    } finally {
      setIsAudioLoading(false);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    setAudioUrl(null);
    try {
      const response = await findGovernmentSchemesAction({ ...values, language });
      if (response.success) {
        setResult(response.data);
      } else {
        toast({
          title: t('search_failed_title'),
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
      <PageHeader title={t('government_schemes_title')}>
        <LanguageSwitcher language={language} onLanguageChange={handleLanguageChange} />
      </PageHeader>
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="mx-auto max-w-3xl">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{t('find_government_schemes_title')}</CardTitle>
              <CardDescription>
                {t('find_government_schemes_description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-start gap-4">
                  <FormField
                    control={form.control}
                    name="query"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel className="sr-only">{t('query_label')}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input placeholder={t('schemes_search_placeholder')} className="pl-10 pr-10" {...field} />
                            <Button size="icon" variant={isRecording ? 'destructive' : 'ghost'} type="button" onClick={handleMicClick} className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-muted-foreground hover:bg-transparent">
                               <Mic className="h-4 w-4" />
                            </Button>
                          </div>
                        </FormControl>
                         <FormMessage className="pt-2" />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={isLoading} className="h-10">
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    {isLoading ? t('searching_button') : t('search_button')}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {isLoading && (
              <div className="flex h-64 items-center justify-center text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            )}
            {result && result.schemes.length > 0 && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                  <Button onClick={handlePlayAudio} disabled={isAudioLoading} variant="outline">
                    {isAudioLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Volume2 className="mr-2 h-4 w-4" />}
                    {isAudioLoading ? t('generating_audio_button') : t('read_aloud_button')}
                  </Button>
                  {audioUrl && (
                    <audio controls autoPlay src={audioUrl} className="w-full max-w-sm">
                      {t('audio_not_supported')}
                    </audio>
                  )}
                </div>
                <Accordion type="single" collapsible className="w-full">
                  {result.schemes.map((scheme, index) => (
                      <AccordionItem value={`item-${index}`} key={index} className="bg-card border rounded-lg px-4">
                          <AccordionTrigger className="font-headline text-lg hover:no-underline">{scheme.title}</AccordionTrigger>
                          <AccordionContent className="space-y-4 pt-2">
                            <div>
                                  <h4 className="font-semibold text-base">{t('eligibility_label')}</h4>
                                  <p className="text-sm text-muted-foreground">{scheme.eligibility}</p>
                            </div>
                              <div>
                                  <h4 className="font-semibold text-base">{t('benefits_label')}</h4>
                                  <p className="text-sm text-muted-foreground">{scheme.benefits}</p>
                            </div>
                              <div>
                                  <h4 className="font-semibold text-base">{t('application_process_label')}</h4>
                                  <p className="text-sm text-muted-foreground">{scheme.applicationProcess}</p>
                            </div>
                            {scheme.link && (
                              <Button asChild variant="link" className="p-0 h-auto">
                                  <a href={scheme.link} target="_blank" rel="noopener noreferrer">{t('learn_more_button')}</a>
                              </Button>
                            )}
                          </AccordionContent>
                      </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}
             {result && result.schemes.length === 0 && (
              <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed text-center text-muted-foreground">
                <p>{t('no_schemes_found_message')}</p>
                <p className="text-sm">{t('try_different_keywords_message')}</p>
              </div>
            )}
            {!isLoading && !result && (
              <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed text-center text-muted-foreground">
                 <Image src="https://placehold.co/600x400.png" alt={t('schemes_placeholder_alt')} data-ai-hint="government building" width={300} height={200} className="rounded-lg opacity-50"/>
                <p className="mt-4">{t('schemes_placeholder_text')}</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
