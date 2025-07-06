'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Languages } from 'lucide-react';

type LanguageSwitcherProps = {
  language: string;
  onLanguageChange: (lang: string) => void;
  className?: string;
};

export function LanguageSwitcher({
  language,
  onLanguageChange,
  className,
}: LanguageSwitcherProps) {
  return (
    <div className={className}>
      <Select value={language} onValueChange={onLanguageChange}>
        <SelectTrigger className="w-auto gap-2">
          <Languages className="h-4 w-4" />
          <SelectValue placeholder="Language" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en">English</SelectItem>
          <SelectItem value="kn">ಕನ್ನಡ (Kannada)</SelectItem>
          <SelectItem value="hi">हिन्दी (Hindi)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
