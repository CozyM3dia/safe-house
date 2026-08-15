import unittest


class VercelEntrypointTests(unittest.TestCase):
    def test_entrypoint_exports_fastapi_application(self):
        from index import app

        self.assertEqual(app.title, "S.A.F.E House API")


if __name__ == "__main__":
    unittest.main()
