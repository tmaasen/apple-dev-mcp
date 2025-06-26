// Mock for playwright
export const chromium = {
  launch: jest.fn(async (_options?: any) => {
    return {
      newPage: jest.fn(async (_options?: any) => {
        return {
          goto: jest.fn(async (_url: string, _options?: any) => {
            return Promise.resolve();
          }),
          title: jest.fn(async () => {
            return "Mocked Page Title";
          }),
          content: jest.fn(async () => {
            return "<html><body>Mocked content</body></html>";
          }),
          $$eval: jest.fn(async (_selector: string, _fn: Function) => {
            return [];
          }),
          waitForLoadState: jest.fn(async (_state: string, _options?: any) => {
            return Promise.resolve();
          }),
          close: jest.fn(async () => {
            return Promise.resolve();
          })
        };
      }),
      close: jest.fn(async () => {
        return Promise.resolve();
      })
    };
  })
};