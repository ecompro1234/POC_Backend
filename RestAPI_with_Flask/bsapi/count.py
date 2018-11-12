"""
    This module handles the Count class
"""

from bsapi import database


class Count():
    """
        Class that handles the Count entity
        - The Count was added for a U2 group that didn't
          like how long a UUID was.  They wanted a number
          that incremented on every deploy.
    """
    def __init__(self):
        """
        Initialize a 'Count' instance
        :return:
        """
        self.db = database.db_connection()
        self.count_key = "count-ah-ah-ah:id"

    def get_current_count(self):
        """
        Retrieves the current count
        :return: the current count
        :rtype: int
        """
        if self.db.exists(self.count_key):
            return self.db.get(self.count_key)

        return self.get_next_count()

    def get_next_count(self):
        """
        Increments and returns the count value
        :return: the count value
        :rtype: int
        """
        return self.db.incr(self.count_key, amount=1)

    def get_notes(self, count_id):
        """
        Retrieves the note field for a count number (if exists)
        :param int count_id: The count number you want the note for
        :return: the note or an error.
        :rtype: str
        """
        note_key = "%d:note" % count_id
        if self.db.exists(note_key):
            return self.db.get(note_key)

        return "There is no note for count id %d" % count_id

    def set_notes(self, count_id, note):
        """
        Sets the note field for a count number
        :param int count_id: The count number you want the note for
        :param str note: The note you want set for the count number supplied
        :return:
        :raises ValueError:
        """
        if len(note) > 256:
            raise ValueError("Note can only be 256 characters or less.")
        note_key = "%s:note" % (str(count_id))
        self.db.set(note_key, note)
