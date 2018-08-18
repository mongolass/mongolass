## 4.4.0/2018-08-18

- update deps
- use `{ useNewUrlParser: true }`
- assert.deepEqual -> assert.deepStrictEqual
- fix tests

## 4.3.4/2018-06-21

- update AJS@3.7.0

## 4.3.3/2018-06-06

- fix #34

## 4.3.2/2018-06-05

- fix `_formatQuery` error

## 4.3.1/2018-05-25

- fix $set & $setOnInsert no schema error

## 4.3.0/2018-05-21

- fix: `_formatSetOrSetOnInsert`

## 4.2.1/2018-05-14

- update deps
- use AJS Types

## 4.2.0/2018-04-13

- add some Types

## 4.1.4/2018-04-11

- update `another-json-schema`

## 4.1.3/2018-01-19

- fix: test

## 4.1.2/2018-01-19

- fix: test

## 4.1.1/2018-01-19

- fix: beforeDeleteOne & beforeDeleteMany

## 4.1.0/2018-01-09

- upgrade another-json-schema@3.4.0
- update operators will not check `default` & `required`

## 4.0.0/2018-01-08

- [feat] use eslint@standard
- [feat] upgrade another-json-schema@3
  - support `default`
  - support `required`
- [breaking change] use async/await, **deprecated** generatorFunction(plugin)
- [breaking change] upgrade mongodb@3
  - see [https://github.com/mongodb/node-mongodb-native/blob/HEAD/CHANGES_3.0.0.md](https://github.com/mongodb/node-mongodb-native/blob/HEAD/CHANGES_3.0.0.md)
- [update] tweak codes
- [update] update tests
- [update] update README.md

## 3.1.5/2017-08-29

- fix #27

## 3.1.4/2017-08-20

- fix test coverage

## 3.1.3/2017-08-19

- tweak error

## 3.1.2/2017-08-19

- add error type
- update another-json-schema@2.1.1

## 3.1.1/2017-08-19

- tweak error stack

## 3.1.0/2017-08-19

- tweak error stack
- update README

## 3.0.0/2017-08-18

- breaking: remove `bluebird`, `exec` only return promise now
- update deps
- remove GreenKeeper
- remove yarn.lock
- use yield -> yield*

## 2.4.5/2017-03-20

- add greenkeeper
- update readme

## 2.4.4/2017-03-16

- fix: no schema name insert `_id` only

## 2.4.3/2017-03-13

- update deps

## 2.4.2/2017-02-10

- add `collName` opt

## 2.4.1/2016-12-20

- tweak error stack
- update readme

## 2.4.0/2016-12-20

- update error stack
- fix tests

## 2.3.4/2016-12-18

- update readme

## 2.3.3/2016-12-10

- update readme
- update deps:
```
debug       2.2.0  →   2.3.3
lodash     4.16.6  →  4.17.2
mongodb    2.2.11  →  2.2.14
validator   6.1.0  →   6.2.0
```

## 2.3.2/2016-11-06

- update deps:
```
lodash     4.15.0  →  4.16.6
mongodb     2.2.9  →  2.2.11
validator   5.6.0  →   6.1.0
mocha      ^3.0.2  →  ^3.1.2
```

## 2.3.1/2016-10-23

- print error when connect mongodb failed

## 2.3.0/2016-10-11

- model function cannot be modified now
- add model function name
- upgrade error stack

## 2.2.0/2016-10-04

- add default `_id` schema when register a new schema

## 2.1.0/2016-09-18

- `.model()` support raw object as schema now, inner schema named `${model._name}Schema`

## 2.0.2/2016-09-07

- change model function `connect` -> `_connect` 

## 2.0.1/2016-09-06

- change built-in schema plugin's name `schema` -> `MongolassSchema`
- repeatedly callling `mongolass.connect` will throw error

## 2.0.0/2016-09-03

- update to `another-json-schema@2.1.0`
- now format `query` & `update` filter if schema exist
- more detailed error information
- `Mongolass.Types` breaking change, now `throw` error && `return` formatted value

## 1.2.0/2016-08-25

- split `mongolass-plugin-populate` & update deps

## 1.1.0/2016-04-28

- add `Mongolass.Types`

## 1.0.4/2016-03-22

- update `.populate` can pass model instead of modelName

## 1.0.3/2016-03-14

- use [dot-prop](https://github.com/sindresorhus/dot-prop) for deep populate

## 1.0.2/2016-03-14

- add `.match` to populate & fix populate path bug

## 1.0.1/2016-03-09

- update readme & test, bump 

## v1.0.0/2016-03-09

It just work!
