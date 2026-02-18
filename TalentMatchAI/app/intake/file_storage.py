import os
from uuid import uuid4

UPLOAD_DIR = "uploads"

# Ensure upload directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)


def save_file(file_bytes: bytes, original_filename: str) -> str:
    """
    Save resume file to local storage.
    Returns stored file path.
    """

    file_extension = original_filename.split(".")[-1]
    new_filename = f"{uuid4()}.{file_extension}"

    file_path = os.path.join(UPLOAD_DIR, new_filename)

    with open(file_path, "wb") as f:
        f.write(file_bytes)

    return file_path
