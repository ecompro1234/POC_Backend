"""
    This module handles common functions
"""

import datetime
import json
import logging

import flask
import requests

LOGGER = logging.getLogger()


def get_return_envelope(success="true", message="", data=None):
    """
    Builds and returns a 'return envelope'
    :param str success: Should be 'true' or 'false'
    :param str message: String you want returned to api caller
    :param data: Can be any data structure you want returned to api caller.
    :return: return envelope
    :rtype: dict
    """
    if not data:
        data = {}
    envelope = {
        "success": success,
        "message": message,
        "data": data
    }
    return envelope


def check_response_and_return_or_log(response, url):
    """
    Checks for response status_code and text and returns
    either tuple or None. This common method can be used
    when intending to log error in cases of response
    status code greater than 400 and if there is failure
    in communication when status code is less than 400.

    :param response: response received in the communication process
    :param url: url attempted to communicate
    :return: return success indication from response, response text
    :rtype: tuple if response.status_code < 400 else None
    """
    # NOTE(nikhil): Do not use response.raise_for_status() to avoid raising
    #  exceptions in this communication
    if response.status_code < 400:
        if response.text:
            try:
                response_text = json.loads(response.text)
                if response_text.get("success").lower() == "false":
                    return False, response_text.get("data")
                else:
                    return True, response_text.get("data")
            except Exception as e:
                LOGGER.error(u'Exception "%s" raised when trying to read '
                             u'response.text as json' % str(e))
                # if response.text does not indicate failure assume
                # success = True
                return True, response.text
        else:
            # if response.text does not indicate failure assume success = True
            return True, None

    elif 400 <= response.status_code < 500:
        LOGGER.error(u'%s Bouncer Service Error: %s for url: %s' % (
            response.status_code,
            response.text,
            url
        ))

    elif 500 <= response.status_code < 600:
        LOGGER.error(u'%s Server Error: %s for url: %s' % (
            response.status_code,
            response.text,
            url
        ))


def get_post_data(required_fields, non_required_fields=None):
    """
    Standardizes the way post data is retrieved from request object.
    Any post data that is not included in the required_fields list or
    non_required_fields list will not be returned.
    :param list required_fields: Required fields that should be pulled
                                 from post data
    :param list non_required_fields: Non-required fields that should be
                                     pulled from post data
    :return:  dictionary of post data
    :rtype:  dict
    :raises ValueError:
    """
    if not non_required_fields:
        non_required_fields = []
    data = flask.request.get_json()
    if not data:
        raise ValueError(
            "This requires a 'Content-Type: application/json header."
        )

    missing_fields = []
    fields = {}
    for field in required_fields:
        field = field.lower()
        if field not in data:
            missing_fields.append(field)
            continue

        fields[field] = data[field]

    for field in non_required_fields:
        field = field.lower()
        if field in data:
            fields[field] = data[field]

    if len(missing_fields):
        raise ValueError(
            "Missing required fields '%s' in POST JSON data." %
            str(missing_fields)
        )

    return fields


def metrics_send_slack_message(data):
    """
    Sends metrics status information to slack
    :param dict data: Information to include in the slack message
    :return:
    """
    slack_message_list = [
        "* Metrics posted to API by user:%s" % (data["bouncer_username"]),
        "  Application metrics:"
    ]
    for app in data["submitted_applications"]:
        slack_message_list.append("    + %s= %s" % (
            app,
            json.dumps(data["submitted_applications"][app], indent=6)
        ))

    send_to_slack(slack_message_list, testing=True)


def v1_deploy_send_slack_message(data, envelope):
    """
    Sends v1 deploy status information to slack
    :param dict data: Information to include in the slack message
    :param dict envelope: the return envelope - we need some information from
                          it
    :return:
    """
    test_environments = [
        "test-qat",
        "test-preqat"
    ]

    # slack
    slack_message_list = [
        "* %s-deploy posted to API by user:%s for environment:%s with "
        "status:%s" % (
            data["deployment_type"],
            data["bouncer_username"],
            data["deployment_environment"],
            data["deployment_status"]
        )
    ]

    if len(data["deployment_alias"]):
        slack_message_list.append("  - Alias:%s" % (data["deployment_alias"]))

    slack_message_list.append("  - Applications (v1):")
    for app in data["submitted_applications"]:
        if isinstance(data["submitted_applications"][app], type(u'')):
            slack_message_list.append(
                "    + %s=%s" % (app, data["submitted_applications"][app])
            )
        else:
            slack_message_list.append("    + %s=%s" % (
                app,
                json.dumps(data["submitted_applications"][app], indent=6)
            ))

    if not data["bouncer_result"]:
        if data["bouncer_force"]:
            slack_message_list.append(
                "==================================================="
            )
            slack_message_list.append(
                " THIS DEPLOYMENT BYPASSED GATING VIA FORCE"
            )
            slack_message_list.append(
                "  - API Message: %s" % (envelope["message"])
            )
            slack_message_list.append("  - Forced Applications:")
            for app in data["failed_applications"]:
                slack_message_list.append(
                    "    + %s=%s" % (app, data["failed_applications"][app])
                )
            slack_message_list.append(
                "==================================================="
            )
        else:
            slack_message_list.append(
                "  - API Message: %s" % (envelope["message"])
            )
            slack_message_list.append("  - Failed Applications:")
            for app in data["failed_applications"]:
                slack_message_list.append(
                    "    + %s=%s" % (app, data["failed_applications"][app])
                )
    else:
        if data["bouncer_force"]:
            slack_message_list.append(
                "==================================================="
            )
            slack_message_list.append("  - FORCE flag used")
            slack_message_list.append(
                "==================================================="
            )
        slack_message_list.append(
            "  - API Message: %s" % (envelope["message"])
        )

    if data["deployment_environment"] in test_environments:
        send_to_slack(slack_message_list, testing=True)
    elif data["deployment_environment"] != "monitoring":
        send_to_slack(slack_message_list, env=data["deployment_environment"])


