
'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Mic, Search, Sparkles, Volume2, Info, CheckCircle, Target, FileText, ScrollText } from 'lucide-react';

import { findGovernmentSchemesAction, speechToTextAction, textToSpeechAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/page-header';
import type { FindGovernmentSchemesOutput } from '@/ai/flows/find-government-schemes';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useTranslation } from '@/hooks/use-translation';
import { useLanguage } from '@/hooks/use-language';

const formSchema = z.object({
  query: z.string().min(3, 'Please enter at least 3 characters.'),
});

export default function GovernmentSchemesPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<FindGovernmentSchemesOutput | null>(null);
  const [searchTitle, setSearchTitle] = useState('Latest Schemes');
  const { language, setLanguage } = useLanguage();
  const [isRecording, setIsRecording] = useState(false);
  const [activeAudio, setActiveAudio] = useState<{ id: number; url: string; } | null>(null);
  const [audioLoadingId, setAudioLoadingId] = useState<number | null>(null);

  const { t } = useTranslation(language);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { query: '' },
  });

  const fetchLatestSchemes = async (lang: string) => {
    setIsLoading(true);
    setResult(null);
    setActiveAudio(null);
    setSearchTitle(t('latest_schemes_title') as string);
    try {
      const response = await findGovernmentSchemesAction({ query: 'latest agricultural schemes in India', language: lang });
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

  useEffect(() => {
    fetchLatestSchemes(language);
  }, [language]);


  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
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

  const handlePlayAudio = async (scheme: FindGovernmentSchemesOutput['schemes'][0], index: number) => {
    if (activeAudio?.id === index) {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        setActiveAudio(null);
        return;
    }

    setAudioLoadingId(index);
    setActiveAudio(null);

    const textToSpeak = `${scheme.title}. ${t('eligibility_label')}: ${scheme.eligibility}. ${t('benefits_label')}: ${scheme.benefits}. ${t('application_process_label')}: ${scheme.applicationProcess}`;
    
    try {
      const response = await textToSpeechAction({ text: textToSpeak, language });
      if (response.success) {
        setActiveAudio({ id: index, url: response.data.audio });
      } else {
        toast({ title: t('audio_generation_failed_title'), description: response.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: t('error'), description: t('audio_generation_error'), variant: 'destructive' });
    } finally {
      setAudioLoadingId(null);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    setActiveAudio(null);
    setSearchTitle(t('search_results_title') as string);
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
        <LanguageSwitcher />
      </PageHeader>
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="mx-auto max-w-4xl">
          <Card className="mb-6 shadow-lg">
            <CardHeader>
              <CardTitle>{t('find_government_schemes_title')}</CardTitle>
              <CardDescription>
                {t('find_government_schemes_description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <FormField
                    control={form.control}
                    name="query"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel className="sr-only">{t('query_label')}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                            <Input placeholder={t('schemes_search_placeholder')} className="pl-10 text-base" {...field} />
                            <Button size="icon" variant={isRecording ? 'destructive' : 'ghost'} type="button" onClick={handleMicClick} className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2">
                               <Mic className="h-5 w-5 text-muted-foreground" />
                            </Button>
                          </div>
                        </FormControl>
                         <FormMessage className="pt-2" />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                    {isLoading && searchTitle === t('search_results_title') ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    {isLoading && searchTitle === t('search_results_title') ? t('searching_button') : t('search_button')}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
          
          <div className="space-y-4">
             <h2 className="text-2xl font-bold font-headline">{searchTitle}</h2>
            {isLoading && (
              <div className="flex h-64 items-center justify-center text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            )}
            {result && result.schemes.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2">
                {result.schemes.map((scheme, index) => (
                    <Card key={index} className="flex flex-col">
                        <CardHeader>
                            <CardTitle className="font-headline text-lg">{scheme.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 space-y-4">
                            <div className="flex items-start gap-3">
                                <CheckCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0"/>
                                <div>
                                    <h4 className="font-semibold text-base">{t('eligibility_label')}</h4>
                                    <p className="text-sm text-muted-foreground">{scheme.eligibility}</p>
                                </div>
                            </div>
                             <div className="flex items-start gap-3">
                                <Target className="h-5 w-5 text-primary mt-1 flex-shrink-0"/>
                                <div>
                                    <h4 className="font-semibold text-base">{t('benefits_label')}</h4>
                                    <p className="text-sm text-muted-foreground">{scheme.benefits}</p>
                                </div>
                            </div>
                             <div className="flex items-start gap-3">
                                <FileText className="h-5 w-5 text-primary mt-1 flex-shrink-0"/>
                                <div>
                                    <h4 className="font-semibold text-base">{t('application_process_label')}</h4>
                                    <p className="text-sm text-muted-foreground">{scheme.applicationProcess}</p>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex-wrap gap-2">
                            {scheme.link && (
                              <Button asChild variant="link" className="p-0 h-auto">
                                  <a href={scheme.link} target="_blank" rel="noopener noreferrer">{t('learn_more_button')}</a>
                              </Button>
                            )}
                            <Button onClick={() => handlePlayAudio(scheme, index)} disabled={audioLoadingId !== null} variant="outline" size="sm" className="ml-auto">
                                {audioLoadingId === index ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Volume2 className="mr-2 h-4 w-4" />}
                                {activeAudio?.id === index ? 'Stop' : 'Read Aloud'}
                            </Button>
                             {activeAudio?.id === index && <audio ref={audioRef} src={activeAudio.url} autoPlay onEnded={() => setActiveAudio(null)} />}
                        </CardFooter>
                    </Card>
                ))}
              </div>
            )}
             {result && result.schemes.length === 0 && !isLoading && (
              <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed text-center text-muted-foreground">
                <Info className="h-10 w-10 mb-4"/>
                <h3 className="text-lg font-semibold">{t('no_schemes_found_message')}</h3>
                <p className="text-sm">{t('try_different_keywords_message')}</p>
              </div>
            )}
            {!result && !isLoading && (
              <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed text-center text-muted-foreground">
                <ScrollText className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4">{t('schemes_placeholder_text')}</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );

}

    
