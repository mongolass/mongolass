const _ = require('lodash')
const AJS = require('another-json-schema')
const Types = AJS.Types

exports.Schema = class extends AJS {
  constructor (name, schema) {
    if (!name || !_.isString(name)) {
      throw new TypeError('Schema must have a name')
    }
    super(name, _.defaults(schema, { _id: { type: Types.ObjectId } }))
  }
}

exports._plugins = function _plugins (schema) {
  return {
    beforeBulkWrite: function beforeBulkWrite () {
      const operations = this._args[0]
      operations.forEach(operation => {
        if (operation.insertOne) {
          formatCreate(operation.insertOne.document, schema)
        }
        if (operation.updateOne) {
          formatQuery(operation.updateOne.filter, schema)
          formatUpdate(operation.updateOne.update, schema)
        }
        if (operation.updateMany) {
          formatQuery(operation.updateMany.filter, schema)
          formatUpdate(operation.updateMany.update, schema)
        }
        if (operation.deleteOne) {
          formatQuery(operation.deleteOne.filter, schema)
        }
        if (operation.deleteMany) {
          formatQuery(operation.deleteMany.filter, schema)
        }
        if (operation.replaceOne) {
          formatQuery(operation.replaceOne.filter, schema)
          formatCreate(operation.replaceOne.replacement, schema)
        }
      })
    },
    beforeCount: function beforeCount () {
      const query = this._args[0]
      formatQuery(query, schema)
    },
    beforeDeleteMany: function beforeDeleteMany () {
      const query = this._args[0]
      formatQuery(query, schema)
    },
    beforeDeleteOne: function beforeDeleteOne () {
      const query = this._args[0]
      formatQuery(query, schema)
    },
    beforeDistinct: function beforeDistinct () {
      const query = this._args[1]
      formatQuery(query, schema)
    },
    beforeFind: function beforeFind () {
      const query = this._args[0]
      formatQuery(query, schema)
    },
    beforeFindAndModify: function beforeFindAndModify () {
      const query = this._args[0]
      formatQuery(query, schema)
      const doc = this._args[2]
      formatUpdate(doc, schema)
    },
    beforeFindAndRemove: function beforeFindAndRemove () {
      const query = this._args[0]
      formatQuery(query, schema)
    },
    beforeFindOne: function beforeFindOne () {
      const query = this._args[0]
      formatQuery(query, schema)
    },
    beforeFindOneAndDelete: function beforeFindOneAndDelete () {
      const query = this._args[0]
      formatQuery(query, schema)
    },
    beforeFindOneAndReplace: function beforeFindOneAndReplace () {
      const query = this._args[0]
      formatQuery(query, schema)
      const doc = this._args[1]
      formatCreate(doc, schema)
    },
    beforeFindOneAndUpdate: function beforeFindOneAndUpdate () {
      const query = this._args[0]
      formatQuery(query, schema)
      const doc = this._args[1]
      formatUpdate(doc, schema)
    },
    beforeInsert: function beforeInsert () {
      let docs = this._args[0]
      /* istanbul ignore else */
      if (!_.isArray(docs)) {
        docs = [docs]
      }
      docs.forEach(doc => formatCreate(doc, schema))
    },
    beforeInsertMany: function beforeInsertMany () {
      const docs = this._args[0]
      docs.forEach(doc => formatCreate(doc, schema))
    },
    beforeInsertOne: function beforeInsertOne () {
      const doc = this._args[0]
      formatCreate(doc, schema)
    },
    beforeRemove: function beforeRemove () {
      const query = this._args[0]
      formatQuery(query, schema)
    },
    beforeReplaceOne: function beforeReplaceOne () {
      const query = this._args[0]
      formatQuery(query, schema)
      const doc = this._args[1]
      formatCreate(doc, schema)
    },
    beforeSave: function beforeSave () {
      const doc = this._args[0]
      formatCreate(doc, schema)
    },
    beforeUpdate: function beforeUpdate () {
      const query = this._args[0]
      formatQuery(query, schema)
      const doc = this._args[1]
      formatUpdate(doc, schema)
    },
    beforeUpdateMany: function beforeUpdateMany () {
      const query = this._args[0]
      formatQuery(query, schema)
      const doc = this._args[1]
      formatUpdate(doc, schema)
    },
    beforeUpdateOne: function beforeUpdateOne () {
      const query = this._args[0]
      formatQuery(query, schema)
      const doc = this._args[1]
      formatUpdate(doc, schema)
    }
  }
}

