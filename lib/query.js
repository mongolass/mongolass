const _ = require('lodash')
const debug = require('debug')('mongolass-query')
const plugins = require('./schema')._plugins

exports.bindQuery = function bindQuery (ctx, NativeClass) {
  for (let propName in NativeClass.prototype) {
    if (propName[0] !== '_') _bindProperty(propName)
  }

  function _bindProperty (propName) {
    let fn
    const desc = Object.getOwnPropertyDescriptor(NativeClass.prototype, propName)
    if (!desc) {
      try {
        fn = NativeClass.prototype[propName]
      } catch (e) {}
    } else {
      fn = desc.value
    }
    /* istanbul ignore else */
    if (_.isFunction(fn)) {
      _bindMethod(propName)
    } else if (desc) {
      /* istanbul ignore else */
      if (desc.get) {
        _bindGetter(propName)
      }
      /* istanbul ignore else */
      if (desc.set) {
        _bindSetter(propName)
      }
    }
  }

  class Query {
    constructor (op, args) {
      Error.captureStackTrace(this, this.constructor)// preserve stack

      this._op = op
      this._args = args
      // register built-in schema plugin
      this._plugins = [{
        name: 'MongolassSchema',
        hooks: plugins(ctx._schema),
        args: []
      }]
      this._model = ctx

      _.forEach(ctx._plugins, plugin => {
        this[plugin.name] = (...args) => {
          this._plugins.push({
            name: plugin.name,
            hooks: plugin.hooks,
            args: args
          })
          return this
        }
      })
    }

    exec () {
      return Promise.resolve()
        .then(() => execBeforePlugins.call(this))
        .then(() => ctx.connect())
        .then(conn => {
          const res = conn[this._op].apply(conn, this._args)
          if (res.toArray && (typeof res.toArray === 'function')) {
            return res.toArray()
          }
          return res
        })
        .then(result => execAfterPlugins.call(this, result))
        .catch(e => addMongoErrorDetail.call(this, e))
    }

    cursor () {
      return Promise.resolve()
        .then(() => execBeforePlugins.call(this))
        .then(() => ctx.connect())
        .then(conn => conn[this._op].apply(conn, this._args))
        .then(result => execAfterPlugins.call(this, result))
        .catch(e => addMongoErrorDetail.call(this, e))
    }

    then (resolve, reject) {
      return this.exec().then(resolve, reject)
    }
  }

  function _bindMethod (propName) {
    Object.defineProperty(ctx, propName, {
      enumerable: true,
      value: (...args) => {
        if (args.length && (typeof args[args.length - 1] === 'function')) {
          throw new TypeError(`Not support callback for method: ${propName}, please call .exec() or .cursor()`)
        }
        if (['find', 'findOne'].includes(propName)) {
          if (args.length > 2) {
            throw new TypeError(`Only support this usage: ${propName}(query, options)`)
          }
        }
        return new Query(propName, args)
      }
    })
    Object.defineProperty(ctx[propName], 'name', {
      value: propName
    })
  }

  function _bindGetter (propName) {
    ctx.__defineGetter__(propName, () => {
      return ctx.connect()
        .then(conn => {
          return conn[propName]
        })
    })
  }

  function _bindSetter (propName) {
    ctx.__defineSetter__(propName, value => {
      ctx.connect()
        .then(conn => {
          conn[propName] = value
        })
    })
  }
}

async function execBeforePlugins () {
  const hookName = `before${_.upperFirst(this._op)}`
  const plugins = _.filter(this._plugins, plugin => plugin.hooks[hookName])
  if (!plugins.length) {
    return
  }
  for (let plugin of plugins) {
    debug(`model: ${this._model._name}, plugin: ${plugin.name}, beforeHook: ${hookName}, args: ${JSON.stringify(this._args)}`)
    try {
      await plugin.hooks[hookName].apply(this, plugin.args)
    } catch (e) {
      e.model = this._model._name
      e.op = this._op
      e.args = this._args
      e.pluginName = plugin.name
      e.pluginOp = hookName
      e.pluginArgs = plugin.args
      throw e
    }
    debug(`model: ${this._model._name}, plugin: ${plugin.name}, afterHook: ${hookName}, args: ${JSON.stringify(this._args)}`)
  }
}

async function execAfterPlugins (result) {
  const hookName = `after${_.upperFirst(this._op)}`
  const plugins = _.filter(this._plugins, plugin => plugin.hooks[hookName])
  if (!plugins.length) {
    return result
  }
  for (let plugin of plugins) {
    debug(`model: ${this._model._name}, plugin: ${plugin.name}, beforeHook: ${hookName}, args: ${JSON.stringify(this._args)}`)
    try {
      result = await plugin.hooks[hookName].apply(this, [result].concat(plugin.args))
    } catch (e) {
      e.model = this._model._name
      e.op = this._op
      e.args = this._args
      e.pluginName = plugin.name
      e.pluginOp = hookName
      e.pluginArgs = plugin.args
      e.result = result
      throw e
    }
    debug(`model: ${this._model._name}, plugin: ${plugin.name}, afterHook: ${hookName}, args: ${JSON.stringify(this._args)}`)
  }
  return result
}

function addMongoErrorDetail (e) {
  const thisStackArr = this.stack.split('\n')
  const errorStackArr = e.stack.split('\n')
  thisStackArr[0] = e.toString()
  // like:  at Query.afterFind (...)
  if (errorStackArr[1] && errorStackArr[1].match(/^\s+at Query\./)) {
    thisStackArr.splice(1, 0, errorStackArr[1])
  }
  e.stack = thisStackArr.join('\n')
  // only for mongoError
  if (!e.model) {
    e.op = this._op
    e.args = this._args
    e.model = this._model._name
    e.schema = this._model._schema && this._model._schema._name
  }
  debug(e)
  throw e
}
