
'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Camera, FileImage, Loader2, Sparkles, Siren, Pill, BarChart, Leaf, Shield, TestTube, TreeDeciduous } from 'lucide-react';

import { diagnoseCropDiseaseAction } from '@/app/actions';
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
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/page-header';
import { LanguageSwitcher } from '@/components/language-switcher';
import type { DiagnoseCropDiseaseOutput } from '@/ai/flows/diagnose-crop-disease';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from '@/hooks/use-translation';
import { useLanguage } from '@/hooks/use-language';


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

export default function DiseaseDiagnosisPage() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const { language, setLanguage } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DiagnoseCropDiseaseOutput | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation(language);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  useEffect(() => {
    const getCameraPermission = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCameraPermission(false);
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({video: true});
        setHasCameraPermission(true);
        stream.getTracks().forEach(track => track.stop());
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
      }
    };
    getCameraPermission();
  }, []);
  
  const startVideoStream = async () => {
    if (videoRef.current && hasCameraPermission) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        videoRef.current.srcObject = stream;
        setIsCameraOpen(true);
      } catch (err) {
        toast({
          variant: 'destructive',
          title: t('camera_error_title'),
          description: t('camera_error_description'),
        });
      }
    }
  };

  const stopVideoStream = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraOpen(false);
    }
  };

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    setResult(null);
  };

  const handleCameraOpen = () => {
    setResult(null);
    setImagePreview(null);
    setImageFile(null);
    startVideoStream();
  };
  
  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context?.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUri = canvas.toDataURL('image/jpeg');
      
      setImagePreview(dataUri);
      
      canvas.toBlob(blob => {
          if (blob) {
              const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
              setImageFile(file);
          }
      }, 'image/jpeg');

      stopVideoStream();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    stopVideoStream();
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setResult(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!imageFile) {
      toast({
        title: t('no_image_title'),
        description: t('no_image_description'),
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const dataUri = await fileToDataUri(imageFile);
      const response = await diagnoseCropDiseaseAction({ photoDataUri: dataUri, language });
      if (response.success) {
        setResult(response.data);
      } else {
        toast({
          title: t('diagnosis_failed_title'),
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
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeader title={t('crop_disease_diagnosis_title')}>
        <LanguageSwitcher />
      </PageHeader>
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>{t('upload_crop_image_title')}</CardTitle>
                <CardDescription>
                  {t('upload_crop_image_description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Label htmlFor="crop-image" className="sr-only">
                    {t('crop_image_label')}
                  </Label>
                  <Input
                    id="crop-image"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <canvas ref={canvasRef} className="hidden" />

                  <div className="aspect-video w-full rounded-lg border-2 border-dashed bg-muted/50 flex items-center justify-center overflow-hidden">
                    {isCameraOpen ? (
                       <video ref={videoRef} className="h-full w-full object-cover" autoPlay playsInline muted/>
                    ) : imagePreview ? (
                      <Image
                        src={imagePreview}
                        alt={t('crop_preview_alt')}
                        width={600}
                        height={400}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <div className="text-center text-muted-foreground p-4 cursor-pointer" onClick={() => document.getElementById('crop-image')?.click()}>
                        <FileImage className="mx-auto h-12 w-12" />
                        <p className="mt-2">{t('upload_image_prompt')}</p>
                        <p className="text-xs">{t('upload_image_types')}</p>
                      </div>
                    )}
                  </div>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {isCameraOpen ? (
                      <>
                        <Button type="button" onClick={handleCapture} className="w-full">
                          <Camera className="mr-2 h-4 w-4" /> {t('capture_photo_button')}
                        </Button>
                        <Button type="button" variant="outline" onClick={stopVideoStream} className="w-full">
                           {t('cancel_button')}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button type="button" variant="outline" className="w-full" onClick={() => document.getElementById('crop-image')?.click()}>
                          <FileImage className="mr-2 h-4 w-4" />
                          {imagePreview ? t('change_image_button') : t('upload_image_button')}
                        </Button>
                        <Button type="button" className="w-full" onClick={handleCameraOpen} disabled={!hasCameraPermission}>
                          <Camera className="mr-2 h-4 w-4" />
                          {t('use_camera_button')}
                        </Button>
                      </>
                    )}
                   </div>
                   {hasCameraPermission === false && (
                    <Alert variant="destructive">
                      <AlertTitle>{t('camera_permission_denied_title')}</AlertTitle>
                      <AlertDescription>{t('camera_permission_denied_description')}</AlertDescription>
                    </Alert>
                   )}
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={isLoading || !imageFile || isCameraOpen}>
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  {isLoading ? t('diagnosing_button') : t('diagnose_disease_button')}
                </Button>
              </CardFooter>
            </form>
          </Card>
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>{t('diagnosis_result_title')}</CardTitle>
              <CardDescription>
                {t('diagnosis_result_description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              {isLoading && (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              )}
              {result && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-lg font-headline flex items-center gap-2 mb-1">
                      <Leaf className="h-5 w-5 text-primary" />
                      {t('identified_crop_label')}
                    </h3>
                    <p className="text-foreground/90">{result.cropName}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg font-headline mb-1">{t('disease_pest_label')}</h3>
                    <p className="text-foreground/90">{result.disease}</p>
                  </div>
                   <div>
                    <h3 className="font-semibold text-lg font-headline flex items-center gap-2 mb-1">
                      <BarChart className="h-5 w-5 text-primary" />
                      {t('severity_label')}
                    </h3>
                    <Badge variant={result.severity.toLowerCase() === 'high' ? 'destructive' : result.severity.toLowerCase() === 'medium' ? 'secondary' : 'default'}>{result.severity}</Badge>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg font-headline flex items-center gap-2 mb-1">
                      <Siren className="h-5 w-5 text-destructive" />
                      {t('immediate_steps_label')}
                    </h3>
                    <p className="text-foreground/90 whitespace-pre-wrap">{result.immediateSteps}</p>
                  </div>

                  <Tabs defaultValue="remedies" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="remedies">{t('general_tab')}</TabsTrigger>
                      <TabsTrigger value="organic">{t('organic_tab')}</TabsTrigger>
                      <TabsTrigger value="chemical">{t('chemical_tab')}</TabsTrigger>
                    </TabsList>
                    <TabsContent value="remedies" className="mt-4 space-y-2">
                       <h3 className="font-semibold text-lg font-headline flex items-center gap-2 mb-1">
                          <Pill className="h-5 w-5 text-primary" />
                          {t('suggested_remedies_label')}
                        </h3>
                       <p className="text-foreground/90 whitespace-pre-wrap">{result.remedies}</p>
                    </TabsContent>
                    <TabsContent value="organic" className="mt-4">
                       <h3 className="font-semibold text-lg font-headline flex items-center gap-2 mb-1">
                          <TreeDeciduous className="h-5 w-5 text-primary" />
                          {t('organic_remedies_label')}
                        </h3>
                       <p className="text-foreground/90 whitespace-pre-wrap">{result.organicRemedies}</p>
                    </TabsContent>
                     <TabsContent value="chemical" className="mt-4">
                       <h3 className="font-semibold text-lg font-headline flex items-center gap-2 mb-1">
                          <TestTube className="h-5 w-5 text-primary" />
                          {t('chemical_remedies_label')}
                        </h3>
                       <p className="text-foreground/90 whitespace-pre-wrap">{result.chemicalRemedies}</p>
                    </TabsContent>
                  </Tabs>

                  <div>
                    <h3 className="font-semibold text-lg font-headline flex items-center gap-2 mb-1">
                      <Shield className="h-5 w-5 text-primary" />
                      {t('preventive_measures_label')}
                    </h3>
                    <p className="text-foreground/90 whitespace-pre-wrap">{result.preventiveMeasures}</p>
                  </div>
                </div>
              )}
              {!isLoading && !result && (
                <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
                  <Image src="https://placehold.co/600x400.png" alt={t('diagnosis_placeholder_alt')} data-ai-hint="agronomist plant" width={300} height={200} className="rounded-lg opacity-50"/>
                  <p className="mt-4">{t('diagnosis_placeholder_text')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