function formatCreate (doc, schema, opts) {
  if (schema instanceof AJS) {
    const result = schema.validate(doc, opts)
    if (!result.valid) {
      throw result.error
    }
  }
  return doc
}

function getSchema (schema, schemaPath) {
  // case:
  //   1. "posts"
  //   2. "posts.comments"
  //   3. "posts.0"
  //   4. "posts.0.comments"
  //   5. "posts.$[]"
  //   6. "posts.$[].comments"
  //   7. "posts.$[elem]"
  //   8. "posts.$[elem].comments"
  //   9. "posts.$"
  //   10. "posts.$.comments"
  return schemaPath
    ? _.get(schema, '_children.' +
      schemaPath // 1 2
        .replace(/\.\d+/g, '') // 3 4
        .replace(/\.\$\[\w*\]/g, '') // 5 6 7 8
        .replace(/\.\$/g, '') // 9 10
        .split('.')
        .join('._children.'))
    : schema
}

function formatQuery (query, compiledSchema) {
  if (_.isEmpty(query) || _.isEmpty(compiledSchema)) {
    return query
  }
  return _formatQuery(query)

  function _formatQuery (query, schemaPath = '', parentQuery, parentKey) {
    parentQuery = parentQuery || query
    if (_.isPlainObject(query)) {
      for (let key in query) {
        const isOperator = /^\$/.test(key)
        const subQuery = query[key]
        const subSchemaPath = isOperator ? schemaPath : `${schemaPath ? schemaPath + '.' : ''}${key}`

        if (!isOperator) {
          query[key] = _formatQuery(subQuery, subSchemaPath, query, key)
          continue
        }
        switch (key) {
          // format single/array leaf
          case '$eq':
          case '$gt':
          case '$gte':
          case '$lt':
          case '$lte':
          case '$ne':
          case '$in':
          case '$nin':
          case '$not':
          case '$elemMatch':
            query[key] = _formatQuery(subQuery, subSchemaPath, query, parentKey)
            break
          // format array
          case '$and':
          case '$nor':
          case '$or':
          case '$all':
            query[key] = subQuery.map(subQueryItem => {
              return _formatQuery(subQueryItem, subSchemaPath, query, parentKey)
            })
            break
          // skip
          default:
            // [
            //   '$exists', '$type', '$expr', '$jsonSchema', '$mod', '$regexp',
            //   '$options', '$text', '$where', '$geoIntersects', '$geoWithin',
            //   '$near', '$nearSphere', '$size', '$$bitsAllClear', '$bitsAllSet',
            //   '$bitsAnyClear', '$bitsAnySet', '$comment', '$meta', '$slice'
            // ]
            break
        }
      }
    } else {
      const schema = getSchema(compiledSchema, schemaPath)
      // only leaf & only check type & ignoreNodeType
      /* istanbul ignore else */
      if (schema && schema._leaf) {
        const opts = _.reduce(schema._children, (result, value, key) => {
          result[key] = false
          return result
        }, {
          additionalProperties: true,
          ignoreNodeType: true,
          required: false,
          default: false
        })
        // try format, if false then pass
        if (_.isArray(query)) {
          return schema.validate(query, opts).result
        } else {
          // eg: 'posts.comments' -> 'comments'
          let key = parentKey.split('.').slice(-1)[0]
          return schema._parent.validate({ [key]: query }, opts).result[key]
        }
      }
    }
    return query
  }
}

