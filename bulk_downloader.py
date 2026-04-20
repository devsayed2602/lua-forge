import os
import requests
import zipfile
import io
from concurrent.futures import ThreadPoolExecutor

def check_and_download(app_id, output_folder):
    url = f"https://steamgames554.s3.us-east-1.amazonaws.com/{app_id}.zip"
    try:
        # Optimization: We send a 'HEAD' request first instead of 'GET'.
        # A HEAD request just asks the server "Does this file exist?" WITHOUT downloading it.
        # This makes scanning 1000x faster and saves huge amounts of bandwidth.
        head = requests.head(url, timeout=5)
        
        # If it doesn't exist, we just skip it quietly.
        if head.status_code == 404 or head.status_code == 403:
            return 
            
        # If it DOES exist (status 200), we download it!
        if head.status_code == 200:
            print(f"[!] FOUND App ID {app_id}! Downloading...")
            response = requests.get(url, timeout=10)
            
            with zipfile.ZipFile(io.BytesIO(response.content)) as z:
                lua_files = [f for f in z.namelist() if f.endswith('.lua')]
                for file_name in lua_files:
                    # Read the raw .lua data without its zip-folder path
                    lua_bytes = z.read(file_name)
                    # Force it to export as just "{app_id}.lua" directly in the output folder
                    save_path = os.path.join(output_folder, f"{app_id}.lua")
                    with open(save_path, "wb") as f:
                        f.write(lua_bytes)
            print(f"[✓] Successfully saved lua data for {app_id}")
            
    except Exception as e:
        # Ignore random internet glitches or timeouts so the loop doesn't crash
        pass 

if __name__ == "__main__":
    folder = "bulk_lua_files"
    if not os.path.exists(folder):
        os.makedirs(folder)
        
    # The range to scan (Steam App IDs can go up to millions)
    # Steam usually started games at ID 10, then 20, 30, and eventually started using thousands.
    start_id = 123457
    end_id = 300000 
    
    # We use 50 "workers" to check 50 numbers at the exact same time!
    max_threads = 50 
    
    print(f"=== 🚀 Starting Bulk Scan for IDs {start_id} to {end_id} ===")
    print("This will check thousands of numbers rapidly. Press Ctrl+C to stop.")
    
    # Run the bulk scanner safely across threads
    with ThreadPoolExecutor(max_workers=max_threads) as executor:
        for app_id in range(start_id, end_id + 1):
            executor.submit(check_and_download, app_id, folder)
    
    print("=== Bulk Scan Complete ===")
