"""
    This module handles logging
"""

import logging
import sys

import flask
from pythonjsonlogger import jsonlogger
import six

from bsapi import auth

logger = logging.getLogger()


def log_init():
    formatter = jsonlogger.JsonFormatter(
        '{"timestamp":%(asctime),"message":%(message),'
        '"function_name":%(funcName),"logger_name":%(name),'
        '"logger_level":%(levelname),"filename":%(filename),'
        '"line_number":%(lineno)'
    )

    logHandler = logging.StreamHandler(sys.stdout)

    logHandler.setFormatter(formatter)

    logger.addHandler(logHandler)
    logger.setLevel(logging.DEBUG)


def logged(func):
    @six.wraps(func)
    def do_logged(*args, **kwargs):
        x_forwarded_for = ""
        if flask.request.headers.getlist("X-Forwarded-For"):
            x_forwarded_for = (
                flask.request.headers.getlist("X-Forwarded-For")[0]
            )
        logger.info(
            "function:%s method:%s remote_addr:%s x-forwarded-for:%s "
            "username:%s url:%s" % (
                func.__name__, flask.request.method,
                flask.request.remote_addr, x_forwarded_for,
                auth.AUTH.username(), flask.request.url
            )
        )
        return func(*args, **kwargs)

    return do_logged
