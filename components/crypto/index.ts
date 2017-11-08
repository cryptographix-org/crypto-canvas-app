import { ComponentPackage, ComponentLibrary } from '@shared';
import { ComponentBuilder, Component, ComponentConstructor, EventHub } from '@cryptographix/sim-core';

import { SecretKeyEncryptor } from './secret-key-encryptor';
import { SecretKeySigner, SecretKeySignatureVerifier } from './secret-key-signer';
import { SecretKeyGenerator } from './secret-key-generator';

export default class CryptoPackage implements ComponentPackage {
  constructor(library: ComponentLibrary) {
    console.log("Library constructor: " + JSON.stringify(library));

    library.register(SecretKeyEncryptor);
    library.register(SecretKeySigner);
    library.register(SecretKeySignatureVerifier);
    library.register(SecretKeyGenerator);
  }
}
