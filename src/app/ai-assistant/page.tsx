
'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Mic, Send, Bot, User } from 'lucide-react';
import Image from 'next/image';
import { v4 as uuidv4 } from 'uuid';

import {
  askAIAction,
  speechToTextAction,
} from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/page-header';
import { LanguageSwitcher } from '@/components/language-switcher';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/hooks/use-translation';
import { useLanguage } from '@/hooks/use-language';

type Message = {
  id: string;
  role: 'user' | 'model';
  text: string;
};

const formSchema = z.object({
  query: z.string().min(1, 'Please enter a message.'),
});

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { language, setLanguage } = useLanguage();
  const [isRecording, setIsRecording] = useState(false);
  
  const { t } = useTranslation(language);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { query: '' },
  });

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    setMessages([]);
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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    const userMessage: Message = { id: uuidv4(), role: 'user', text: values.query };
    
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    form.reset();

    try {
      const history = newMessages.map(m => ({
        role: m.role,
        content: [{text: m.text}],
      }));

      const response = await askAIAction({ history, language });
      
      if (response.success) {
        const assistantMessage: Message = { id: uuidv4(), role: 'model', text: response.data.answer };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        const errorMessage: Message = { id: uuidv4(), role: 'model', text: `${t('error_prefix')}: ${response.error}` };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
       const errorMessage: Message = { id: uuidv4(), role: 'model', text: t('unexpected_error_short') };
       setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader title={t('ai_assistant_title')}>
        <LanguageSwitcher />
      </PageHeader>
      <main className="flex flex-1 flex-col overflow-y-auto p-4 md:p-6">
        <div className="flex-1">
          <ScrollArea className="h-[calc(100vh-220px)]" ref={scrollAreaRef}>
             <div className="space-y-6 pr-4">
              {messages.length === 0 && (
                 <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
                    <Image src="https://placehold.co/600x400.png" alt={t('ai_assistant_placeholder_alt')} data-ai-hint="friendly robot" width={300} height={200} className="rounded-lg opacity-50"/>
                    <h2 className="mt-4 text-2xl font-bold font-headline">{t('ai_assistant_welcome_title')}</h2>
                    <p className="mt-2">{t('ai_assistant_welcome_message')}</p>
                 </div>
              )}
              {messages.map((message) => (
                <div key={message.id} className={cn("flex items-start gap-4", message.role === 'user' && 'justify-end')}>
                  {message.role === 'model' && (
                    <Avatar className="h-8 w-8">
                       <AvatarFallback><Bot /></AvatarFallback>
                    </Avatar>
                  )}
                  <div className={cn("max-w-md rounded-lg p-3", message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                    <p className="whitespace-pre-wrap text-sm">{message.text}</p>
                  </div>
                   {message.role === 'user' && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback><User/></AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
               {isLoading && (
                  <div className="flex items-start gap-4">
                    <Avatar className="h-8 w-8">
                       <AvatarFallback><Bot /></AvatarFallback>
                    </Avatar>
                    <div className="max-w-md rounded-lg p-3 bg-muted">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                  </div>
                )}
            </div>
          </ScrollArea>
        </div>
        <div className="mt-auto border-t pt-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-center gap-4">
                <FormField
                  control={form.control}
                  name="query"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="sr-only">{t('your_message_label')}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t('ai_assistant_input_placeholder')}
                          className="resize-none"
                          rows={1}
                          {...field}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              form.handleSubmit(onSubmit)();
                            }
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                 <Button size="icon" variant={isRecording ? 'destructive' : 'ghost'} type="button" onClick={handleMicClick} disabled={isLoading}>
                    <Mic className="h-5 w-5" />
                 </Button>
                <Button type="submit" size="icon" disabled={isLoading}>
                   <Send className="h-5 w-5" />
                </Button>
              </form>
            </Form>
        </div>
      </main>
    </div>
  );
}
