'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Camera, FileImage, Loader2, Sparkles, Siren, Pill, BarChart } from 'lucide-react';

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
  const [language, setLanguage] = useState('en');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DiagnoseCropDiseaseOutput | null>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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
        title: 'No Image Selected',
        description: 'Please select an image of the crop to diagnose.',
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
          title: 'Diagnosis Failed',
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
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Crop Disease Diagnosis">
        <LanguageSwitcher language={language} onLanguageChange={setLanguage} />
      </PageHeader>
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>Upload Crop Image</CardTitle>
                <CardDescription>
                  Take a picture or upload an image of the affected plant.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Label htmlFor="crop-image" className="sr-only">
                    Crop Image
                  </Label>
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
                        alt="Crop preview"
                        width={600}
                        height={400}
                        className="h-full w-full object-contain rounded-lg"
                      />
                    ) : (
                      <div className="text-center text-muted-foreground">
                        <FileImage className="mx-auto h-12 w-12" />
                        <p className="mt-2">Click or tap to upload an image</p>
                        <p className="text-xs">PNG, JPG, WEBP supported</p>
                      </div>
                    )}
                  </div>
                   <Button type="button" variant="outline" className="w-full" onClick={() => document.getElementById('crop-image')?.click()}>
                      <Camera className="mr-2 h-4 w-4" />
                      {imagePreview ? 'Change Image' : 'Upload Image'}
                    </Button>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={isLoading || !imageFile}>
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  {isLoading ? 'Diagnosing...' : 'Diagnose Disease'}
                </Button>
              </CardFooter>
            </form>
          </Card>
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Diagnosis Result</CardTitle>
              <CardDescription>
                AI-powered analysis and suggested remedies.
              </CardDescription>
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
                    <h3 className="font-semibold text-lg font-headline mb-1">Disease/Pest</h3>
                    <p className="text-foreground/90">{result.disease}</p>
                  </div>
                   <div>
                    <h3 className="font-semibold text-lg font-headline flex items-center gap-2 mb-1">
                      <BarChart className="h-5 w-5" />
                      Severity
                    </h3>
                    <Badge variant={result.severity.toLowerCase() === 'high' ? 'destructive' : result.severity.toLowerCase() === 'medium' ? 'secondary' : 'default'}>{result.severity}</Badge>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg font-headline flex items-center gap-2 mb-1">
                      <Siren className="h-5 w-5" />
                      Immediate Steps
                    </h3>
                    <p className="text-foreground/90 whitespace-pre-wrap">{result.immediateSteps}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg font-headline flex items-center gap-2 mb-1">
                      <Pill className="h-5 w-5" />
                      Suggested Remedies
                    </h3>
                    <p className="text-foreground/90 whitespace-pre-wrap">{result.remedies}</p>
                  </div>
                </div>
              )}
              {!isLoading && !result && (
                <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
                  <Image src="https://placehold.co/600x400.png" alt="Doctor examining a plant" data-ai-hint="agronomist plant" width={300} height={200} className="rounded-lg opacity-50"/>
                  <p className="mt-4">Your diagnosis results will appear here.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
