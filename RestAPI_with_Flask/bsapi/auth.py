"""
    This module handles authentication
"""

import logging
import re

import flask_httpauth
import passlib.hash

from bsapi import database

AUTH = flask_httpauth.HTTPBasicAuth()
LOGGER = logging.getLogger()


@AUTH.verify_password
def verify_pw(username, password):
    """
    flask httpauth username/password verification function
    :param str username:
    :param str password:
    :return: True/False
    :rtype: bool
    """
    user = User()
    status = user.verify_password(username, password)
    if not status:
        LOGGER.error("User %s login failed.", username)
    else:
        LOGGER.info("User %s login success.", username)
    return status


@AUTH.error_handler
def auth_error():
    """
    flask httpauth error handler
    :return: Access denied message
    :rtype: str
    """
    return "Access Denied."


def get_users_list():
    """
    Get list of all users
    :return: list of users in the system
    :rtype: list
    """
    redis_db = database.db_connection()
    return redis_db.hvals("users")


class User():
    """
    Class that handles the User entity
    """
    def __init__(self):
        """
        Initialize a 'User' instance
        :return:
        """
        self.redis_db = database.db_connection()

    def admin_gate(self, username):
        """
        A gate function that throws an exception if the user
        is not an admin.
        :param str username: username to verify
        :return:
        :raises ValueError:
        """
        if not self.is_admin(username):
            raise ValueError("You must be an admin.")

    def is_admin(self, username):
        """
        Checks if the username given is an admin
        :param str username: username to check
        :return: True/False
        :rtype: bool
        :raises ValueError:
        """
        try:
            self.is_username_valid(username)

            if not self.exists(username):
                raise ValueError("User %s does not exist." % username)

            admin = 0
            if self.redis_db.exists("user:%s:admin" % username):
                admin = int(self.redis_db.get("user:%s:admin" % username))

            return bool(admin)
        except Exception as error:
            raise ValueError("User is_admin exception: %s" % (str(error)))

    def create(self, username, password, admin="0"):
        """
        Adds a new user into the system
        :param str username: username to call the new user
        :param str password: password for the new user
        :param str admin: whether the new user is an admin or not
        :return:
        :raises ValueError:
        """
        if self.exists(username):
            raise ValueError("User %s already exists." % username)

        self.is_username_valid(username)
        self.is_password_valid(password)

        with self.redis_db.pipeline() as pipeline:
            pipeline.hset("users", username, username)
            pipeline.set(
                "user:%s" % username,
                passlib.hash.sha256_crypt.encrypt(password)
            )
            if admin == "1":
                pipeline.set("user:%s:admin" % username, "1")
            else:
                pipeline.set("user:%s:admin" % username, "0")
            pipeline.execute()

    def delete(self, username):
        """
        Deletes a user from the system
        :param str username: The username to delete
        :return:
        :raises ValueError:
        """
        if not self.exists(username):
            raise ValueError("User %s does not exist." % username)

        with self.redis_db.pipeline() as pipeline:
            pipeline.hdel("users", username)
            pipeline.delete("user:%s" % username)
            pipeline.delete("user:%s:admin" % username)
            pipeline.execute(raise_on_error=True)

    def change_password(self, username, new_password):
        """
        Changes the password for a user
        :param str username:
        :param str new_password:
        :return:
        :raises ValueError:
        """
        self.is_username_valid(username)

        if not self.exists(username):
            raise ValueError("User %s does not exist." % username)

        self.is_password_valid(new_password)

        self.set_password(username, new_password)

    def set_password(self, username, password):
        """
        Writes a new password to the database for a username
        :param str username: username to set the new password for
        :param str password: new password to set
        :return:
        """
        with self.redis_db.pipeline() as pipeline:
            pipeline.set(
                "user:%s" % username,
                passlib.hash.sha256_crypt.encrypt(password)
            )
            pipeline.execute(raise_on_error=True)

    def verify_password(self, username, password):
        """
        Verifies if the password for the username specified is correct
        :param str username: username to verify password for
        :param str password: password to verify
        :return: True/False
        :rtype: bool
        """
        self.is_username_valid(username)
        self.is_password_valid(password)

        auth_hash = self.get_hash(username)

        return passlib.hash.sha256_crypt.verify(password, auth_hash)

    def get_hash(self, username):
        """
        Returns the auth hash for the username specified
        :param str username: username to retrieve auth hash for
        :return: auth hash
        :rtype: str
        """
        self.is_username_valid(username)

        return self.redis_db.get("user:%s" % username)

    def exists(self, username):
        """
        Checks if the username exists in the system
        :param str username: username to verify
        :return: True/False
        :rtype: bool
        """
        self.is_username_valid(username)

        if self.redis_db.hexists("users", username):
            return True

        return False

    @staticmethod
    def is_username_valid(username):
        """
        Checks if the username string is valid via regex
        :param str username: username to check
        :return:
        :raises ValueError:
        """
        if not re.match("^[A-Za-z0-9._-]*$", username):
            raise ValueError(
                "Username %s can only"
                " contain letters, numbers, underscores, periods, and"
                " dashes." % username
            )

    @staticmethod
    def is_password_valid(password):
        """
        Checks if the password string is valid via regex
        :param str password: password to check
        :return:
        :raises ValueError:
        """
        if not re.match(r'[A-Za-z0-9@#$%^&+=]{8,}', password):
            raise ValueError("Password verification failed.")
