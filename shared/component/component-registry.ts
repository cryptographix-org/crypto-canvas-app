import { EventHub } from '@cryptographix/sim-core';

import { PortInfo, ComponentInfo, ComponentConstructor } from '@cryptographix/sim-core';
import { ComponentLibrary } from './component-library';

//import * as CGX from '@cryptographix/sim-core';

export class PortDefinition extends PortInfo {
}

export class ComponentDefinition extends ComponentInfo {
  static nextID = 1;

  constructor(ctor: ComponentConstructor) {
    super();

    if (ctor) {
      Object.assign(this, ctor.componentInfo);
      this.ctor = ctor;

      // Attribute a unique number and ID
      this.id = "$comp-" + (ComponentDefinition.nextID++);
    }
  }

  ctor: ComponentConstructor;

  id: string;

  meta: {
    iconURL?: string;
  }
}

export class ComponentRegistry extends EventHub {
  static LIBRARY_UPDATED_EVENT = "library:updated";

  registry: Map<any, ComponentLibrary>;

  constructor() {
    super();

    this.registry = new Map<any, ComponentLibrary>();
  }

  register(library: ComponentLibrary) {
    this.registry.set(library, library);

    library.subscribe(ComponentLibrary.LIBRARY_UPDATED_EVENT, () => {
      this.publish(ComponentRegistry.LIBRARY_UPDATED_EVENT, library)
    })
  }

  unregister(library: ComponentLibrary) {
    this.registry.delete(library);
  }

  get categories(): string[] {
    let categories = new Set<string>();

    this.registry.forEach((library) => {
      library.registry.forEach((reg, key) => {
        categories.add(reg.category);
      })
    });

    return Array.from(categories.values());
  }

  get definitions(): ComponentDefinition[] {
    let definitions = new Set<ComponentDefinition>();

    this.registry.forEach((library) => {
      library.registry.forEach((definition, key) => {
        definition.meta = { iconURL: 'static/images/tools.png' };

        definitions.add(definition);
      })
    });

    return Array.from(definitions.values());
  }

  getByID(id: string): ComponentDefinition {
    let definition;

    this.registry.forEach((library) => {
      if (!definition) {
        library.registry.forEach((defn) => {
          if (defn.id == id)
            definition = defn;
        })
      }
    });

    return definition;
  }

  getByName(name: string): ComponentDefinition {
    let definition;

    this.registry.forEach((library) => {
      if (!definition)
        definition = library.registry.get(name);
    });

    return definition;
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
