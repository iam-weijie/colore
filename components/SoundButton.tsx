import React from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { useSettingsContext } from '@/app/contexts/SettingsContext';
import { useSoundEffects, SoundType } from '@/hooks/useSoundEffects';

interface SoundButtonProps extends TouchableOpacityProps {
  soundType?: SoundType;
  children: React.ReactNode;
}

/**
 * SoundButton - A button component that plays a sound effect when pressed
 * 
 * @param soundType - The type of sound to play (from SoundType enum)
 * @param onPress - Function to call when button is pressed
 * @param children - Child components
 * @param rest - Any other TouchableOpacity props
 */
const SoundButton: React.FC<SoundButtonProps> = ({ 
  soundType = SoundType.Button, 
  onPress, 
  children, 
  ...rest 
}) => {
  const { soundEffectsEnabled } = useSettingsContext();
  const { playSoundEffect } = useSoundEffects();

  const handlePress = (e: any) => {
    if (soundEffectsEnabled) {
      playSoundEffect(soundType);
    }
    
    if (onPress) {
      onPress(e);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      {...rest}
    >
      {children}
    </TouchableOpacity>
  );
};

export default SoundButton; 