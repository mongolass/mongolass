const _ = require('lodash')
const muri = require('muri')
const debug = require('debug')('mongolass')
const mongodb = require('mongodb')
const Schema = require('./schema').Schema
const Model = require('./model')
const Query = require('./query')
const plugins = require('./plugins')
const AJS = require('another-json-schema')

const DEFAULT_MONGODB_URL = 'mongodb://localhost:27017/test'

module.exports = class Mongolass {
  constructor (url, opts) {
    this._name = this.constructor.name
    this._plugins = {}
    this._schemas = {}
    this._models = {}
    this._url = url || DEFAULT_MONGODB_URL
    this._opts = opts || {}

    Query.bindQuery(this, mongodb.Db)

    for (let name in plugins) {
      this.plugin(name, plugins[name])
    }
  }

  /**
   * connect mongodb
   */
  async connect (url, opts) {
    if (this._db) {
      if (url) {
        throw new Error(`Already connected to ${this._url}, please create another connection.`)
      }
      return this._db
    }
    this._url = url || this._url
    this._opts = opts || this._opts

    this._client = await mongodb.MongoClient.connect(this._url, _.assign({ useNewUrlParser: true }, this._opts))
    this._db = this._client.db(muri(this._url).db)
    debug(`Connected ${this._url}`)
    return this._db
  }

  /**
   * disconnect mongodb
   */
  async disconnect () {
    if (this._client) {
      await this._client.close()
      this._client = null
      this._db = null
      debug(`Disconnect ${this._url}`)
    }
  }

  /**
   * get/set collection schema
   */
  schema (name, schemaJSON) {
    if (!name || !_.isString(name)) {
      throw new TypeError('Missing schema name')
    }
    if (schemaJSON) {
      if (typeof schemaJSON !== 'object') throw new TypeError(`Wrong schemaJSON for schema: ${name}`)
      this._schemas[name] = new Schema(name, schemaJSON)
    }
    if (!this._schemas[name]) {
      throw new TypeError(`No schema: ${name}`)
    }

    return this._schemas[name]
  }

  /**
   * get/set collection model
   */
  model (name, schema, opts) {
    if (!name || !_.isString(name)) {
      throw new TypeError('Missing model name')
    }
    if (schema) {
      if (!(schema instanceof Schema)) {
        schema = this.schema(`${name}Schema`, schema)
      }
      this._models[name] = new Model(name, schema, this, opts)
    } else {
      this._models[name] = this._models[name] || new Model(name, null, this, opts)
    }

    return this._models[name]
  }

  /**
   * add global plugin
   */
  plugin (name, hooks) {
    if (!name || !hooks || !_.isString(name) || !_.isPlainObject(hooks)) {
      throw new TypeError('Wrong plugin name or hooks')
    }
    this._plugins[name] = {
      name: name,
      hooks: hooks
    }
    for (let model in this._models) {
      _.defaults(this._models[model]._plugins, this._plugins)
    }
    debug(`Add global pulgin: ${name}`)
  }
}

for (let key in mongodb) {
  module.exports[key] = mongodb[key]
}
module.exports.Schema = Schema
module.exports.Model = Model
module.exports.Types = AJS.Types
