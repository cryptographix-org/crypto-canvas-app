import { Graph } from '@cryptographix/sim-core';
import { ComponentLibrary } from '@shared';

export class ProjectMetadata {

}

/**
 * Project
 *
 * A Project may include :
 *   a graph of Nodes and Links
 *   a set of DataStores
 *   a library of Components
 *   a Story
**/
export class Project {

  private library: ComponentLibrary;
  private graph: Graph;
  private changed: boolean;

  constructor(public origin: URL) {
    //this.library = new ComponentLibrary();

    this.setGraph(new Graph(null));

    this.changed = false;
  }

  private setGraph(graph: Graph) {
    this.graph = graph;

    //    graph.subscribe( Graph.)
  }

  static fromJSON(origin: URL, data: {}): Project {
    let project = new Project(origin);

    return project;
  }

  toJSON(): string {
    return '';
  }

  getGraph(): Graph {
    return this.graph;
  }

  get isLibrary(): boolean {
    return !!this.library;
  }

  get hasChanged() {
    return this.changed;
  }

}


export class DataLibrary extends Map<string, Object> {

}
