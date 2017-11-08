import { ComponentBuilder, Component, EventHub } from '@cryptographix/sim-core';
import { Kind, KindConstructor, KindBuilder, Direction, Protocol } from '@cryptographix/sim-core';


export class SecretKeyGenerator extends EventHub implements Component {

}

class SecretKeyGeneratorConfig {

}
new KindBuilder(SecretKeyGeneratorConfig, 'Parameters for SymmetricSigner')
  .enumField('algo', 'Signing Algorithm', { 1: 'AES-CBC-MAC', 2: 'DES-CBC-MAC' });

new ComponentBuilder(SecretKeyGenerator, 'EMV Host', 'Generate or build a secret cryptographic key', 'payments', )
  .config(SecretKeyGeneratorConfig)
  .port('key', 'Cryptographic Key', Direction.OUT, { required: true })
  ;
