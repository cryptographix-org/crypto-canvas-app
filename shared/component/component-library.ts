import { EventHub } from '@cryptographix/sim-core';
import { ComponentRegistry, ComponentDefinition } from './component-registry';
import { ComponentPackage, ComponentPackageConstructor } from './component-package';
import { ComponentConstructor } from '@cryptographix/sim-core';

/**
 * ComponentLibrary
 *
 * A ComponentLibrary is a collection of components, that may either
**/
export class ComponentLibrary extends EventHub {
  static LIBRARY_UPDATED_EVENT = "library:updated";

  registry: Map<string, ComponentDefinition>;

  modules: Map<string, any> = new Map<string, any>();
  sources: string[] = [];

  constructor(public origin?: URL) {
    super();

    this.registry = new Map<string, ComponentDefinition>();
  }

  get loaded(): boolean {
    return (this.modules.size != 0);
  }

  importPackage(from: URL): Promise<ComponentPackageConstructor> {
    return new Promise<ComponentPackageConstructor>((resolve, reject) => {
      switch (from.pathname) {
        case '/crypto':
          return import('../../components/crypto/index')
            .then((module) => {
              resolve(module.default as any as ComponentPackageConstructor);
            });
        case '/payments':
          return import('../../components/payments/index')
            .then((module) => {
              resolve(module.default as any as ComponentPackageConstructor);
            });
        default:
          reject("Unknown package: " + from.pathname);
      }
    });
  }

  loadModules(): Promise<void> {
    return this.importPackage(this.origin)
      .then((pack) => {
        this.modules.set(this.origin.toString(), pack);

        new pack(this, this.origin);

        this.publish(ComponentLibrary.LIBRARY_UPDATED_EVENT, pack);
      });
  }

  register(ctor: ComponentConstructor) {
    this.registry.set(ctor.componentInfo.name, new ComponentDefinition(ctor));
  }
}
