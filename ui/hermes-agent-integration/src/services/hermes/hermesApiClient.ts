const BASE_URL = 'http://localhost:8000'; // Replace with env/config

export class HermesApiClient {
  static async get(endpoint: string) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`);
      if (!response.ok) {
        throw new Error(`Hermes API error: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error(`Hermes API GET ${endpoint} failed:`, error);
      throw error;
    }
  }

  static async post(endpoint: string, data: any) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error(`Hermes API error: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error(`Hermes API POST ${endpoint} failed:`, error);
      throw error;
    }
  }

  static async sendMessage(message: string, sessionId?: string) {
    return this.post('/message', { message, session_id: sessionId });
  }

  static async getStatus() {
    return this.get('/status');
  }

  static async getSkills() {
    return this.get('/skills');
  }

  static async getMemory() {
    return this.get('/memory');
  }

  static async createTask(taskDefinition: any) {
    return this.post('/tasks', taskDefinition);
  }
}
