"""Regression test for both local frontend origins in development."""

import unittest

from main import _origins


class CorsConfigTests(unittest.TestCase):
    def test_local_frontend_origins_are_allowed(self):
        self.assertIn("http://localhost:5173", _origins)
        self.assertIn("http://127.0.0.1:5173", _origins)
