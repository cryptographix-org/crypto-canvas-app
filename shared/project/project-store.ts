import { Project } from './project';

export class ProjectStore {
  projects: Map<URL, Project>;

  constructor() {
    this.projects = new Map<URL, Project>();
  }

  addProject(project: Project) {
    this.projects.set(project.origin, project);
  }

  get(origin: string): Project {
    return this.projects.get(new URL(origin));
  }


}
