import base64

def decode_base64(data):
    return base64.b64decode(data).decode('utf-8')

# This is a helper for the agent to decode content if needed, 
# but I'll use it internally to write the files.
