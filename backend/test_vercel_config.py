import json
import unittest
from pathlib import Path


class VercelConfigTests(unittest.TestCase):
    def test_fastapi_entrypoint_is_explicitly_built_and_routed(self):
        config_path = Path(__file__).with_name("vercel.json")
        config = json.loads(config_path.read_text(encoding="utf-8"))

        self.assertEqual(
            config["builds"],
            [{"src": "index.py", "use": "@vercel/python"}],
        )
        self.assertEqual(
            config["routes"],
            [{"src": "/(.*)", "dest": "index.py"}],
        )


if __name__ == "__main__":
    unittest.main()
