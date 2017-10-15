import { Project } from './project';

export class ProjectStore {
  projects: Map<string, Project>;

  constructor() {
    this.projects = new Map<string, Project>();
  }

  addProject(project: Project) {
    this.projects.set(project.origin, project);
  }

  get(origin: string): Project {
    return this.projects.get(origin);
  }


}
