import os
import requests
import zipfile
import io

def download_remlua(app_id, output_folder="lua_files"):
    """
    Downloads and extracts the .lua files for a given Steam App ID from remlua.com bypassing the website completely.
    """
    # RemLua stores its files directly in this public AWS S3 bucket!
    # By hitting this URL directly, we bypass all the website's cooldowns and search restrictions.
    url = f"https://steamgames554.s3.us-east-1.amazonaws.com/{app_id}.zip"
    
    # Create the output directory if it doesn't exist
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)
        
    print(f"[*] Downloading data for App ID: {app_id}...")
    
    try:
        # Download the zip file directly into memory
        response = requests.get(url)
        response.raise_for_status() # Raise an error if the download fails (e.g., 404 ID Not Found)
        
        print(f"[*] Download successful! Extracting .lua files...")
        
        # Read the zip file from memory (no need to save the actual .zip to disk)
        with zipfile.ZipFile(io.BytesIO(response.content)) as z:
            # Look for any .lua files inside the zip
            lua_files = [f for f in z.namelist() if f.endswith('.lua')]
            
            if not lua_files:
                print(f"[-] No .lua files found inside the zip for App ID {app_id}.")
                return
                
            for file_name in lua_files:
                # Extract the file to the output folder
                extracted_path = z.extract(file_name, output_folder)
                print(f"[+] Successfully saved: {extracted_path}")
                
    except requests.exceptions.HTTPError as e:
        if response.status_code == 404:
            print(f"[-] Error: App ID {app_id} not found in RemLua's database.")
        else:
            print(f"[-] HTTP Error: {e}")
    except Exception as e:
        print(f"[-] An unexpected error occurred: {e}")

if __name__ == "__main__":
    print("=== RemLua Auto-Downloader ===")
    print("Press Ctrl+C to exit.")
    while True:
        try:
            user_input = input("\nEnter a Steam App ID (e.g. 730): ")
            if user_input.strip().isdigit():
                download_remlua(user_input.strip())
            else:
                print("[-] Please enter a valid numeric App ID.")
        except KeyboardInterrupt:
            print("\nExiting...")
            break
