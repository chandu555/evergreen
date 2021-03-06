
const dbtimestamp        = require('../../hooks/dbtimestamp');
const ensureMatchingUUID = require('../../hooks/ensureuuid');
const internalOnly       = require('../../hooks/internalonly');
const authentication     = require('@feathersjs/authentication');
const internalApi        = require('../../hooks/internalapi');
const errors             = require('@feathersjs/errors');

class UpdateHooks {
  constructor() {
  }

  /*
   * For create() methods, add the default `channel` to the data which will be
   * "general" until richer channel management is added
   */
  defaultChannel(context) {
    context.data.channel = 'general';
    return context;
  }

  checkUpdateFormat(hook) {
    if (!(hook.data) || !Object.keys(hook.data).length) {
      throw new errors.BadRequest('Missing data');
    }
    if (!(hook.data.commit)) {
      throw new errors.BadRequest('Missing commit field');
    }
    // TODO add required field validation once we know what the required fields are
  }

  getHooks() {
    return {
      before: {
        all: [
        ],
        find: [
          internalOnly,
        ],
        get: [
          authentication.hooks.authenticate(['jwt']),
          ensureMatchingUUID,
        ],
        create: [
          internalApi,
          this.checkUpdateFormat,
          dbtimestamp('createdAt'),
          this.defaultChannel,
        ],
        update: [],
        patch: [],
        remove: [
          internalOnly,
        ],
      },

      after: {
        find: [
        ],
      },
      error: {}
    };
  }
}

module.exports = new UpdateHooks();
