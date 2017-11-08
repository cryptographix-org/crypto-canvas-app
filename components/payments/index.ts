import { ComponentPackage, ComponentLibrary } from '@shared';
import { ComponentBuilder, Component, ComponentConstructor, EventHub } from '@cryptographix/sim-core';

import { SecretKeyEncryptor as EMVTerminal } from './emv-terminal';
import { SecretKeySigner as EMVCard } from './emv-card';
import { SecretKeyGenerator as EMVHost } from './emv-host';

export default class PaymentPackage implements ComponentPackage {
  constructor(library: ComponentLibrary) {
    console.log("Library constructor: " + JSON.stringify(library));

    library.register(EMVTerminal);
    library.register(EMVCard);
    library.register(EMVHost);
  }
}
