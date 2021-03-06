# [Keras.js](https://transcranial.github.io/keras-js)

Run [Keras](https://github.com/fchollet/keras) models (trained using Tensorflow backend) in your browser, with GPU support. Models are created directly from the Keras JSON-format configuration file, using weights serialized directly from the corresponding HDF5 file.

Inspiration is drawn from a number of deep learning / neural network libraries for JavaScript and the browser, including [Tensorflow Playground](http://playground.tensorflow.org/), [ConvNetJS](https://github.com/karpathy/convnetjs), [synaptic](https://github.com/cazala/synaptic), [brain](https://github.com/harthur/brain), [CaffeJS](https://github.com/chaosmail/caffejs), [MXNetJS](https://github.com/dmlc/mxnet.js). However, the focus of this library is on inference only.

Tensor operations are extended on top of the [ndarray](https://github.com/scijs/ndarray) library. GPU support is powered by WebGL through [weblas](https://github.com/waylonflinn/weblas).

### [Interactive Demos](https://transcranial.github.io/keras-js)

<p align="center">
  <a href="https://transcranial.github.io/keras-js"><img src="demos/assets/mnist-cnn.png" height="120" width="auto" /></a>
  <a href="https://transcranial.github.io/keras-js"><img src="demos/assets/resnet50.png" height="120" width="auto" /></a>
  <a href="https://transcranial.github.io/keras-js"><img src="demos/assets/inception-v3.png" height="120" width="auto" /></a>
  <a href="https://transcranial.github.io/keras-js"><img src="demos/assets/imdb-bidirectional-lstm.png" height="120" width="auto" /></a>
</p>

- Basic Convnet for MNIST

- Convolutional Variational Autoencoder, trained on MNIST

- 50-layer Residual Network, trained on ImageNet

- Inception V3, trained on ImageNet

- Xception, trained on ImageNet

- Bidirectional LSTM for IMDB sentiment classification

*planned*: Char-RNN, SqueezeNet

### Usage

See `demos/src/` for source code of real examples written in VueJS.

1. Works for models based on both `Model` and `Sequential` classes:

  ```py
  model = Sequential()
  model.add(...)
  ...
  ```

  ```py
  ...
  model = Model(input=..., output=...)
  ```

  Once trained, save the weights and export model architecture config:

  ```py
  model.save_weights('model.hdf5')
  with open('model.json', 'w') as f:
      f.write(model.to_json())
  ```

  See jupyter notebooks of demos for details: `demos/notebooks/`. All that's required for [ResNet50](https://github.com/fchollet/keras/blob/master/keras/applications/resnet50.py), for example, is:

  ```py
  from keras.applications import resnet50
  model = resnet50.ResNet50(include_top=True, weights='imagenet')
  model.save_weights('resnet50.hdf5')
  with open('resnet50.json', 'w') as f:
      f.write(model.to_json())
  ```

2. Run the encoder script on the HDF5 weights file:

  ```sh
  $ python encoder.py /path/to/model.hdf5
  ```

  This will produce 2 files in the same folder as the HDF5 weights: `model_weights.buf` and `model_metadata.json`.

3. The 3 files required for Keras.js are:

  - the model file: `model.json`

  - the weights file: `model_weights.buf`

  - the weights metadata file: `model_metadata.json`

4. Include both the Keras.js and Weblas libraries:

  ```html
  <script src="lib/weblas.js"></script>
  <script src="dist/keras.js"></script>
  ```

5. Create new model

  On instantiation, data is loaded using XHR (same-domain or CORS required), and layers are initialized as a directed acyclic graph:

  ```js
  const model = new KerasJS.Model({
    filepaths: {
      model: 'url/path/to/model.json',
      weights: 'url/path/to/model_weights.buf',
      metadata: 'url/path/to/model_metadata.json'
    },
    gpu: true
  })
  ```

  Class method `ready()` returns a Promise which resolves when these steps are complete. Then, use `predict()` to run data through the model, which also returns a Promise:

  ```js
  model.ready()
    .then(() => {
      // input data object keyed by names of the input layers
      // or `input` for Sequential models
      // values are the flattened Float32Array data
      // (input tensor shapes are specified in the model config)
      const inputData = {
        'input_1': new Float32Array(data)
      }

      // make predictions
      // outputData is an object keyed by names of the output layers
      // or `output` for Sequential models
      model.predict(inputData)
        .then(outputData => {
          // e.g.,
          // outputData['fc1000']
        })
        .catch(err => {
          // handle error
        }
    })
    .catch(err => {
      // handle error
    }
  ```

  Alternatively, we could also use async/await:

  ```js
  try {
    await model.ready()
    const inputData = {
      'input_1': new Float32Array(data)
    }
    const outputData = await model.predict(inputData)
  } catch (err) {
    // handle error
  }
  ```

### Available layers

  - *advanced activations*: LeakyReLU, PReLU, ELU, ParametricSoftplus, ThresholdedReLU, SReLU

  - *convolutional*: Convolution1D, Convolution2D, AtrousConvolution2D, SeparableConvolution2D, Deconvolution2D, Convolution3D, UpSampling1D, UpSampling2D, UpSampling3D, ZeroPadding1D, ZeroPadding2D, ZeroPadding3D, Cropping1D, Cropping2D, Cropping3D

  - *core*: Dense, Activation, Dropout, SpatialDropout2D, SpatialDropout3D, Flatten, Reshape, Permute, RepeatVector, Merge, Highway, MaxoutDense

  - *embeddings*: Embedding

  - *normalization*: BatchNormalization

  - *pooling*: MaxPooling1D, MaxPooling2D, MaxPooling3D, AveragePooling1D, AveragePooling2D, AveragePooling3D, GlobalMaxPooling1D, GlobalAveragePooling1D, GlobalMaxPooling2D, GlobalAveragePooling2D

  - *recurrent*: SimpleRNN, LSTM, GRU

  - *wrappers*: Bidirectional, TimeDistributed

### Layers to be implemented

  Note: Lambda layers cannot be implemented directly at this point, but will eventually create a mechanism for defining computational logic through JavaScript.

  - *core*: Lambda

  - *convolutional*: AtrousConvolution1D

  - *locally-connected*: LocallyConnected1D, LocallyConnected2D

  - *noise*: GaussianNoise, GaussianDropout

  - *pooling*: GlobalMaxPooling3D, GlobalAveragePooling3D

### Notes

**WebWorkers and their limitations**

Keras.js can be run in a WebWorker separate from the main thread. Because Keras.js performs a lot of synchronous computations, this can prevent the UI from being affected. However, one of the biggest limitations of WebWorkers is the lack of `<canvas>` (and thus WebGL) access. So the benefits gained by running Keras.js in a separate thread are offset by the necessity of running it in CPU-mode only. In other words, one can run Keras.js in GPU mode only on the main thread. [This will not be the case forever.](https://github.com/whatwg/html/pull/1876)

**WebGL MAX_TEXTURE_SIZE**

In GPU mode, tensor objects are encoded as WebGL textures prior to computations. The size of these tensors are limited by `gl.getParameter(gl.MAX_TEXTURE_SIZE)`, which differs by hardware/platform. See [here](http://webglstats.com/) for typical expected values. For operations involving tensors where this value is exceeded along any dimension, that operation falls back to the CPU.

### Development / Testing

There are extensive tests for each implemented layer. See `notebooks/` for jupyter notebooks generating the data for all these tests.

```sh
$ npm install
```

To run all tests run `npm run server` and simply go to [http://localhost:3000/test/](http://localhost:3000/test/). All tests will automatically run. Open up your browser devtools for additional test data info.

For development, run:

```sh
$ npm run watch
```

Editing of any file in `src/` will trigger webpack to update `dist/keras.js`.

To create a production UMD webpack build, output to `dist/keras.js`, run:

```sh
$ npm run build
```

Data files for the demos are located at `demos/data/`. All binary `*.buf` files uses [Git LFS](https://git-lfs.github.com/) (see `.gitattributes`).

### License

[MIT](https://github.com/transcranial/keras-js/blob/master/LICENSE)
