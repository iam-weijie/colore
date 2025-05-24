// components/TextLocalized.tsx
import React from 'react';
import { Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { TextProps } from 'react-native';

type Props = TextProps & {
  tKey: string;
  values?: Record<string, string | number>;
  className?: string; // Enable tailwind styles
};

export const TextLocalized = ({ tKey, values, className, ...rest }: Props) => {
  const { t } = useTranslation();

  return (
    <Text className={className} {...rest}>
      {t(tKey, values)}
    </Text>
  );
};
