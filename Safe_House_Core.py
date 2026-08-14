import re
import requests
import asyncio
import aiohttp
import json
import math
from google import genai 
from openai import OpenAI
from colorama import Fore, Style, init

# Inisialisasi Colorama
init(autoreset=True)

# --- CONFIGURATION ---
# Kunci diambil dari environment. Jangan pernah menaruh nilai kunci di sini.
import os
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
MAPS_API_KEY = os.getenv("MAPS_API_KEY", "")
USE_GEMMA_ONLY = False 
current_or_model = "" # Inisialisasi variabel global agar terbaca oleh linter

# --- GEOLOGY & SEISMOTECTONIC DATA ---
ACTIVE_FAULTS = [
    {"name": "Semangko Timur (Lampung)", "coords": (-5.480, 104.720)},
    {"name": "Semangko Barat (Lampung)", "coords": (-5.500, 104.650)},
    {"name": "Sesar Tarahan (Bandar Lampung)", "coords": (-5.510, 105.320)}
]

VOLCANOES = [
    {"name": "G. Krakatau", "coords": (-6.102, 105.423)},
    {"name": "G. Rajabasa", "coords": (-5.78, 105.63)},
    {"name": "G. Tanggamus", "coords": (-5.42, 104.72)}
]

MEGATHRUST = [
    {"name": "Sunda Megathrust (Sunda Strait Segment)", "coords": (-6.50, 104.50)}
]

COASTLINE_LAMPUNG = [
    {"name": "Teluk Lampung", "coords": (-5.45, 105.28)},
    {"name": "Pesisir Kalianda", "coords": (-5.75, 105.58)}
]

# --- REGIONAL HAZARD DATA (PGA Design dari PuSGeN) ---
REGIONAL_PGA = {
    "Bandar Lampung": 0.42,
    "Lampung Selatan (Kalianda)": 0.48,
    "Lampung Barat (Liwa)": 0.55,
    "Pesawaran": 0.40,
    "Metro": 0.35,
    "Default": 0.45
}

def get_site_amplification(site_class, pga):
    fa_table = {
        "SA": {0.25: 0.8, 0.5: 0.8, 1.0: 0.8},
        "SB": {0.25: 0.9, 0.5: 0.9, 1.0: 0.9},
        "SC": {0.25: 1.3, 0.5: 1.2, 1.0: 1.2},
        "SD": {0.25: 1.6, 0.5: 1.4, 1.0: 1.2},
        "SE": {0.25: 2.4, 0.5: 1.7, 1.0: 1.2}
    }
    pga_ref = 0.25 if pga <= 0.25 else 0.5 if pga <= 0.5 else 1.0
    return fa_table.get(site_class, fa_table["SD"]).get(pga_ref, 1.2)

def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)

def get_nearest_point(lat, lon, points_list):
    min_dist = float('inf')
    nearest_name = "N/A"
    for p in points_list:
        dist = haversine(lat, lon, p["coords"][0], p["coords"][1])
        if dist < min_dist:
            min_dist = dist
            nearest_name = p["name"]
    return nearest_name, min_dist

def calculate_vs30(elevasi, lat, lon):
    if elevasi < 15: return 160
    if elevasi < 50: return 280
    if elevasi < 150: return 450
    return 760

def calculate_liquefaction_fs(lat, lon, elevasi, earthquake_data):
    g = 9.81
    rd = 0.9
    vs30 = calculate_vs30(elevasi, lat, lon)
    site_class = "SE" if vs30 < 180 else "SD" if vs30 < 360 else "SC"
    
    pga = REGIONAL_PGA["Default"]
    if lat < -5.3 and lon > 105.1: pga = REGIONAL_PGA["Bandar Lampung"]
    if lat < -5.6: pga = REGIONAL_PGA["Lampung Selatan (Kalianda)"]
    if lon < 104.5: pga = REGIONAL_PGA["Lampung Barat (Liwa)"]

    fa = get_site_amplification(site_class, pga)
    pga_surface = round(pga * fa, 3)

    if vs30 < 180: crr = 0.12
    elif vs30 < 360: crr = 0.28
    else: crr = 0.65

    stress_ratio = 1.3 if vs30 < 180 else 1.1
    csr = 0.65 * stress_ratio * (pga_surface) * rd
    
    fs = round(crr / csr, 2) if csr > 0 else 10.0
    status = "RAWAN" if fs < 1.0 else "AMAN"
    
    h_est = 30 if vs30 < 200 else 15
    t0 = round((4 * h_est) / vs30, 2)

    return {
        "fs_score": fs, 
        "status": status, 
        "vs30_est": f"{vs30} m/s",
        "site_class": site_class,
        "pga_design_base": pga,
        "amplification_fa": fa,
        "pga_surface": pga_surface,
        "t0_resonance": f"{t0}s"
    }

