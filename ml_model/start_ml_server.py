import os
import sys

if __name__ == '__main__':
    print("🚀 Starting Autism Assistant ML API Server on http://127.0.0.1:5001 ...")
    from flask_api import app
    app.run(host='0.0.0.0', port=5001, debug=False)
