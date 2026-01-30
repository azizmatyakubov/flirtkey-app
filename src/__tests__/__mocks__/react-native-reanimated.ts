import React from 'react';

// Simple passthrough component for Animated.View, Animated.Text, etc.
const createAnimatedComponent = (Component: React.ComponentType<any> | string) => {
  const AnimatedComponent = React.forwardRef((props: any, ref: any) =>
    React.createElement(Component, { ...props, ref })
  );
  AnimatedComponent.displayName = `Animated(${typeof Component === 'string' ? Component : Component.displayName || 'Unknown'})`;
  return AnimatedComponent;
};

const Animated = {
  View: createAnimatedComponent('View'),
  Text: createAnimatedComponent('Text'),
  Image: createAnimatedComponent('Image'),
  ScrollView: createAnimatedComponent('ScrollView'),
  FlatList: createAnimatedComponent('FlatList'),
  createAnimatedComponent,
};

const Reanimated = {
  __esModule: true,
  default: Animated,
  ...Animated,
  FadeIn: {
    duration: jest.fn().mockReturnThis(),
    delay: jest.fn().mockReturnThis(),
    springify: jest.fn().mockReturnThis(),
  },
  FadeOut: { duration: jest.fn().mockReturnThis(), delay: jest.fn().mockReturnThis() },
  FadeInLeft: { delay: jest.fn().mockReturnThis(), springify: jest.fn().mockReturnThis() },
  FadeInRight: { delay: jest.fn().mockReturnThis(), springify: jest.fn().mockReturnThis() },
  FadeInDown: { delay: jest.fn().mockReturnThis(), springify: jest.fn().mockReturnThis() },
  FadeInUp: { delay: jest.fn().mockReturnThis(), springify: jest.fn().mockReturnThis() },
  SlideInDown: { delay: jest.fn().mockReturnThis(), springify: jest.fn().mockReturnThis() },
  SlideInRight: { delay: jest.fn().mockReturnThis(), springify: jest.fn().mockReturnThis() },
  SlideInUp: { delay: jest.fn().mockReturnThis(), springify: jest.fn().mockReturnThis() },
  SlideOutUp: { delay: jest.fn().mockReturnThis(), springify: jest.fn().mockReturnThis() },
  Layout: { springify: jest.fn().mockReturnThis(), delay: jest.fn().mockReturnThis() },
  ZoomIn: { duration: jest.fn().mockReturnThis(), delay: jest.fn().mockReturnThis() },
  ZoomOut: { duration: jest.fn().mockReturnThis(), delay: jest.fn().mockReturnThis() },
  BounceIn: { duration: jest.fn().mockReturnThis(), delay: jest.fn().mockReturnThis() },
  useAnimatedStyle: jest.fn((cb: () => any) => cb()),
  useSharedValue: jest.fn((val: any) => ({ value: val })),
  useDerivedValue: jest.fn((cb: () => any) => ({ value: cb() })),
  useAnimatedGestureHandler: jest.fn(),
  withSpring: jest.fn((val: any) => val),
  withTiming: jest.fn((val: any, _config?: any, callback?: (finished: boolean) => void) => {
    if (callback) callback(true);
    return val;
  }),
  withSequence: jest.fn((...args: any[]) => args[args.length - 1]),
  withDelay: jest.fn((_delay: number, val: any) => val),
  withRepeat: jest.fn((val: any) => val),
  cancelAnimation: jest.fn(),
  runOnJS: jest.fn((fn: Function) => fn),
  runOnUI: jest.fn((fn: Function) => fn),
  Easing: {
    bezier: jest.fn(() => jest.fn()),
    linear: jest.fn(),
    ease: jest.fn(),
    in: jest.fn(() => jest.fn()),
    out: jest.fn(() => jest.fn()),
    inOut: jest.fn(() => jest.fn()),
    quad: jest.fn(),
    cubic: jest.fn(),
    circle: jest.fn(),
    exp: jest.fn(),
    bounce: jest.fn(),
    back: jest.fn(),
    elastic: jest.fn(),
    sin: jest.fn(),
    poly: jest.fn(),
  },
  Extrapolation: { CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity' },
  interpolate: jest.fn((val: number) => val),
};

module.exports = Reanimated;
