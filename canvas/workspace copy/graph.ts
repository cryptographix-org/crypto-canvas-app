export class Graph {
  nodes: Map<string, Node>;
  links: Map<string, Link>;

  constructor() {
    this.nodes = new Map<string, Node>();
    testNodes.forEach((node) => {
      this.nodes.set(node.id, node);
    });

    this.links = new Map<string, Link>();
    testLinks.forEach((link) => {
      let id = link.fromNode + ":" + link.fromPort + ":" + link.toNode + ":" + link.toPort;

      this.links.set(id, link);
    });

  }
}

export class Node {
  id: string;
  view: {
    x: number;
    y: number;
    w: number;
    h: number;
    icon_url: string;
    colour: string;
  };

  description: string;
  outputs?: number;
  inputs?: number;
  type?: string;
}

export class Link {
  fromNode: string;
  fromPort: number;
  toNode: string;
  toPort: number;
}


let testNodes: Node[] = [
  {
    id: 'node-1111',
    view: {
      x: 220, y: 185,
      w: 180, h: 30,
      icon_url: 'icons/node-red/inject.png',
      colour: "#53A3F3",
    },
    description: 'Fire every 5 seconds ↻',
    inputs: 1,
    outputs: 5,
  },
  {
    id: 'node-2222',
    view: {
      x: 500, y: 185,
      w: 200, h: 30,
      icon_url: 'icons/node-red/inject.png',
      colour: "#898989",
    },
    description: 'Test Node 2',
    inputs: 1,
    outputs: 5,
  }
];

const testLinks: Link[] = [
  {
    fromNode: testNodes[0].id,
    fromPort: 0,
    toNode: testNodes[1].id,
    toPort: 0,
  }
];
