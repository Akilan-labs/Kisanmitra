'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Sparkles, MapPin, Droplets, Wind, Thermometer, Cloud, CloudRain, CloudSun, CloudSnow, Sun, CloudLightning } from 'lucide-react';

import { getWeatherForecastAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/page-header';
import { LanguageSwitcher } from '@/components/language-switcher';
import type { GetWeatherForecastOutput } from '@/ai/flows/get-weather-forecast';
import { useTranslation } from '@/hooks/use-translation';
import { useLanguage } from '@/hooks/use-language';
import Image from 'next/image';

const formSchema = z.object({
  location: z.string().min(2, 'Please enter a location.'),
});

const weatherIconMap = {
  'Sunny': <Sun className="h-10 w-10 text-yellow-400" />,
  'Cloudy': <Cloud className="h-10 w-10 text-gray-400" />,
  'Rainy': <CloudRain className="h-10 w-10 text-blue-400" />,
  'Windy': <Wind className="h-10 w-10 text-gray-500" />,
  'Snowy': <CloudSnow className="h-10 w-10 text-white" />,
  'Thunderstorm': <CloudLightning className="h-10 w-10 text-yellow-500" />,
  'PartlyCloudy': <CloudSun className="h-10 w-10 text-yellow-400" />,
};

type WeatherIconName = keyof typeof weatherIconMap;

const WeatherIcon = ({ iconName }: { iconName: WeatherIconName }) => {
  return weatherIconMap[iconName] || <CloudSun className="h-10 w-10" />;
};


export default function WeatherForecastPage() {
  const { language, setLanguage } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GetWeatherForecastOutput | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation(language);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      location: '',
    },
  });

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    setResult(null);
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    try {
      const response = await getWeatherForecastAction({ ...values, language });
      if (response.success) {
        setResult(response.data);
      } else {
        toast({
          title: t('forecast_failed_title'),
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
      <PageHeader title={t('weather_forecast_title')}>
        <LanguageSwitcher />
      </PageHeader>
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="mx-auto max-w-4xl">
          <Card className="mb-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardHeader>
                  <CardTitle>{t('get_weather_forecast_title')}</CardTitle>
                  <CardDescription>
                    {t('get_weather_forecast_description')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('location_label')}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input placeholder={t('location_placeholder')} {...field} className="pl-10" />
                          </div>
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
                    {isLoading ? t('fetching_forecast_button') : t('get_forecast_button')}
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
                 <div className="space-y-6">
                    <Card>
                        <CardHeader>
                           <CardTitle>{t('farmers_summary_title')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">{result.summary}</p>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                         <Card className="flex flex-col items-center justify-center p-6 text-center">
                            <CardTitle className="mb-2 text-lg">{t('current_conditions_title')}</CardTitle>
                            <p className="text-5xl font-bold">{result.current.temp}°C</p>
                            <p className="text-muted-foreground">{result.current.condition}</p>
                             <div className="mt-4 flex gap-4 text-sm">
                                <div className="flex items-center gap-1">
                                    <Droplets className="h-4 w-4"/>
                                    <span>{result.current.humidity}%</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Wind className="h-4 w-4"/>
                                    <span>{result.current.windSpeed} km/h</span>
                                </div>
                            </div>
                        </Card>
                        <Card>
                             <CardHeader>
                                <CardTitle>{t('five_day_forecast_title')}</CardTitle>
                            </CardHeader>
                             <CardContent>
                                <div className="space-y-4">
                                {result.forecast.map((day) => (
                                    <div key={day.date} className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <WeatherIcon iconName={day.icon as WeatherIconName} />
                                            <div>
                                                <p className="font-semibold">{day.day}</p>
                                                <p className="text-sm text-muted-foreground">{day.condition}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                             <p className="font-semibold">{day.highTemp}° / {day.lowTemp}°</p>
                                             <p className="text-sm text-muted-foreground">{t('humidity_short')}: {day.humidity}%</p>
                                        </div>
                                    </div>
                                ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                 </div>
            )}
             {!isLoading && !result && (
              <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed text-center text-muted-foreground">
                 <Image src="https://placehold.co/600x400.png" alt={t('weather_placeholder_alt')} data-ai-hint="clouds sun" width={300} height={200} className="rounded-lg opacity-50"/>
                <p className="mt-4">{t('weather_placeholder_text')}</p>
              </div>
            )}
        </div>
      </main>
    </div>
  );

}
