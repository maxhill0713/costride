import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';

export default function LanguageSelector() {
  const { i18n, t } = useTranslation();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'es', name: 'Español', flag: '🇪🇸' }
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  if (isMobile) {
    return (
      <Drawer>
        <DrawerTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Globe className="w-4 h-4" />
            <span>{currentLanguage.flag} {currentLanguage.name}</span>
          </Button>
        </DrawerTrigger>
        <DrawerContent className="pb-[env(safe-area-inset-bottom)]">
          <DrawerHeader>
            <DrawerTitle>Choose Language</DrawerTitle>
            <DrawerDescription>Select your preferred language</DrawerDescription>
          </DrawerHeader>
          <div className="p-4 space-y-2">
            {languages.map((lang) => (
              <Button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                variant={i18n.language === lang.code ? 'default' : 'outline'}
                className="w-full justify-start gap-2 h-14 text-base"
              >
                <span className="text-2xl">{lang.flag}</span>
                {lang.name}
              </Button>
            ))}
          </div>
          <DrawerFooter className="pb-4">
            <DrawerClose asChild>
              <Button variant="outline">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Globe className="w-4 h-4" />
          <span>{currentLanguage.flag} {currentLanguage.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={i18n.language === lang.code ? 'bg-slate-100' : ''}
          >
            <span className="mr-2">{lang.flag}</span>
            {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}