import { ComponentLibrary } from './component-library';

/**
 * Component Package
**/

export interface ComponentPackageConstructor {
  new(registry: ComponentLibrary, url: URL): ComponentPackage;
}

export interface ComponentPackage {

}
