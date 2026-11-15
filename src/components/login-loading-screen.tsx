import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

const ORANGE = '#FF7417';

export default function LoginLoadingScreen() {
  const dots = useRef([
    new Animated.Value(0.55),
    new Animated.Value(0.55),
    new Animated.Value(0.55),
  ]).current;

  useEffect(() => {
    const animations = dots.map((dot, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 160),
          Animated.timing(dot, {
            toValue: 1.35,
            duration: 360,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.55,
            duration: 360,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.delay(180),
        ])
      )
    );
    animations.forEach((animation) => animation.start());
    return () => animations.forEach((animation) => animation.stop());
  }, [dots]);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}><Text style={styles.logoAccent}>X_</Text><Text style={styles.logoRest}>App</Text></Text>
      <View style={styles.dots}>
        {dots.map((dot, index) => (
          <Animated.View key={index} style={[styles.dot, { transform: [{ scale: dot }] }]} />
        ))}
      </View>
      <Text style={styles.message}>Getting things ready...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090909', alignItems: 'center', justifyContent: 'center' },
  logo: { fontSize: 34, fontWeight: '900', letterSpacing: 0.4 },
  logoAccent: { color: ORANGE },
  logoRest: { color: '#F5F5F5' },
  dots: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 13, marginTop: 30, height: 22 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: ORANGE },
  message: { color: '#929292', fontSize: 13, marginTop: 20, letterSpacing: 0.5 },
});
