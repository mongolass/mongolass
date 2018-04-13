const validator = require('validator')
const toObjectId = require('mongodb').ObjectId

const _String = String
const _Date = Date
const _Buffer = Buffer

exports.ObjectID = exports.ObjectId = function ObjectId (actual, key, parent) {
  if (!validator.isMongoId(String(actual))) {
    return false
  }
  /* istanbul ignore else */
  if (key != null) {
    parent[key] = toObjectId(actual)
  }
  return true
}

exports.String = function String (actual, key, parent) {
  /* istanbul ignore else */
  if (key != null) {
    parent[key] = _String(actual)
  }
  return true
}

exports.Number = function Number (actual, key, parent) {
  if (isNaN(+actual)) {
    return false
  }
  /* istanbul ignore else */
  if (key != null) {
    parent[key] = +actual
  }
  return true
}

exports.Date = function Date (actual, key, parent) {
  const date = new _Date(actual)
  if (date.toString() === 'Invalid Date') {
    return false
  }
  /* istanbul ignore else */
  if (key != null) {
    parent[key] = date
  }
  return true
}

exports.Buffer = function Buffer (actual, key, parent) {
  const isBuffer = _Buffer.isBuffer(actual)
  if (isBuffer) {
    return true
  }
  // try convert to buffer
  // string, Buffer, ArrayBuffer, Array, or array-like object
  try {
    /* istanbul ignore else */
    if (key != null) {
      parent[key] = _Buffer.from(actual)
    }
    return true
  } catch (e) {
    return false
  }
}

exports.Boolean = function Boolean (actual, key, parent) {
  /* istanbul ignore else */
  if (key != null) {
    parent[key] = !!actual
  }
  return true
}

exports.Mixed = function (actual, key, parent) {
  return true
}
