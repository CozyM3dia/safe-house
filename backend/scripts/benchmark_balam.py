import asyncio
import time
import httpx

async def benchmark():
    lat, lon = -5.4297, 105.2625
    async with httpx.AsyncClient(base_url="http://localhost:8000", timeout=60.0) as client:
        t0 = time.time()
        res_audit = await client.post("/api/audit", json={"lat": lat, "lon": lon, "lang": "id"})
        t1 = time.time()
        print(f"1. /api/audit took {t1 - t0:.2f}s (status {res_audit.status_code})")
        audit_data = res_audit.json()
        print(f"   Address: {audit_data.get('address')}")
        print(f"   Score: {audit_data.get('safe_score')}")

        t2 = time.time()
        res_ai = await client.post("/api/narrative", json={"audit": audit_data, "lang": "id"})
        t3 = time.time()
        print(f"2. /api/narrative took {t3 - t2:.2f}s (status {res_ai.status_code})")

        t4 = time.time()
        res_chat = await client.post("/api/chat", json={"message": "Bagaimana tanah di sini?", "audit": audit_data, "lang": "id"})
        t5 = time.time()
        print(f"3. /api/chat took {t5 - t4:.2f}s (status {res_chat.status_code})")

        print(f"Total end-to-end: {t3 - t0:.2f}s")

if __name__ == "__main__":
    asyncio.run(benchmark())
