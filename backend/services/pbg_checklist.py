"""Checklist kelengkapan teknis PBG — deterministik dari hasil audit.

Bukan nasihat hukum: daftar ini menerjemahkan angka audit menjadi dokumen
teknis yang lazim diminta saat pengajuan PBG (PP 16/2021), dengan rujukan
SNI yang relevan. Pemilihan item murni berbasis ambang yang sama dengan
yang dipakai engine dan laporan; tidak ada panggilan jaringan dan tidak ada
lapis AI di modul ini.
"""

from __future__ import annotations

from typing import Any, Optional


def _item(
    id: str,
    priority: str,
    sni_refs: Optional[list[str]] = None,
    **params: Any,
) -> dict[str, Any]:
    return {
        "id": id,
        "priority": priority,
        "sni_refs": sni_refs or [],
        "params": params,
    }


def build_pbg_checklist(
    geotech: dict[str, Any],
    flood_class: Optional[float | int],
    flood_known: bool,
    landslide_class: Optional[float | int],
    landslide_known: bool,
    subsidence_risk: Optional[int | float],
    tsunami_band: Optional[str],
) -> list[dict[str, Any]]:
    """Susun daftar dokumen teknis PBG dari parameter audit.

    Semua ambang memakai konvensi yang sama dengan laporan:
    - FS < 1,0 rawan likuefaksi; 1,0-1,4 kawasan abu-abu.
    - Sesar <= 5 km perlu kajian zona sesar; <= 15 km layak diperiksa.
    - Kelas InaRISK >= 2 berarti bahaya terpetakan sedang/tinggi.
    """
    items: list[dict[str, Any]] = []

    # Penyelidikan tanah selalu wajib — seluruh audit ini screening level,
    # keputusan akhir butuh data lapangan.
    items.append(_item("soil_investigation", "wajib", ["SNI 8460:2017"]))

    site_class = geotech.get("site_class")
    pga_surface = geotech.get("pga_surface")
    if pga_surface is not None and site_class:
        items.append(
            _item(
                "seismic_design_spectrum",
                "wajib",
                ["SNI 1726:2019"],
                pga_surface=pga_surface,
                site_class=site_class,
            )
        )
        if site_class in ("SD", "SE") or pga_surface >= 0.4:
            items.append(
                _item(
                    "ductile_detailing",
                    "wajib",
                    ["SNI 2847:2019", "SNI 1726:2019"],
                    site_class=site_class,
                )
            )

    fs = geotech.get("fs")
    if fs is not None:
        if fs < 1.0:
            items.append(
                _item("liquefaction_study", "wajib", ["SNI 8460:2017"], fs=round(fs, 2))
            )
        elif fs < 1.4:
            items.append(
                _item(
                    "liquefaction_study",
                    "disarankan",
                    ["SNI 8460:2017"],
                    fs=round(fs, 2),
                )
            )

    fault = geotech.get("nearest_fault") or {}
    fault_km = fault.get("distance_km")
    if fault_km is not None:
        if fault_km <= 5:
            items.append(
                _item(
                    "fault_zone_review",
                    "wajib",
                    [],
                    fault_name=fault.get("name"),
                    distance_km=fault_km,
                )
            )
        elif fault_km <= 15:
            items.append(
                _item(
                    "fault_zone_review",
                    "disarankan",
                    [],
                    fault_name=fault.get("name"),
                    distance_km=fault_km,
                )
            )

    if flood_known and flood_class is not None and flood_class >= 2:
        items.append(
            _item("flood_proofing", "wajib", [], flood_class=int(flood_class))
        )

    if landslide_known and landslide_class is not None and landslide_class >= 2:
        items.append(
            _item(
                "slope_stability",
                "wajib" if landslide_class >= 3 else "disarankan",
                [],
                landslide_class=int(landslide_class),
            )
        )

    if (
        subsidence_risk is not None
        and subsidence_risk >= 60
    ):
        items.append(_item("subsidence_monitoring", "disarankan", []))

    if tsunami_band in ("TINGGI", "MODERAT-TINGGI"):
        items.append(_item("tsunami_readiness", "disarankan", []))

    return items
