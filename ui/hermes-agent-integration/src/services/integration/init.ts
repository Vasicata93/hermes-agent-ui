import { connectorManager } from './ConnectorManager';
import { skillManager } from './SkillManager';
import { githubConnector } from './connectors/githubConnector';
import { vercelConnector } from './connectors/vercelConnector';
import { googleWorkspaceConnector } from './connectors/googleConnector';
import { searchGithubRepositoriesSkill } from './skills/githubSkills';
import { listVercelDeploymentsSkill } from './skills/vercelSkills';
import { searchGoogleDriveSkill } from './skills/googleSkills';

export const initializeIntegrations = () => {
  // Register Connectors
  connectorManager.registerConnector(githubConnector);
  connectorManager.registerConnector(vercelConnector);
  connectorManager.registerConnector(googleWorkspaceConnector);
  
  // Register Skills
  skillManager.registerSkill(searchGithubRepositoriesSkill);
  skillManager.registerSkill(listVercelDeploymentsSkill);
  skillManager.registerSkill(searchGoogleDriveSkill);
  
  console.log('Integrations initialized.');
};
