const Reanimated = {
  default: {
    call: jest.fn(),
    createAnimatedComponent: (component: unknown) => component,
    Value: jest.fn(),
    event: jest.fn(),
  },
  FadeIn: { duration: jest.fn().mockReturnThis() },
  FadeOut: { duration: jest.fn().mockReturnThis() },
  FadeInLeft: { delay: jest.fn().mockReturnThis(), springify: jest.fn().mockReturnThis() },
  FadeInRight: { delay: jest.fn().mockReturnThis(), springify: jest.fn().mockReturnThis() },
  SlideInDown: { delay: jest.fn().mockReturnThis(), springify: jest.fn().mockReturnThis() },
  SlideInRight: { delay: jest.fn().mockReturnThis(), springify: jest.fn().mockReturnThis() },
  SlideInUp: { delay: jest.fn().mockReturnThis(), springify: jest.fn().mockReturnThis() },
  Layout: { springify: jest.fn().mockReturnThis() },
  useAnimatedStyle: jest.fn((cb) => cb()),
  useSharedValue: jest.fn((val) => ({ value: val })),
  withSpring: jest.fn((val) => val),
  withTiming: jest.fn((val) => val),
  Easing: { bezier: jest.fn() },
};

module.exports = Reanimated;