function formatUpdate (doc, compiledSchema) {
  if (_.isEmpty(doc) || _.isEmpty(compiledSchema)) {
    return doc
  }
  return _formatUpdate(doc)

  function _formatUpdate (doc, schemaPath = '', parentDoc, parentKey, opts = {}) {
    // update operators will not check `default` & `required`
    _.defaults(opts, {
      required: false,
      default: false
    })
    if (_.isPlainObject(doc)) {
      for (let key in doc) {
        const isOperator = /^\$/.test(key)
        const subDoc = doc[key]
        const subSchemaPath = isOperator ? schemaPath : `${schemaPath ? schemaPath + '.' : ''}${key}`

        if (!isOperator) {
          doc[key] = _formatUpdate(subDoc, subSchemaPath, doc, key, opts)
          continue
        }

        if (_.includes(['$set', '$setOnInsert'], key)) {
          const schema = getSchema(compiledSchema, subSchemaPath)
          doc[key] = formatSetOrSetOnInsert(subDoc, schema)
        } else {
          switch (key) {
            case '$addToSet':
              doc[key] = _formatUpdate(subDoc, subSchemaPath, doc, key, {
                ignoreNodeType: true
              })
              break
            case '$each':
            case '$push':
            case '$pushAll':
            case '$pullAll':
            case '$inc':
              doc[key] = _formatUpdate(subDoc, subSchemaPath, doc, key)
              break
            case '$pull':
              const schema = getSchema(compiledSchema, subSchemaPath)
              doc[key] = formatQuery(subDoc, schema)
              break
            default:
              // [
              //   '$currentDate', '$min', '$max', '$mul',
              //   '$rename', '$unset', '$pop', '$slice', '$sort',
              //   '$position', '$bit'
              // ]
              break
          }
        }
      }
    } else {
      const schema = getSchema(compiledSchema, schemaPath)
      if (_.isArray(doc)) {
        const result = schema.validate(doc, opts)
        if (!result.valid) {
          throw result.error
        }
        doc = result.result
      } else {
        // eg: 'posts.comments' -> 'comments'
        let key = parentKey.split('.').slice(-1)[0]
        const result = schema._parent.validate({ [key]: doc }, _.assign({
          ignoreNodeType: true
        }, opts))
        if (!result.valid) {
          throw result.error
        }
        doc = result.result[key]
      }
    }
    return doc
  }
}

function formatSetOrSetOnInsert (doc, compiledSchema) {
  if (_.isEmpty(doc) || _.isEmpty(compiledSchema)) {
    return doc
  }
  return _formatSetOrSetOnInsert(doc)

  function _formatSetOrSetOnInsert (doc, schemaPath = '', parentDoc, parentKey, subSchema = compiledSchema) {
    if (_.isPlainObject(doc) && !subSchema._leaf) {
      for (let key in doc) {
        const subDoc = doc[key]
        const subSchemaPath = `${schemaPath ? schemaPath + '.' : ''}${key}`
        const subSchema = getSchema(compiledSchema, subSchemaPath)
        doc[key] = _formatSetOrSetOnInsert(subDoc, subSchemaPath, doc, key, subSchema)
      }
    } else {
      const schema = getSchema(compiledSchema, schemaPath)
      if (!schema) {
        throw new Error(`No schema found on path: $.${schemaPath}`)
      }
      // only leaf & only check type & ignoreNodeType
      if (_.isArray(doc)) {
        const result = schema.validate(doc)
        if (!result.valid) {
          throw result.error
        }
        doc = result.result
      } else {
        // eg: 'posts.comments' -> 'comments'
        let key = parentKey.split('.').slice(-1)[0]
        const result = schema._parent.validate({ [key]: doc }, {
          ignoreNodeType: true,
          required: false,
          default: false
        })
        if (!result.valid) {
          throw result.error
        }
        doc = result.result[key]
      }
    }
    return doc
  }
}