async def get_nearby_pois(lat, lon):
    # Query Overpass untuk mencari sungai, jalan, dan fasilitas dalam radius 200m
    query = f"""
    [out:json];
    (
      node(around:200, {lat}, {lon})["waterway"];
       way(around:200, {lat}, {lon})["waterway"];
       node(around:2000, {lat}, {lon})["landuse"="landfill"];
       way(around:2000, {lat}, {lon})["landuse"="landfill"];
       node(around:200, {lat}, {lon})["amenity"];
       way(around:200, {lat}, {lon})["highway"];
    );
    out body 5;
    """
    url = "https://overpass-api.de/api/interpreter"
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(url, data=query, timeout=10) as resp:
                data = await resp.json()
                features = []
                for element in data.get("elements", []):
                    tags = element.get("tags", {})
                    name = tags.get("name") or tags.get("waterway") or tags.get("amenity") or tags.get("highway")
                    if name: features.append(name)
                return list(set(features))[:5] # Ambil 5 objek unik saja
    except: return []

async def get_address(lat, lon):
    url = f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lon}&format=json"
    headers = {"User-Agent": "SAFE_House_Assistant/1.0"}
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers) as resp:
                data = await resp.json()
                return data.get("display_name", "Lokasi tidak terdeteksi")
    except: return "Koordinat Terproteksi"

def compress_payload(raw_data, lat, lon, address, nearby):
    compressed = {
        "address": address, 
        "coordinates": {"lat": lat, "lon": lon},
        "nearby_env": nearby
    }
    elevasi = 0
    try:
        env = raw_data.get("env_data", {})
        if env:
            elevasi = env.get("elevation", 0)
            compressed["elevasi"] = f"{elevasi}m"
    except: pass

    eq_raw = raw_data.get("earthquake_risk", {})
    compressed["liquefaction_analysis"] = calculate_liquefaction_fs(lat, lon, elevasi, eq_raw)

    fault_name, fault_dist = get_nearest_point(lat, lon, ACTIVE_FAULTS)
    volcano_name, volcano_dist = get_nearest_point(lat, lon, VOLCANOES)
    mega_name, mega_dist = get_nearest_point(lat, lon, MEGATHRUST)
    coast_name, coast_dist = get_nearest_point(lat, lon, COASTLINE_LAMPUNG)

    compressed["seismotectonic"] = {
        "nearest_fault": {"name": fault_name, "dist_km": fault_dist},
        "nearest_volcano": {"name": volcano_name, "dist_km": volcano_dist},
        "megathrust_dist_km": mega_dist
    }

    tsunami_risk = "RENDAH"
    if coast_dist < 3 and elevasi < 15: tsunami_risk = "MODERAT"
    if coast_dist < 1 and elevasi < 7: tsunami_risk = "TINGGI"
    
    compressed["tsunami_analysis"] = {"risk_level": tsunami_risk, "dist_to_coast_km": coast_dist}

    # --- EKSTRAK DATA INARISK (Banjir & Longsor) ---
    flood_val = "RENDAH/TIDAK TERDETEKSI"
    try:
        f_feat = raw_data.get("flood_risk", {}).get("features", [])
        if f_feat: flood_val = "TINGGI" # Jika ada di layer bahaya, tandai Tinggi/Moderat
    except: pass
    compressed["flood_hazard"] = flood_val

    landslide_val = "RENDAH/TIDAK TERDETEKSI"
    try:
        l_feat = raw_data.get("landslide_risk", {}).get("features", [])
        if l_feat: landslide_val = "TINGGI/RAWAN"
    except: pass
    compressed["landslide_hazard"] = landslide_val

    try:
        elev_data = raw_data.get("elevation", {}).get("elevation", [0])
        compressed["elevation_mdpl"] = elev_data[0]
    except: compressed["elevation_mdpl"] = "Unknown"

    try:
        air = raw_data.get("air_quality", {}).get("current", {})
        if air:
            compressed["env_extras"] = {
                "aqi": air.get("european_aqi"),
                "pm25": f"{air.get('pm2_5')} µg/m³",
                "soil_temp_10cm": f"{raw_data.get('env_data', {}).get('current', {}).get('soil_temperature_6cm', 'N/A')}°C",
                "humidity": f"{raw_data.get('env_data', {}).get('current', {}).get('relative_humidity_2m', 'N/A')}%"
            }
    except: pass

    # --- EKSTRAK SEJARAH GEMPA (USGS) ---
    try:
        eq_hist = raw_data.get("historical_eq", {}).get("features", [])
        if eq_hist:
            top_eq = eq_hist[0]["properties"]
            compressed["historical_event"] = {
                "magnitude": top_eq["mag"],
                "place": top_eq["place"],
                "date": top_eq["time"]
            }
    except: pass

    return compressed

