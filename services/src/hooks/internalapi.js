/*
 * This hooks restricts the given API to our "internal API" calls which are
 * intended for back office type calls from our own internal automation.
 *
 * These APIs are not intended to be used by the evergreen-client or any other
 * callers
 */

const errors = require('@feathersjs/errors');

module.exports = function(context) {
  let authorization = context.params.headers.authorization;
  let secret = context.app.get('internalAPI').secret;

  if (authorization != secret) {
    throw new errors.NotAuthenticated('This API is unavailable');
  }

  return context;
};
