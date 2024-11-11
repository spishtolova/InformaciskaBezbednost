from Crypto.Cipher import AES
from Crypto.Util import Counter
from Crypto.Util.Padding import pad
import binascii

class ClearTextFrame:
    def __init__(self, header, pn, data):
        self.header = header
        self.pn = pn
        self.data = data


class EncryptedFrame:
    def __init__(self, encrypted_data, mic):
        self.encrypted_data = encrypted_data
        self.mic = mic


def calculate_mic(key, frame):
    iv = b'initial_iv_val__'
    cipher = AES.new(key, AES.MODE_CBC, iv)
    content = frame.header + frame.pn + frame.data
    p_content = pad(content, 16)
    mic = cipher.encrypt(p_content)
    return mic[:8]


def encrypt_frame(key, frame):
    counter = Counter.new(128, initial_value=int.from_bytes(frame.pn, byteorder='big'))
    cipher = AES.new(key, AES.MODE_CTR, counter=counter)
    content = frame.header + frame.pn + frame.data
    encrypted_data = cipher.encrypt(content)
    mic = calculate_mic(key, frame)
    return EncryptedFrame(encrypted_data, mic)


def decrypt_frame(key, encrypted_frame, pn):
    counter = Counter.new(128, initial_value=int.from_bytes(pn, byteorder='big'))
    cipher = AES.new(key, AES.MODE_CTR, counter=counter)
    decrypted_data = cipher.decrypt(encrypted_frame.encrypted_data)
    header, pn, data = decrypted_data[:6], decrypted_data[6:10], decrypted_data[10:]
    frame = ClearTextFrame(header, pn, data)

    calculated_mic = calculate_mic(key, frame)
    if calculated_mic != encrypted_frame.mic:
        raise ValueError("Integrity check failed.")
    return frame.data

def main():
    key = b'Sixteen byte key'
    frame = ClearTextFrame(b'mainframe', b'\x01\x02\x06\x08', b'test')

    encrypted_frame = encrypt_frame(key, frame)
    print("Encrypted Frame:", binascii.hexlify(encrypted_frame.encrypted_data))
    print("MIC:", binascii.hexlify(encrypted_frame.mic))
    decrypted_data = decrypt_frame(key, encrypted_frame, frame.pn)
    print("Decrypted Data:", decrypted_data)

if __name__ == "__main__":
    main()
