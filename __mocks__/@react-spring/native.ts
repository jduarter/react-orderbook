//@ts-ignore

jest.mock('@react-spring/native', () => ({
  useTransition: jest.fn(),
  animated: jest.fn(),
  config: jest.fn(),
}));