def v2_deploy_send_slack_message(data, envelope):
    """
    Sends v2 deploy status information to slack
    :param dict data: Information to include in the slack message
    :param dict envelope: the return envelope - we need information from it.
    :return:
    """
    test_environments = ['test-qat', 'test-preqat']

    # slack
    slack_message_list = [
        "* %s-deploy posted to API by user:%s for environment:%s with "
        "status:%s" % (
            data["deployment_type"],
            data["bouncer_username"],
            data["deployment_environment"],
            data["deployment_status"]
        )
    ]

    if len(data["deployment_alias"]):
        slack_message_list.append("  - Alias:%s" % (data["deployment_alias"]))

    if envelope.get("data", None).get("deploy_count", None) is not None:
        slack_message_list.append(
            "  - Deploy count: {}".format(envelope["data"]["deploy_count"])
        )

    slack_message_list.append("  - Applications:")
    for app in data["applications"]:
        slack_message_list.append("    + %s=%s" % (
            app, data["applications"][app]["status"]))
        slack_message_list.append("       from branch: '%s'" % (
            data.get("applications", {}).get(app, {}).get("branch", "na")))

    if not data["bouncer_result"]:
        if data["bouncer_force"]:
            slack_message_list.append(
                "==================================================="
            )
            slack_message_list.append(
                " THIS DEPLOYMENT BYPASSED GATING VIA FORCE"
            )
            slack_message_list.append(
                "  - API Message: %s" % (envelope["message"])
            )
            slack_message_list.append("  - Forced Applications:")
            for app in data["applications"]:
                if not data["applications"][app]["success"]:
                    slack_message_list.append("    + %s=%s" % (
                        app, data["applications"][app]["status"]))
                    slack_message_list.append(
                        "       from branch: '%s'" % (
                            data.get("applications", {}).get(app, {})
                            .get("branch", "na")
                        )
                    )
            slack_message_list.append(
                "==================================================="
            )
        else:
            slack_message_list.append(
                "  - API Message: %s" % (envelope["message"])
            )
            slack_message_list.append("  - Failed Applications:")
            for app in data["applications"]:
                slack_message_list.append("    + %s=%s" % (
                    app, data["applications"][app]["status"]))
                slack_message_list.append(
                    "       from branch: '%s'" % (
                        data.get("applications", {}).get(app, {})
                        .get("branch", "na")
                    )
                )
    else:
        if data["bouncer_force"]:
            slack_message_list.append(
                "==================================================="
            )
            slack_message_list.append("  - FORCE flag used")
            slack_message_list.append(
                "==================================================="
            )
        slack_message_list.append(
            "  - API Message: %s" % (envelope["message"])
        )

    if data["deployment_environment"] in test_environments:
        send_to_slack(slack_message_list, testing=True)
    elif data["deployment_environment"] != "monitoring":
        send_to_slack(slack_message_list, env=data["deployment_environment"])


def send_to_slack(slack_message_list, testing=False, env=None):
    """
    Does the sending of the slack message to slack
    :param list slack_message_list: A list of strings containing the message
                                    going to slack
    :param bool testing: If set to True, it goes to different slack channel.
    :param str env: environment string
    :return:
    """
    # defaults
    slack_data_json = {
        "username": "api-bot",
        "channel": "#u2_edp_governance",
        "text": "\n".join(slack_message_list)
    }
    slack_webhook_url = (
        "https://hooks.slack.com/services/"
        "T02KY506W/B4Z9J8621/vADZoHz4I2sKaQ9EEeiZVMi2"
    )

    if testing:
        slack_data_json["username"] = "Lord Cluckerton"
        slack_data_json["channel"] = "#edp_bouncer_testing"

        slack_webhook_url = (
            "https://hooks.slack.com/services/"
            "T02KY506W/B618C9KD3/VN7rqfadFE1EUCl1kBiOhVt0"
        )
    else:
        # noinspection PyBroadException
        try:
            if env is not None:
                from edpapi import environment
                env_object = environment.Environment()
                env_object.existing(env)
                custom_slack_info = env_object.get_slack_info()
                for key in custom_slack_info:
                    if key in ['url']:
                        continue
                    slack_data_json[key] = custom_slack_info[key]

                if "url" in custom_slack_info:
                    slack_webhook_url = custom_slack_info["url"]
        except Exception:
            # use defaults
            pass

    headers = {"Content-Type": "application/json"}

    response = requests.post(
        slack_webhook_url, headers=headers, data=json.dumps(slack_data_json)
    )
    LOGGER.info("send_to_slack: data='%s' status_code='%s' text='%s'",
                slack_data_json,
                str(response.status_code),
                response.text)

    # NOTE(nikhil): Ref. US355733 do not use r.raise_for_status() to avoid
    # raising exceptions in slack communication. We intend to notify if slack
    # is unavailable or otherwise.
    check_response_and_return_or_log(response, slack_webhook_url)


def get_current_datetime():
    """
    Returns a string of the current date/time
    :return: current date/time
    :rtype: str
    """
    return datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')
