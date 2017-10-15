import { Graph } from '@cryptographix/sim-core';

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
  public origin: string;

  private library: boolean;
  private graph: Graph;
  private changed: boolean;

  constructor(origin: string) {
    this.origin = origin;

    this.library = false;

    this.setGraph(new Graph(null));

    this.changed = false;
  }

  private setGraph(graph: Graph) {
    this.graph = graph;

    //    graph.subscribe( Graph.)
  }

  static fromJSON(origin: string, data: {}): Project {
    let project = new Project(origin);

    return project;
  }

  toJSON(): string {
    return '';
  }

  getGraph(): Graph {
    return this.graph;
  }

  get isLibrary() {
    return this.library;
  }

  get hasChanged() {
    return this.changed;
  }

}


export class DataLibrary extends Map<string, Object> {

}
