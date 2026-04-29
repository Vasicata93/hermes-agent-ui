export class RailwayDeployer {
  private token: string;
  private readonly apiUrl = "https://backboard.railway.app/graphql/v2";

  constructor(token: string) {
    this.token = token;
  }

  private async request(query: string, variables: any = {}) {
    const res = await fetch(this.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!res.ok) {
      throw new Error(`Railway API Error: ${res.statusText}`);
    }

    const data = await res.json();
    if (data.errors) {
      throw new Error(data.errors[0].message);
    }

    return data.data;
  }

  async createProject(name: string): Promise<string> {
    const query = `
      mutation CreateProject($name: String!) {
        projectCreate(input: { name: $name, description: "Hermes Agent Backend" }) {
          id
        }
      }
    `;
    const data = await this.request(query, { name });
    return data.projectCreate.id;
  }

  async createEnvironment(projectId: string, name: string): Promise<string> {
    const query = `
      mutation CreateEnvironment($projectId: String!, $name: String!) {
        environmentCreate(input: { projectId: $projectId, name: $name }) {
          id
        }
      }
    `;
    const data = await this.request(query, { projectId, name });
    return data.environmentCreate.id;
  }

  async createService(projectId: string, repoUrl: string): Promise<string> {
    const query = `
      mutation CreateService($projectId: String!, $repoUrl: String!) {
        serviceCreate(input: { 
          projectId: $projectId, 
          source: { repo: $repoUrl } 
        }) {
          id
        }
      }
    `;
    const data = await this.request(query, { projectId, repoUrl });
    return data.serviceCreate.id;
  }

  async upsertVariables(projectId: string, environmentId: string, serviceId: string, variables: Record<string, string>) {
    const query = `
      mutation UpsertVariables($projectId: String!, $environmentId: String!, $serviceId: String!, $variables: JSONObject!) {
        variableCollectionUpsert(input: {
          projectId: $projectId,
          environmentId: $environmentId,
          serviceId: $serviceId,
          variables: $variables
        })
      }
    `;
    await this.request(query, { projectId, environmentId, serviceId, variables });
  }

  async deploy(projectId: string, environmentId: string, serviceId: string) {
    const query = `
      mutation ServiceInstanceUpdate($serviceId: String!, $environmentId: String!) {
        serviceInstanceUpdate(
          serviceId: $serviceId
          environmentId: $environmentId
          input: {
            startCommand: "python gateway/run.py",
            rootDirectory: "/hermes_cli"
          }
        )
      }
    `;
    await this.request(query, { serviceId, environmentId });
  }
}
