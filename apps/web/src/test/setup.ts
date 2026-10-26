import '@testing-library/jest-dom/vitest';

vi.stubGlobal(
  'fetch',
  vi.fn(async () => ({
    ok: true,
    json: async () => [],
    text: async () => '',
  })),
);
