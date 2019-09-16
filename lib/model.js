const _ = require('lodash')
const debug = require('debug')('mongolass-model')
const mongodb = require('mongodb')
const inflected = require('inflected')
const Query = require('./query')

class Model {
  constructor (name, schema, db, opts) {
    opts = opts || {}
    this._db = db
    this._schema = schema
    this._name = name
    this._collName = opts.collName || inflected.pluralize(name).toLowerCase()
    this._opts = opts
    this._plugins = {}

    Query.bindQuery(this, mongodb.Collection)

    // alias
    this.create = this.insert
    this.index = this.createIndex

    _.defaults(this._plugins, this._db._plugins)
  }

  /**
   * get a collection
   */
  async connect () {
    if (this._coll) {
      return this._coll
    }

    this._coll = (await this._db.connect()).collection(this._collName, this._opts)
    return this._coll
  }

  /**
   * get/set another model
   */
  model (name, schema, opts) {
    return this._db.model(name, schema, opts)
  }

  /**
   * add model plugin
   */
  plugin (name, hooks) {
    if (!name || !hooks || !_.isString(name) || !_.isPlainObject(hooks)) {
      throw new TypeError('Wrong plugin name or hooks')
    }
    this._plugins[name] = {
      name: name,
      hooks: hooks
    }
    debug(`Add ${this._name} plugin: ${name}`)
  }
}

module.exports = Model
