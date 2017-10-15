import { PortInfo, ComponentInfo, ComponentFactory } from '@cryptographix/sim-core';

import * as CGX from '@cryptographix/sim-core';

export class PortDefinition extends PortInfo {
}

export class ComponentDefinition extends ComponentInfo {
  constructor(info: ComponentInfo) {
    super();

    let x = new ComponentFactory();

    if (info) {
      Object.assign(this, info);
    }
  }
}

export class ComponentRegistry {

  registry: Map<string, ComponentDefinition>;

  constructor() {
    this.registry = new Map<string, ComponentDefinition>();
  }

  register(definition: ComponentDefinition) {
    this.registry.set(definition.name, definition);

    definition;
  }

  get categories(): string[] {
    let categories = new Set<string>();

    this.registry.forEach((reg, key) => {
      categories.add(reg.category);
    });

    return Array.from(categories.values());
  }

  get definitions(): ComponentDefinition[] {
    return Array.from(this.registry.values());
  }

  get(name: string): ComponentDefinition {
    return this.registry.get(name);
  }
}


/**
 * Components
 * ----------
 *
 * A Component is a runtime structure that encapsules behaviour and data.
 *
 * A Node holds information about the Component that will be instantiated
 * when the node's Graph is executed. This information includes the Component's
 * name (path,name,version),
**/
