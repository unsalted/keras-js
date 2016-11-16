import Model from './Model'
import Tensor from './Tensor'
import * as activations from './activations'
import * as layers from './layers'
import * as testUtils from './testUtils'

export class KerasJs {
  Model = Model
  Tensor = Tensor
  activations = activations
  layers = layers
  testUtils = testUtils
}
