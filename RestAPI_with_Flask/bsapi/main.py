"""
    This is the application entrance
"""

import logging

import flask
import flask_cors

from bsapi import common
from bsapi import log
from bsapi import routes_api_v1
from bsapi import tmoflask

APP = tmoflask.TMOFlask(__name__)
flask_cors.CORS(APP)

LOGGER = logging.getLogger()


@APP.errorhandler(ValueError)
def handle_valueerror_exception(error):
    """
    Flask Error Handler for ValueError
    :param str error: error message
    :return: tuple(return envelope string, http status code int)
    :rtype: tuple(str, int)
    """
    envelope = common.get_return_envelope(
        success="false",
        message=str(error)
    )
    LOGGER.exception(str(error))
    return flask.jsonify(**envelope), 400


@APP.errorhandler(Exception)
def handle_general_exception(error):
    """
    Flask Error Handler for Exception
    :param str error:  error message
    :return: tuple(return envelope string, http status code int)
    :rtype: tuple(str, int)
    """
    envelope = common.get_return_envelope(
        success="false",
        message=str(error)
    )
    LOGGER.exception(str(error))
    return flask.jsonify(**envelope), 500


APP.register_blueprint(routes_api_v1.routes_api_v1, url_prefix='/api/v1')


def main():
    log.log_init()
    APP.run(debug=True, host='127.0.0.1', port=8080)


if __name__ == '__main__':
    main()
