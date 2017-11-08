import { ComponentBuilder, Component, ComponentConstructor, EventHub } from '@cryptographix/sim-core';
import { EndPoint, Direction, Message, ByteArray } from '@cryptographix/sim-core';
import * as CGX from '@cryptographix/sim-core';

import { Kind, KindBuilder } from '@cryptographix/sim-core';

export class SecretKeyEncryptor extends EventHub implements Component {
  private _key: CryptoKey;

  private _cryptoProvider: CGX.CryptographicServiceProvider;
  constructor(cryptoProvider: CGX.CryptographicServiceProvider) {
    super();

    this._cryptoProvider = cryptoProvider;

    cryptoProvider.registry.setKeyService("AES-CBC", CGX.WebCryptoService,
      [CGX.CryptographicOperation.IMPORT_KEY]);

    this._properties = {
      op: 'encrypt',
      algorithm: 'DES-ECB',
      iv: null
    };
  }

  private _dataIn: EndPoint;
  private _dataOut: EndPoint;
  private _keyIn: EndPoint;

  private _data;

  icon: string = "lock";

  private _properties: {
    op: string,
    algorithm: string,
    iv: ByteArray
  };

  setAlgorithm(op: string, algo: string, iv: ByteArray) {
    let prevAlgo = this._properties.algorithm;

    this._properties = {
      op,
      algorithm: algo,
      iv
    };

    // redo enc
    this.handleDataIn(this._data);
  }

  handleDataIn(data: ByteArray) {
    let ep = this._dataOut;

    this._data = data;

    if (this._key && this._data) {
      // TS need an 'extends Interface' for object literals.
      // For now, we use a 'type-assertion' on call to encrypt, to coerce to 'Algorithm'
      let algo = {
        name: this._properties.algorithm,
        iv: this._properties.iv
      };

      if (this._properties.op == 'encrypt') {
        this._cryptoProvider.encrypt(algo as Algorithm, this._key, data)
          .then((cipherText: ByteArray) => {
            let msg = new Message<ByteArray>({}, cipherText);
            ep.sendMessage(msg);
          });
      }
      else if (this._properties.op == 'decrypt') {
        this._cryptoProvider.decrypt(algo as Algorithm, this._key, data)
          .then((plainText: ByteArray) => {
            let msg = new Message<ByteArray>({}, plainText);
            ep.sendMessage(msg);
          });
      }
      else if (this._properties.op == 'digest') {
        this._cryptoProvider.digest(algo as Algorithm, data)
          .then((digest: ByteArray) => {
            let msg = new Message<ByteArray>({}, digest);
            ep.sendMessage(msg);
          });
      }
      else if (this._properties.op == 'sign') {
        this._cryptoProvider.sign(algo as Algorithm, this._key, data)
          .then((signature: ByteArray) => {
            let msg = new Message<ByteArray>({}, signature);
            ep.sendMessage(msg);
          });
      }
    }
  }

  initialize(config): EndPoint[] {

    let me = this;

    // init EndPoints
    this._dataIn = new EndPoint('plaintext', Direction.IN, (msg: Message<ByteArray>) => {
      console.log('got data')
      me.handleDataIn(msg.payload);
    });

    this._keyIn = new EndPoint('key', Direction.IN, (msg: Message<CryptoKey>) => {
      console.log('got key')
      me._key = msg.payload;
      me.handleDataIn(me._data);
    });

    this._dataOut = new EndPoint('ciphertext', Direction.OUT);

    // and return collection
    return [this._dataIn, this._keyIn, this._dataOut];
  }

  teardown() {
    this._dataIn.detachAll();
    this._dataIn = null;

    this._keyIn.detachAll();
    this._keyIn = null;

    this._dataOut.detachAll();
    this._dataOut = null;
  }

}


class SecretKeyEncryptorConfig {

}
new KindBuilder(SecretKeyEncryptorConfig, 'Parameters for SecretKeyEncryptor')
  .enumField('algo', 'Encryption Algorithm', { 1: 'AES-CBC', 2: 'DES-CBC' });

new ComponentBuilder(SecretKeyEncryptor, 'SecretKey Encryptor', 'Encrypts or decrypts data using symmetric algorithms such as AES and DES.', 'crypto', )
  .config(SecretKeyEncryptorConfig)
  .port('in', 'Input data to encrypted or decrypted', Direction.IN, { required: true })
  .port('key', 'Secret Key', Direction.IN, { required: true })
  .port('out', 'Resultant encrypted/decrypted Data', Direction.OUT, { required: true, /*protocol: new Protocol<CryptoKey>()*/ })
  ;

/*class Protocoll<T extends Kind> {
  t: T;
  //  tt: typeof T;

  constructor(sub: KindConstructor) {
    //alert(sub.name);

    alert(sub.kindInfo.description);
  }
}

new Protocoll<SymmetricSignerConfig>(SymmetricSignerConfig);*/
