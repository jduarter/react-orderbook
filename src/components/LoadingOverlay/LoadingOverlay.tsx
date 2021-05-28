import React from 'react';
import { View, Image, Modal, StyleSheet } from 'react-native';

import type { LoadingOverlayProps } from './types';

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  animationType = 'fade',
  visible,
}) => {
  return (
    <Modal
      animationType={animationType}
      transparent
      visible={visible}
      statusBarTranslucent={true}>
      <View style={styles.wrapper}>
        <View style={styles.imageWrapper}>
          <Image
            style={styles.image}
            source={
              // eslint-disable-next-line unicorn/prefer-module
              require('./assets/loading.gif')
            }
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
  },
  imageWrapper: {
    width: 125,
    height: 125,
    backgroundColor: '#fff',
    borderRadius: 15,
    position: 'absolute',
    left: '50%',
    top: '50%',
    marginLeft: -65,
    marginTop: -65,
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 15,
    position: 'relative',
    left: '50%',
    marginLeft: -60,
    top: '50%',
    marginTop: -60,
  },
});

export default LoadingOverlay;