async def fetch_api(session, url, name):
    try:
        async with session.get(url, timeout=10) as response:
            if response.status == 200: return name, await response.json()
            return name, None
    except: return name, None

async def get_all_data(lat, lon):
    rad = f"geometry={lon},{lat}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&distance=200&units=esriSRUnit_Meter&f=json"
    urls = {
        "env_data": f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=relative_humidity_2m,soil_temperature_6cm&daily=precipitation_sum,uv_index_max&timezone=auto&elevation=true",
        "air_quality": f"https://air-quality-api.open-meteo.com/v1/air-quality?latitude={lat}&longitude={lon}&current=pm2_5,european_aqi",
        "elevation": f"https://api.open-meteo.com/v1/elevation?latitude={lat}&longitude={lon}",
        "historical_eq": f"https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&latitude={lat}&longitude={lon}&maxradiuskm=100&minmagnitude=4.5&limit=1",
        "flood_risk": f"https://gis.bnpb.go.id/server/rest/services/inarisk/layer_bahaya_banjir_30/MapServer/0/query?{rad}&outFields=*",
        "earthquake_risk": f"https://gis.bnpb.go.id/server/rest/services/inarisk/layer_bahaya_gempabumi_30/MapServer/0/query?{rad}&outFields=*",
        "landslide_risk": f"https://gis.bnpb.go.id/server/rest/services/inarisk/layer_bahaya_tanahlongsor_30/MapServer/0/query?{rad}&outFields=*"
    }
    async with aiohttp.ClientSession() as session:
        tasks = [fetch_api(session, url, name) for name, url in urls.items()]
        results = await asyncio.gather(*tasks)
        return dict(results)

def extract_coords_from_link(link):
    regex_list = [r"@(-?\d+\.\d+),(-?\d+\.\d+)", r"ll=(-?\d+\.\d+),(-?\d+\.\d+)", r"q=(-?\d+\.\d+),(-?\d+\.\d+)"]
    for regex in regex_list:
        match = re.search(regex, link)
        if match: return float(match.group(1)), float(match.group(2))
    try:
        res = requests.get(link, allow_redirects=True, timeout=10)
        for regex in regex_list:
            match = re.search(regex, res.url)
            if match: return float(match.group(1)), float(match.group(2))
    except: pass
    return None, None

async def process_location(link):
    lat, lon = extract_coords_from_link(link)
    if not lat or not lon: return None, None, None
    address = await get_address(lat, lon)
    nearby = await get_nearby_pois(lat, lon) 
    raw_data = await get_all_data(lat, lon)
    clean_data = compress_payload(raw_data, lat, lon, address, nearby)
    sv_url = f"https://maps.googleapis.com/maps/api/streetview?size=600x400&location={lat},{lon}&key={MAPS_API_KEY}"
    
    image_part = None
    try:
        img_resp = requests.get(sv_url, timeout=10)
        if img_resp.status_code == 200:
            image_part = genai.types.Part.from_bytes(data=img_resp.content, mime_type="image/jpeg")
            print(f"📸 Visual Street View {address[:20]}... diunduh.")
    except: pass
    
    return clean_data, image_part, address

