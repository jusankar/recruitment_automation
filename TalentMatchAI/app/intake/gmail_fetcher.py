import os
import base64
from email import message_from_bytes
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from .file_storage import save_file
from dotenv import load_dotenv

load_dotenv()

SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]

BASE_DIR = os.path.dirname(__file__)
CREDENTIALS_FILE = os.path.join(BASE_DIR, "credentials.json")
TOKEN_FILE = os.path.join(BASE_DIR, "token.json")

MAX_RESULTS = int(os.getenv("GMAIL_MAX_RESULTS", 20))
RESUME_LABEL = os.getenv("GMAIL_RESUME_LABEL", "Resume Inbox")


def get_gmail_service():
    """Authenticate and return Gmail service"""
    creds = None

    try:
        if os.path.exists(TOKEN_FILE):
            creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)

        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                flow = InstalledAppFlow.from_client_secrets_file(
                    CREDENTIALS_FILE, SCOPES
                )
                creds = flow.run_local_server(port=0)

            with open(TOKEN_FILE, "w") as token:
                token.write(creds.to_json())

        return build("gmail", "v1", credentials=creds)

    except Exception as e:
        raise RuntimeError(f"Gmail authentication failed: {str(e)}")


def fetch_resume_emails():
    """
    Fetch unread PDF resumes from configured Gmail label
    and store them locally.
    """
    service = get_gmail_service()
    query = f'label:"{RESUME_LABEL}" is:unread has:attachment filename:pdf'
    
    try:
        results = service.users().messages().list(
            userId="me",
            q=query,
            maxResults=MAX_RESULTS,
        ).execute()
        print(results)
        messages = results.get("messages", [])
        stored_files = []

        for msg in messages:
            msg_data = service.users().messages().get(
                userId="me",
                id=msg["id"],
                format="raw",
            ).execute()

            raw_msg = base64.urlsafe_b64decode(msg_data["raw"])
            email_message = message_from_bytes(raw_msg)

            for part in email_message.walk():
                if (
                    part.get_content_disposition() == "attachment"
                    and part.get_filename()
                ):
                    filename = part.get_filename()

                    if filename.lower().endswith(".pdf"):
                        file_bytes = part.get_payload(decode=True)
                        saved_path = save_file(file_bytes, filename)
                        stored_files.append(saved_path)

        return stored_files

    except Exception as e:
        raise RuntimeError(f"Failed to fetch emails: {str(e)}")
