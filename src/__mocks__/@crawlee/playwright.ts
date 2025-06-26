// Mock for @crawlee/playwright
export class PlaywrightCrawler {
  constructor(_config: any) {
    // Mock constructor
  }

  async run(_requests: any[]): Promise<void> {
    // Mock run method that resolves immediately
    return Promise.resolve();
  }

  async tearDown(): Promise<void> {
    // Mock teardown
    return Promise.resolve();
  }
}

export class Dataset {
  static async open(_name?: string): Promise<Dataset> {
    return new Dataset();
  }

  async pushData(_data: any): Promise<void> {
    return Promise.resolve();
  }

  async getData(): Promise<{ items: any[] }> {
    return { items: [] };
  }

  async drop(): Promise<void> {
    return Promise.resolve();
  }
}