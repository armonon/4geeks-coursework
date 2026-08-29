try:
    from flask import Flask, send_from_directory
except ImportError:
    print("You don't have Flask installed; run `pip3 install flask` and try again")
    raise SystemExit(1)

import os
import subprocess


static_file_dir = os.path.dirname(os.path.realpath(__file__))
app = Flask(__name__)
app.config["SEND_FILE_MAX_AGE_DEFAULT"] = 0


@app.route("/", methods=["GET"])
def serve_directory_index():
    process = subprocess.run(
        ["python3", "app.py"],
        input="6\n",
        capture_output=True,
        text=True,
        check=False,
    )
    if process.returncode == 0:
        return f"<pre>{process.stdout}</pre>"
    return f"<pre style='color: red'>{process.stderr}</pre>", 500


@app.route("/<path:requested_path>", methods=["GET"])
def serve_any_other_file(requested_path):
    return send_from_directory(static_file_dir, requested_path)


app.run(host="0.0.0.0", port=3000, debug=True, extra_files=["./"])
