import React from 'react';
import type { FC } from 'react';
import { Text, TouchableOpacity, ViewStyle, StyleSheet } from 'react-native';

export interface GroupButtonProps {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
}

const GroupButton: FC<GroupButtonProps> = ({ title, onPress, style }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.defaultTouchableStyle, style]}>
      <Text style={styles.groupButtonDefaultStyle}>{title}</Text>
    </TouchableOpacity>
  );
};

export default GroupButton;

const styles = StyleSheet.create({
  defaultTouchableStyle: { minWidth: 44, minHeight: 44 },
  groupButtonDefaultStyle: { color: '#666', fontSize: 32 },
});
