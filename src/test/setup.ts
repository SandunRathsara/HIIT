import '@testing-library/jest-dom'

// Polyfill ResizeObserver for jsdom (used by Radix UI Slider)
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
