import base64
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from .file_storage import save_file


def fetch_resume_attachments(creds: Credentials):
    """
    Fetch resume attachments from Gmail inbox.
    """

    service = build("gmail", "v1", credentials=creds)

    results = service.users().messages().list(
        userId="me",
        labelIds=["INBOX"],
        q="has:attachment filename:pdf OR filename:doc OR filename:docx"
    ).execute()

    messages = results.get("messages", [])

    saved_files = []

    for msg in messages:
        message = service.users().messages().get(
            userId="me",
            id=msg["id"]
        ).execute()

        parts = message.get("payload", {}).get("parts", [])

        for part in parts:
            filename = part.get("filename")

            if filename:
                attachment_id = part["body"]["attachmentId"]

                attachment = service.users().messages().attachments().get(
                    userId="me",
                    messageId=msg["id"],
                    id=attachment_id
                ).execute()

                file_data = base64.urlsafe_b64decode(
                    attachment["data"].encode("UTF-8")
                )

                file_path = save_file(file_data, filename)
                saved_files.append(file_path)

    return saved_files
