"""
    This Module handles the health check logic
"""

import uuid

from bsapi import database


def health_check():
    """
    Performs a health check
    :return: dictionary of health metrics
    :rtype: dict
    """
    dbh = None
    value = ""
    health_status_dict = {
        "success": True,
        "db_connection": "missed",
        "db_set_key": "missed",
        "db_get_key": "missed",
        "db_get_key_value": "missed",
        "db_delete_key": "missed",
    }
    random_key = "health_check_%s" % (str(uuid.uuid4()))

    try:
        try:
            dbh = database.db_connection()
            health_status_dict["db_connection"] = "success"
        except Exception as error:  # pylint: disable=broad-except
            health_status_dict["success"] = False
            health_status_dict["db_connection"] = "failed"
            health_status_dict["db_connection_error"] = str(error)

        try:
            dbh.set(random_key, "health_check", 60)
            health_status_dict["db_set_key"] = "success"
        except Exception as error:  # pylint: disable=broad-except
            health_status_dict["success"] = False
            health_status_dict["db_set_key"] = "failed"
            health_status_dict["db_set_key_error"] = str(error)

        try:
            value = dbh.get(random_key)
            health_status_dict["db_get_key"] = "success"
        except Exception as error:  # pylint: disable=broad-except
            health_status_dict["success"] = False
            health_status_dict["db_get_key"] = "failed"
            health_status_dict["db_get_key_error"] = str(error)

        if value == "health_check":
            health_status_dict["db_get_key_value"] = "success"
        else:
            health_status_dict["success"] = False
            health_status_dict["db_get_key_value"] = "failed"
            health_status_dict["db_get_key_value_error"] = (
                "Value should be 'health_check' instead value is '%s'" % value
            )

        try:
            dbh.delete(random_key)
            health_status_dict["db_delete_key"] = "success"
        except Exception as error:  # pylint: disable=broad-except
            health_status_dict["success"] = False
            health_status_dict["db_delete_key"] = "failed"
            health_status_dict["db_delete_key_error"] = str(error)

    except Exception as error:  # pragma: no cover
        health_status_dict["success"] = False
        health_status_dict["exception_error"] = str(error)

    return health_status_dict
