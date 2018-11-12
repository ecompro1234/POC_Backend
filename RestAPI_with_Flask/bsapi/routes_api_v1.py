import json
import logging

import flask

from bsapi import auth
from bsapi import common
from bsapi import health
from bsapi import log
from bsapi import metadata
from bsapi import version

LOGGER = logging.getLogger()

routes_api_v1 = flask.Blueprint('routes_api_v1', __name__)

"""
@routes_api_v1.route('/access', methods=['GET'])
def access_test():
    if request.method == "GET":
        envelope = common.get_return_envelope(
            message="Access is good!"
        )
        return (jsonify(**envelope), 200)

@routes_api_v1.route('/inventory/initialize', methods=['GET'])
def api_initialize():
    if request.method == "GET":
        envelope = common.get_return_envelope(
            data=environment.initialize_environments()
        )
        return (jsonify(**envelope), 200)

@routes_api_v1.route('/inventory/load', methods=['GET'])
def api_load():
    if request.method == "GET":
        environment.add_lots_of_keys()
        envelope = common.get_return_envelope(
            data={}
        )
        return (jsonify(**envelope), 200)

"""


@routes_api_v1.route('/health', methods=['GET'])
def v1_api_health_check():
    if flask.request.method == "GET":
        data = health.health_check()

        envelope = common.get_return_envelope(
            data=data
        )

        status_code = 200

        if not data["success"]:
            status_code = 500

        return flask.jsonify(**envelope), status_code


@routes_api_v1.route('/version', methods=['GET'])
def v1_api_version():
    if flask.request.method == "GET":
        envelope = common.get_return_envelope(
            data=version.VERSION
        )

        status_code = 200

        return flask.jsonify(**envelope), status_code


@routes_api_v1.route('/books', methods=['GET'])
def v1_api_get_books():
    details = {
        "All": [
            {
                "book_name": "B00143741",
                "book_details": "Python",
                "book_price": "100 USD"
            },
            {
                "book_name": "B00143742",
                "book_details": "Django",
                "book_price": "200 USD"
            },
            {
                "book_name": "B00143743",
                "book_details": "React",
                "book_price": "400 USD"
            }
        ]
    }
    if flask.request.method == "GET":
        envelope = common.get_return_envelope(
            data=resp
        )

        status_code = 200

        return flask.jsonify(**envelope), status_code

@routes_api_v1.route('/login', methods=['POST'])
def v1_api_get_books():
    details = request.json()
    username = details["username"]
    password = details["password"]

    encoded_str = auth.basicauth(username,password)
    if encoded_str:
        return True
    else:
        return False

        {
        "All": [
            {
                "book_name": "B00143741",
                "book_details": "Python",
                "book_price": "100 USD"
            },
            {
                "book_name": "B00143742",
                "book_details": "Django",
                "book_price": "200 USD"
            },
            {
                "book_name": "B00143743",
                "book_details": "React",
                "book_price": "400 USD"
            }
        ]
    }
    if flask.request.method == "GET":
        envelope = common.get_return_envelope(
            data=resp
        )

        status_code = 200

        return flask.jsonify(**envelope), status_code
