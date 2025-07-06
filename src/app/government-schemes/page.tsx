'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Mic, Search, Sparkles } from 'lucide-react';
import Image from 'next/image';

import { findGovernmentSchemesAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/page-header';
import type { FindGovernmentSchemesOutput } from '@/ai/flows/find-government-schemes';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const formSchema = z.object({
  query: z.string().min(3, 'Please enter at least 3 characters.'),
});

export default function GovernmentSchemesPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<FindGovernmentSchemesOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { query: '' },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    try {
      const response = await findGovernmentSchemesAction(values);
      if (response.success) {
        setResult(response.data);
      } else {
        toast({
          title: 'Search Failed',
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
      <PageHeader title="Government Schemes" />
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="mx-auto max-w-3xl">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Find Government Schemes</CardTitle>
              <CardDescription>
                Ask about subsidies, loans, or any other government support you need.
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
                        <FormLabel className="sr-only">Query</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input placeholder="e.g., 'subsidy for drip irrigation', 'kisan credit card'" className="pl-10" {...field} />
                            <Button size="icon" variant="ghost" type="button" className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-muted-foreground hover:bg-transparent">
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
                    {isLoading ? 'Searching...' : 'Search'}
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
               <Accordion type="single" collapsible className="w-full">
                {result.schemes.map((scheme, index) => (
                    <AccordionItem value={`item-${index}`} key={index} className="bg-card border rounded-lg px-4">
                        <AccordionTrigger className="font-headline text-lg hover:no-underline">{scheme.title}</AccordionTrigger>
                        <AccordionContent className="space-y-4 pt-2">
                           <div>
                                <h4 className="font-semibold text-base">Eligibility</h4>
                                <p className="text-sm text-muted-foreground">{scheme.eligibility}</p>
                           </div>
                             <div>
                                <h4 className="font-semibold text-base">Benefits</h4>
                                <p className="text-sm text-muted-foreground">{scheme.benefits}</p>
                           </div>
                             <div>
                                <h4 className="font-semibold text-base">Application Process</h4>
                                <p className="text-sm text-muted-foreground">{scheme.applicationProcess}</p>
                           </div>
                           {scheme.link && (
                             <Button asChild variant="link" className="p-0 h-auto">
                                <a href={scheme.link} target="_blank" rel="noopener noreferrer">Learn More</a>
                            </Button>
                           )}
                        </AccordionContent>
                    </AccordionItem>
                ))}
              </Accordion>
            )}
             {result && result.schemes.length === 0 && (
              <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed text-center text-muted-foreground">
                <p>No schemes found for your query.</p>
                <p className="text-sm">Try using different keywords.</p>
              </div>
            )}
            {!isLoading && !result && (
              <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed text-center text-muted-foreground">
                 <Image src="https://placehold.co/600x400.png" alt="Government building" data-ai-hint="government building" width={300} height={200} className="rounded-lg opacity-50"/>
                <p className="mt-4">Search results for government schemes will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
