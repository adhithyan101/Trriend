from http.server import BaseHTTPRequestHandler, HTTPServer
import json

import database
import ai
from routes import (
    create_crisis_report,
    get_crisis_reports,
    create_aid_resource,
    get_aid_resources,
    create_volunteer,
    get_volunteers,
    match_crisis_cooperation
)


class Server(BaseHTTPRequestHandler):

    def send_json(self, status_code, data):
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

        self.wfile.write(json.dumps(data).encode())

    def do_OPTIONS(self):
        self.send_json(200, {"message": "OK"})

    def do_GET(self):
        path = self.path.split("?")[0]

        if path == "/":
            self.send_json(200, {
                "message": "CO-RESOLVE backend is running"
            })

        elif path == "/crisis":
            reports = get_crisis_reports()
            self.send_json(200, reports)

        elif path == "/resources":
            resources = get_aid_resources()
            self.send_json(200, resources)

        elif path == "/volunteers":
            volunteers = get_volunteers()
            self.send_json(200, volunteers)

        else:
            self.send_json(404, {
                "error": "Route not found"
            })

    def do_POST(self):
        path = self.path.split("?")[0]
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length)

        try:
            data = json.loads(body.decode()) if body else {}
        except Exception as e:
            self.send_json(400, {"error": f"Invalid JSON body: {str(e)}"})
            return

        if path == "/crisis":
            try:
                title = data.get("title")
                description = data.get("description")
                location = data.get("location")
                urgency = data.get("urgency")

                result = create_crisis_report(
                    title,
                    description,
                    location,
                    urgency
                )

                self.send_json(201, result)

            except Exception as e:
                self.send_json(400, {
                    "error": str(e)
                })

        elif path == "/resources":
            try:
                name = data.get("name")
                capability = data.get("capability")
                location = data.get("location")
                resource_type = data.get("resource_type", "general")
                contact = data.get("contact", "")

                result = create_aid_resource(
                    name=name,
                    capability=capability,
                    location=location,
                    resource_type=resource_type,
                    contact=contact
                )
                self.send_json(201, result)
            except Exception as e:
                self.send_json(400, {"error": str(e)})

        elif path == "/volunteers":
            try:
                name = data.get("name")
                skills = data.get("skills")
                location = data.get("location")
                availability = data.get("availability", "Available")
                contact = data.get("contact", "")

                result = create_volunteer(
                    name=name,
                    skills=skills,
                    location=location,
                    availability=availability,
                    contact=contact
                )
                self.send_json(201, result)
            except Exception as e:
                self.send_json(400, {"error": str(e)})

        elif path in ("/crisis/match", "/match"):
            try:
                matches = match_crisis_cooperation(data)
                self.send_json(200, matches)
            except Exception as e:
                self.send_json(500, {"error": f"Matching error: {str(e)}"})

        else:
            self.send_json(404, {
                "error": "Route not found"
            })


def start_server():
    # Initialize SQLite database
    try:
        database.init_db()
        print("[Database] SQLite initialized successfully at data/co_resolve.db")
    except Exception as e:
        print(f"[Database Error] Could not initialize database: {e}")

    # Initialize AI / Qdrant engine (fails gracefully without blocking)
    try:
        ai.init_ai()
    except Exception as e:
        print(f"[AI Startup Warning] AI engine initialization deferred: {e}")

    server = HTTPServer(("localhost", 8000), Server)
    print("CO-RESOLVE backend running at http://localhost:8000")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    start_server()
else:
    # Also support direct execution if imported or invoked without __name__ == '__main__'
    pass