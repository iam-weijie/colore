// components/TextLocalized.tsx
import React from 'react';
import { Text, TextProps } from 'react-native';
import { useTranslation } from 'react-i18next';

type Props = TextProps & {
  children: string; // used as the translation key
  values?: Record<string, string | number>;
  className?: string; // Tailwind styles (NativeWind)
};

export const TextLocalized = ({ children, values, className, ...rest }: Props) => {
  const { t } = useTranslation();

  return (
    <Text className={className} {...rest}>
      {t(children, values)}
    </Text>
  );
};
