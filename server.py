#!/usr/bin/env python3
"""
Adhitthana Meditation Server
Lightweight Python HTTP + SQLite API server for Zabir & Soham's meditation tracker.
Zero external dependencies (uses standard Python library).
"""

import http.server
import socketserver
import json
import sqlite3
import os
import sys
import urllib.parse

PORT = 8000
DB_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'sits.db')
STATIC_DIR = os.path.dirname(os.path.abspath(__file__))

def init_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS sits (
            id TEXT PRIMARY KEY,
            room TEXT NOT NULL,
            user TEXT NOT NULL,
            date TEXT NOT NULL,
            durationMinutes REAL NOT NULL,
            targetMinutes REAL NOT NULL,
            status TEXT NOT NULL,
            movedAtMinutes REAL,
            movementReason TEXT,
            reflection TEXT,
            timestamp INTEGER NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

class AdhitthanaHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=STATIC_DIR, **kwargs)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == '/api/sits':
            self.handle_get_sits(parsed)
        elif parsed.path == '/api/health':
            self.send_json_response({'status': 'ok', 'app': 'Adhitthana Tracker'})
        else:
            super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == '/api/sits':
            self.handle_post_sit()
        elif parsed.path == '/api/sits/bulk':
            self.handle_bulk_sits()
        else:
            self.send_error(404, 'Endpoint Not Found')

    def do_DELETE(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path.startswith('/api/sits/'):
            sit_id = parsed.path.split('/')[-1]
            self.handle_delete_sit(sit_id)
        else:
            self.send_error(404, 'Endpoint Not Found')

    def send_json_response(self, data, status_code=200):
        body = json.dumps(data).encode('utf-8')
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def handle_get_sits(self, parsed):
        qs = urllib.parse.parse_qs(parsed.query)
        room = qs.get('room', ['zabir-soham'])[0]
        
        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        c.execute('SELECT * FROM sits WHERE room = ? ORDER BY timestamp DESC', (room,))
        rows = c.fetchall()
        conn.close()

        sits = [dict(r) for r in rows]
        self.send_json_response(sits)

    def handle_post_sit(self):
        content_len = int(self.headers.get('Content-Length', 0))
        post_body = self.rfile.read(content_len)
        try:
            data = json.loads(post_body.decode('utf-8'))
            room = data.get('room', 'zabir-soham')
            sit = data.get('sit', data)

            conn = sqlite3.connect(DB_FILE)
            c = conn.cursor()
            c.execute('''
                INSERT OR REPLACE INTO sits 
                (id, room, user, date, durationMinutes, targetMinutes, status, movedAtMinutes, movementReason, reflection, timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                sit.get('id'),
                room,
                sit.get('user'),
                sit.get('date'),
                sit.get('durationMinutes', 0),
                sit.get('targetMinutes', 0),
                sit.get('status', 'completed'),
                sit.get('movedAtMinutes'),
                sit.get('movementReason'),
                sit.get('reflection'),
                sit.get('timestamp', 0)
            ))
            conn.commit()
            conn.close()
            self.send_json_response({'success': True, 'sit': sit})
        except Exception as e:
            self.send_json_response({'error': str(e)}, status_code=400)

    def handle_bulk_sits(self):
        content_len = int(self.headers.get('Content-Length', 0))
        post_body = self.rfile.read(content_len)
        try:
            payload = json.loads(post_body.decode('utf-8'))
            room = payload.get('room', 'zabir-soham')
            sits = payload.get('sits', [])

            conn = sqlite3.connect(DB_FILE)
            c = conn.cursor()
            for sit in sits:
                c.execute('''
                    INSERT OR REPLACE INTO sits 
                    (id, room, user, date, durationMinutes, targetMinutes, status, movedAtMinutes, movementReason, reflection, timestamp)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    sit.get('id'),
                    room,
                    sit.get('user'),
                    sit.get('date'),
                    sit.get('durationMinutes', 0),
                    sit.get('targetMinutes', 0),
                    sit.get('status', 'completed'),
                    sit.get('movedAtMinutes'),
                    sit.get('movementReason'),
                    sit.get('reflection'),
                    sit.get('timestamp', 0)
                ))
            conn.commit()
            conn.close()
            self.send_json_response({'success': True, 'count': len(sits)})
        except Exception as e:
            self.send_json_response({'error': str(e)}, status_code=400)

    def handle_delete_sit(self, sit_id):
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        c.execute('DELETE FROM sits WHERE id = ?', (sit_id,))
        conn.commit()
        conn.close()
        self.send_json_response({'success': True, 'id': sit_id})

if __name__ == '__main__':
    init_db()
    print(f"✦ Adhitthana Meditation Tracker running at http://localhost:{PORT}")
    print(f"✦ Serving directory: {STATIC_DIR}")
    print(f"✦ SQLite Database: {DB_FILE}")
    print("✦ Press Ctrl+C to stop.")
    
    # Allow port reuse
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), AdhitthanaHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server.")
