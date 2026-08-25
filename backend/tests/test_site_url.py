"""Asal publik: jangan default ke safehouse.web.id yang NXDOMAIN."""

import unittest
from unittest.mock import MagicMock, patch

from services.site_url import (
    DEFAULT_PUBLIC_ORIGIN,
    backend_public_origin,
    configured_public_origin,
    public_site_origin,
)


def _request(host="https://safehouse-pull.emergent.host/"):
    req = MagicMock()
    req.base_url = host
    return req


class SiteUrlTests(unittest.TestCase):
    def test_request_host_used_when_env_empty(self):
        with patch.dict("os.environ", {"PUBLIC_SITE_URL": ""}, clear=False):
            self.assertIsNone(configured_public_origin())
            self.assertEqual(
                "https://safehouse-pull.emergent.host",
                public_site_origin(_request()),
            )

    def test_dead_web_id_ignored_unless_forced(self):
        with patch.dict(
            "os.environ",
            {"PUBLIC_SITE_URL": "https://safehouse.web.id/", "PUBLIC_SITE_ALLOW_UNRESOLVED": ""},
            clear=False,
        ):
            self.assertIsNone(configured_public_origin())
            self.assertEqual(
                "https://safehouse-pull.emergent.host",
                public_site_origin(_request()),
            )

    def test_live_env_wins(self):
        with patch.dict(
            "os.environ",
            {"PUBLIC_SITE_URL": "https://safehouse-pull.emergent.host/"},
            clear=False,
        ):
            self.assertEqual(
                "https://safehouse-pull.emergent.host",
                configured_public_origin(),
            )

    def test_unresolved_allowed_when_flag_set(self):
        with patch.dict(
            "os.environ",
            {
                "PUBLIC_SITE_URL": "https://safehouse.web.id",
                "PUBLIC_SITE_ALLOW_UNRESOLVED": "1",
            },
            clear=False,
        ):
            self.assertEqual("https://safehouse.web.id", configured_public_origin())

    def test_backend_url_ignores_dead_host(self):
        with patch.dict(
            "os.environ",
            {"BACKEND_PUBLIC_URL": "https://safehouse.web.id", "PUBLIC_SITE_ALLOW_UNRESOLVED": ""},
            clear=False,
        ):
            self.assertEqual(
                "http://testserver",
                backend_public_origin(_request("http://testserver/")),
            )

    def test_default_origin_is_emergent(self):
        self.assertEqual("https://safehouse-pull.emergent.host", DEFAULT_PUBLIC_ORIGIN)


if __name__ == "__main__":
    unittest.main()
