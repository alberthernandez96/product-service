import { Application } from './Application';
import { Infrastructure } from './Infrastructure';

export class Server {
  private application?: Application;
  private infrastructure: Infrastructure;

  constructor() {
    this.infrastructure = new Infrastructure();
  }

  async start(): Promise<void> {
    try {
      console.log('Initializing infrastructure...');
      await this.infrastructure.initialize();
      console.log('Initializing application...');
      this.application = new Application(this.infrastructure);
      console.log('Starting application...');
      await this.application.start();
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  async shutdown(): Promise<void> {
    if (this.application) {
      await this.application.shutdown();
    }
    await this.infrastructure.shutdown();
  }
}

export { Application, Infrastructure };
