import hashlib
from datetime import datetime

def generate_secure_hash(data: dict, integrity_salt: str) -> str:
    sorted_string = integrity_salt + "&" + "&".join(
        f"{k}={data[k]}" for k in sorted(data) if data[k]
    )
    return hashlib.sha256(sorted_string.encode()).hexdigest()