async def main():
    global current_or_model
    current_or_model = "google/gemma-4-31b-it:free"
    client = genai.Client(api_key=GEMINI_API_KEY)
    print("\n" + "═"*55 + "\n🛡️ S.A.F.E HOUSE v8.0 - BATTLE MODE ENABLED\n" + "═"*55)
    
    link_a = input("🔗 Tempel Link Properti Utama: ").strip()
    if not link_a: return
    link_b = input("🔗 Tempel Link Properti Pembanding (Kosongkan jika hanya 1 lokasi): ").strip()
    
    print("\n🔍 Menghubungkan ke otak AI & Mengunduh Data Geospasial...")
    
    data_a, img_a, addr_a = await process_location(link_a)
    if not data_a:
        print("❌ Link pertama tidak valid.")
        return
        
    is_battle_mode = False
    data_b, img_b, addr_b = None, None, None
    
    if link_b:
        data_b, img_b, addr_b = await process_location(link_b)
        if data_b: is_battle_mode = True

    if is_battle_mode:
        sys_ins = (
            "Kamu adalah S.A.F.E House AI, pakar Geofisika & Penasihat Investasi Properti.\n"
            "Tugasmu: Lakukan 'PROPERTY BATTLE' (Perbandingan 2 Lokasi) dengan struktur:\n\n"
            "1. ### 🏆 THE VERDICT\n"
            "   - Tentukan pemenang (Properti mana yang lebih aman & minim risiko).\n\n"
            "2. ### ⚔️ HEAD-TO-HEAD COMPARISON\n"
            "   - Gunakan Tabel Markdown dengan kolom: | Parameter | Properti 1 | Properti 2 | Winner | \n"
            "   - Parameter wajib: Vs30, Site Class, Amplifikasi (Fa), Skor Likuefaksi, Elevasi, Jarak Sesar.\n\n"
            "3. ### 🌋 ENVIRONMENTAL CONTRAST\n"
            "   - Bandingkan ancaman sesar aktif, TPA/Lindi, dan sejarah gempa USGS.\n\n"
            "4. ### 💡 MITIGATION COST ANALYSIS\n"
            "   - Evaluasi properti mana yang akan memakan biaya perbaikan fondasi lebih mahal.\n"
        )
        payload = {"Properti_1": data_a, "Properti_2": data_b}
        prompt = [
            f"Bandingkan Properti 1 ({addr_a}) dan Properti 2 ({addr_b}).",
            "Data Geospasial: " + json.dumps(payload)
        ]
        if img_a: prompt.append(img_a)
        if img_b: prompt.append(img_b)
    else:
        sys_ins = (
            "Kamu adalah S.A.F.E House AI, pakar Geofisika & Geoteknik tingkat tinggi (SNI 1726:2019).\n"
            "Tugasmu: Berikan 'PROPERTY SECURITY AUDIT' dengan struktur BERIKUT:\n\n"
            "1. ### 🛡️ EXECUTIVE SUMMARY\n"
            "   - S.A.F.E Score & Status Risiko.\n\n"
            "2. ### 🏗️ GEOTECHNICAL ANALYSIS (SNI 1726:2019)\n"
            "   - Jelaskan Vs30, Fa, Elevasi (mdpl), dan kondisi Tanah (Suhu/Lembap).\n"
            "   - Gunakan Analogi Volume Speaker.\n\n"
            "3. ### 🌋 SEISMOTECTONIC & HAZARD MAP\n"
            "   - Jarak Sesar, Megathrust, Gunung Api.\n"
            "   - Analisis Lingkungan: Cek keberadaan TPA/Landfill untuk potensi polusi air lindi (leachate).\n\n"
            "4. ### 💡 REKOMENDASI MITIGASI\n"
        )
        prompt = [
            f"Lakukan audit visual & geofisika. Lokasi: {addr_a}.\n",
            "Data Properti: " + json.dumps(data_a) + "\n",
            "Tugas Utama: Gunakan foto Street View yang terlampir untuk menganalisis kondisi mikro properti!\n"
            "1. Kondisi selokan/drainase\n2. Retakan aspal/dinding\n3. Elevasi relatif."
        ]
        if img_a: prompt.append(img_a)

    or_history = [
        {"role": "system", "content": sys_ins},
        {"role": "user", "content": "Mulai Analisis Geospasial"}
    ]
    print("\n🔍 Mulai Analisis AI...")
    try:
        if USE_GEMMA_ONLY: raise Exception("FORCE_GEMMA_MODE")
        
        chat_session = client.chats.create(model='gemini-2.5-flash', config={"system_instruction": sys_ins})
        response = chat_session.send_message(prompt)
        is_openrouter = False
        
        or_history.append({"role": "assistant", "content": response.text})
        print("✅ Terhubung: Google Gemini 2.5 Flash")
    except Exception as e:
        if any(err in str(e) for err in ["429", "503", "RESOURCE", "UNAVAILABLE", "FORCE_GEMMA_MODE"]):
            print(f"⚠️ Gangguan Gemini ({e})! Pindah ke sistem cadangan...")
            or_client = OpenAI(base_url="https://openrouter.ai/api/v1", api_key=OPENROUTER_API_KEY)
            
            fallback_models = [
                "google/gemma-4-31b-it:free", 
                "meta-llama/llama-3.1-8b-instruct:free",
                "mistralai/mistral-7b-instruct:free",
                "deepseek/deepseek-chat:free"
            ]
            response_text = ""
            
            for model_name in fallback_models:
                try:
                    print(f"📡 Mencoba model cadangan: {model_name}...")
                    or_response = or_client.chat.completions.create(
                        model=model_name,
                        messages=or_history
                    )
                    response_text = or_response.choices[0].message.content
                    current_or_model = model_name
                    break
                except:
                    print(f"⚠️ {model_name} juga limit, mencoba model berikutnya...")
                    continue
            
            if not response_text:
                try:
                    print("🏠 Semua Cloud sibuk! Menggunakan Otak Lokal (Ollama)...")
                    local_client = OpenAI(base_url="http://localhost:11434/v1", api_key="ollama")
                    or_response = local_client.chat.completions.create(
                        model="gemma4:e4b",
                        messages=or_history
                    )
                    response_text = or_response.choices[0].message.content
                    current_or_model = "Ollama/Local"
                    or_client = local_client
                    print("✅ Berhasil menggunakan Otak Lokal.")
                except:
                    print(f"{Fore.RED}❌ Semua model Cloud & Lokal gagal. Pastikan Ollama sudah berjalan."); return
                
            or_history.append({"role": "assistant", "content": response_text})
            is_openrouter = True
        else:
            print(f"{Fore.RED}❌ Kesalahan: {e}"); return

    print(f"\n{Fore.CYAN}🏠 HASIL ANALISIS S.A.F.E HOUSE:{Style.RESET_ALL}\n" + "─"*50)
    print(response.text if not is_openrouter else response_text)
    print("─"*50)
    while True:
        user_input = input("\n👤 Anda: ")
        if user_input.lower() in ['exit', 'keluar', 'quit']: break
        if not is_openrouter:
            try:
                response = chat_session.send_message(user_input)
                print(f"\n🏠 AI (Gemini): {response.text}")
                # Backup history ke OpenRouter (Jaga-jaga kalau nanti switch)
                or_history.append({"role": "user", "content": user_input})
                or_history.append({"role": "assistant", "content": response.text})
            except Exception as e:
                if any(err in str(e) for err in ["429", "503", "RESOURCE", "UNAVAILABLE"]):
                    print("⚠️ Gemini Limit saat chat! Pindah ke sistem cadangan...")
                    is_openrouter = True
                    or_client = OpenAI(base_url="https://openrouter.ai/api/v1", api_key=OPENROUTER_API_KEY)
                else:
                    print(f"❌ Kesalahan: {e}"); continue
        
        if is_openrouter:
            or_history.append({"role": "user", "content": user_input})
            try:
                or_response = or_client.chat.completions.create(
                    model=current_or_model,
                    messages=or_history,
                    extra_body={"include_reasoning": True}
                )
                reply = or_response.choices[0].message.content
                or_history.append({"role": "assistant", "content": reply})
                print(f"\n🏠 AI ({current_or_model}): {reply}")
            except:
                print("⚠️ Model ini sedang sibuk, silakan tanya lagi dalam beberapa detik..."); continue

if __name__ == "__main__":
    asyncio.run(main())