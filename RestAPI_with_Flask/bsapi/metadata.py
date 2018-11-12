"""
    This module handles the metadata functionality
"""

import re


from bsapi import database


class Metadata():
    """
    Class that handles the Metadata entity
    """
    def __init__(self):
        """
        Initialize a 'Metadata' instance
        :return:
        """
        self.db = database.db_connection()

    def get_metadata_list(self):
        """
        Retrieves a list of metadata keys
        :return:
        """
        if self.db.exists("metadata_keys"):
            return self.db.hgetall("metadata_keys")
        else:
            return []

    @staticmethod
    def is_metadata_key_valid(metadata_key):
        """
        Checks if a metadata key is valid via regex
        :param str metadata_key: metadata key string to check
        :return:
        :raises ValueError:
        """
        if not re.match("^[A-Za-z0-9._-]*$", metadata_key):
            raise ValueError(
                "Metadata key %s can only contain letters,"
                " numbers, underscores, periods, and dashes." % metadata_key
            )

        if len(metadata_key) > 109:
            raise ValueError("Metadata key %s can only be 100 characters.")

        if metadata_key == "metadata_keys":
            raise ValueError("Invalid key name.")

    def is_metadata_value_valid(self, metadata_value):
        """
        Checks if metadata value is valid via regex (currently not checking
        anything)
        :param str metadata_value: metadata value string to check
        :return:
        """
        pass

    def get_metadata_by_key(self, metadata_hash_key):
        """
        Returns the metadata associated with the key
        :param str metadata_hash_key:
        :return:
        """
        if not metadata_hash_key.startswith("metadata_"):
            metadata_hash_key = "metadata_%s" % metadata_hash_key

        self.is_metadata_key_valid(metadata_hash_key)

        if self.db.exists(metadata_hash_key):
            return self.db.hgetall(metadata_hash_key)
        else:
            return {}

    def get_metadata(self, app_name, env_name=""):
        metadata_hash_key = app_name
        if len(env_name):
            metadata_hash_key = "%s_%s" % (env_name, app_name)

        return self.get_metadata_by_key(metadata_hash_key)

    def add_metadata_by_key(self, metadata_hash_key, metadata_dict):
        metadata_hash_key = "metadata_%s" % metadata_hash_key

        self.is_metadata_key_valid(metadata_hash_key)

        if not isinstance(metadata_dict, dict):
            raise ValueError(
                "add_metadata_by_key: metadata_dict needs to be a dictionary."
            )

        with self.db.pipeline() as pipeline:
            if not self.db.hexists("metadata_keys", metadata_hash_key):
                pipeline.hset(
                    "metadata_keys", metadata_hash_key, metadata_hash_key
                )

            # ensure this key isn't updated while we are updating it
            pipeline.watch(metadata_hash_key)

            for key in metadata_dict:
                self.is_metadata_key_valid(key)
                value = metadata_dict[key]
                self.is_metadata_value_valid(value)
                pipeline.hset(metadata_hash_key, key, value)

            pipeline.unwatch()
            pipeline.execute(raise_on_error=True)

    def add_metadata(self, app_name, metadata_dict, env_name=""):
        metadata_hash_key = app_name
        if len(env_name):
            metadata_hash_key = "%s_%s" % (env_name, app_name)

        self.add_metadata_by_key(metadata_hash_key, metadata_dict)

    def delete_metadata_by_key(self, metadata_hash_key, metadata_keys_list):
        metadata_hash_key = "metadata_%s" % metadata_hash_key
        for metadata_sub_key in metadata_keys_list:
            self.is_metadata_key_valid(metadata_sub_key)
        with self.db.pipeline() as pipeline:
            pipeline.hdel(metadata_hash_key, *metadata_keys_list)

            pipeline.execute(raise_on_error=True)

    def delete_metadata(self, app_name, metadata_keys_list, env_name=""):
        metadata_hash_key = app_name
        if len(env_name):
            metadata_hash_key = "%s_%s" % (env_name, app_name)
        self.delete_metadata_by_key(metadata_hash_key, metadata_keys_list)

    def delete_metadata_hashkey_by_key(self, metadata_hash_key):
        metadata_hash_key = "metadata_%s" % metadata_hash_key

        with self.db.pipeline() as pipeline:
            pipeline.delete(metadata_hash_key)
            pipeline.hdel("metadata_keys", metadata_hash_key)

            pipeline.execute(raise_on_error=True)

    def delete_metadata_hashkey(self, app_name, env_name=""):
        metadata_hash_key = app_name
        if len(env_name):
            metadata_hash_key = "%s_%s" % (env_name, app_name)

        self.delete_metadata_hashkey_by_key(metadata_hash_key)
