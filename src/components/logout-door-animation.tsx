import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function LogoutDoorAnimation() {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 1900,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [progress]);

  const portalScale = progress.interpolate({
    inputRange: [0, 0.25, 0.7, 1],
    outputRange: [0.1, 1, 1.15, 0],
  });

  const portalOpacity = progress.interpolate({
    inputRange: [0, 0.15, 0.75, 1],
    outputRange: [0, 1, 1, 0],
  });

  const rotation = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '300deg'],
  });

  const personX = progress.interpolate({
    inputRange: [0, 0.35, 0.7, 1],
    outputRange: [0, 85, 135, 135],
  });

  const personScale = progress.interpolate({
    inputRange: [0, 0.55, 0.85, 1],
    outputRange: [1, 1, 0.1, 0],
  });

  const personOpacity = progress.interpolate({
    inputRange: [0, 0.75, 0.9, 1],
    outputRange: [1, 1, 0, 0],
  });

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>
        <Text style={styles.orange}>X_</Text>App
      </Text>

      <View style={styles.scene}>
        <Animated.View
          style={[
            styles.portalGlow,
            {
              opacity: portalOpacity,
              transform: [{ scale: portalScale }],
            },
          ]}
        />

        <Animated.View
          style={[
            styles.portalOuter,
            {
              opacity: portalOpacity,
              transform: [
                { scale: portalScale },
                { rotate: rotation },
              ],
            },
          ]}
        >
          <View style={styles.portalInnerRing} />
          <View style={styles.portalCore} />
        </Animated.View>

        <Animated.View
          style={[
            styles.stickman,
            {
              opacity: personOpacity,
              transform: [
                { translateX: personX },
                { scale: personScale },
              ],
            },
          ]}
        >
          <View style={styles.head} />
          <View style={styles.body} />
          <View style={styles.armLeft} />
          <View style={styles.armRight} />
          <View style={styles.legLeft} />
          <View style={styles.legRight} />
        </Animated.View>
      </View>

      <Text style={styles.message}>See you on the other side!</Text>
      <Text style={styles.subtitle}>Leaving X_App...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090909',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brand: {
    color: '#F5F5F5',
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 65,
  },
  orange: {
    color: '#FF7417',
  },
  scene: {
    width: 280,
    height: 190,
    justifyContent: 'center',
    alignItems: 'center',
  },
  portalGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#FF7417',
    opacity: 0.25,
  },
  portalOuter: {
    position: 'absolute',
    width: 145,
    height: 145,
    borderRadius: 75,
    borderWidth: 8,
    borderColor: '#FF7417',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF7417',
    shadowOpacity: 1,
    shadowRadius: 25,
    elevation: 20,
  },
  portalInnerRing: {
    position: 'absolute',
    width: 112,
    height: 112,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#FF9A52',
  },
  portalCore: {
    width: 82,
    height: 82,
    borderRadius: 45,
    backgroundColor: '#71350F',
    opacity: 0.85,
  },
  stickman: {
    position: 'absolute',
    left: 5,
    bottom: 35,
    width: 45,
    height: 115,
    zIndex: 5,
  },
  head: {
    position: 'absolute',
    top: 0,
    left: 12,
    width: 23,
    height: 23,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#FF7417',
  },
  body: {
    position: 'absolute',
    top: 23,
    left: 22,
    width: 3,
    height: 43,
    backgroundColor: '#F5F5F5',
  },
  armLeft: {
    position: 'absolute',
    top: 32,
    left: 5,
    width: 20,
    height: 3,
    backgroundColor: '#F5F5F5',
    transform: [{ rotate: '-35deg' }],
  },
  armRight: {
    position: 'absolute',
    top: 32,
    left: 22,
    width: 20,
    height: 3,
    backgroundColor: '#F5F5F5',
    transform: [{ rotate: '35deg' }],
  },
  legLeft: {
    position: 'absolute',
    top: 62,
    left: 8,
    width: 27,
    height: 3,
    backgroundColor: '#F5F5F5',
    transform: [{ rotate: '55deg' }],
  },
  legRight: {
    position: 'absolute',
    top: 62,
    left: 19,
    width: 27,
    height: 3,
    backgroundColor: '#F5F5F5',
    transform: [{ rotate: '-55deg' }],
  },
  message: {
    color: '#F5F5F5',
    fontSize: 19,
    fontWeight: 'bold',
    marginTop: 35,
    textAlign: 'center',
  },
  subtitle: {
    color: '#929292',
    fontSize: 13,
    marginTop: 10,
  },
});
