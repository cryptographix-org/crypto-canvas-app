import { ComponentBuilder, Component, EventHub } from '@cryptographix/sim-core';
import { Kind, KindConstructor, KindBuilder, Direction, Protocol } from '@cryptographix/sim-core';


export class SecretKeySigner extends EventHub implements Component {

}

class SecretKeySignerConfig {

}

new KindBuilder(SecretKeySignerConfig, 'Parameters for SymmetricSigner')
  .enumField('algo', 'Signing Algorithm', { 1: 'AES-CBC-MAC', 2: 'DES-CBC-MAC' })
  ;

new ComponentBuilder(SecretKeySigner, 'SecretKey Signer', 'Cryptographically sign messages using secret-key (symmetric) algorithms such as AES and DES', 'crypto', )
  .config(SecretKeySignerConfig)
  .port('in', 'Input data to be signed', Direction.IN, { required: true })
  .port('key', 'Signing Key, used to sign input data', Direction.IN, { required: true })
  //.port('out', 'Signature', Direction.IN, { required: true, protocol: new Protocol<CryptoKey>() })
  ;




export class SecretKeySignatureVerifier extends EventHub implements Component {

}

class SecretKeySignatureVerifierConfig {

}

new KindBuilder(SecretKeySignerConfig, 'Parameters for SecretKeySignatureVerifier')
  .enumField('algo', 'Signing Algorithm', { 1: 'AES-CBC-MAC', 2: 'DES-CBC-MAC' })
  ;

new ComponentBuilder(SecretKeySignatureVerifier, 'SecretKey Signature Verifier', 'Verify Cryptographically signed messages using secret-key (symmetric) algorithms such as AES and DES', 'crypto', )
  .config(SecretKeySignatureVerifierConfig)
  .port('in', 'Input data to be verified', Direction.IN, { required: true })
  .port('signature', 'Symmetric Signature to be verified', Direction.IN, { required: true })
  //.port('out', 'Signature', Direction.IN, { required: true, protocol: new Protocol<CryptoKey>() })
  ;
