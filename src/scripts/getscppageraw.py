import requests
import re
import os
import html

# List the SCPs you want to download
# Get scps 21 - 200
SCPS_TO_FETCH = list(range(21, 201))
# SCPS_TO_FETCH = [21, 22, 23, 27, 49, 96, 173]

# Output directory
OUTPUT_DIR = "raw_scp_files"

def get_wikidot_source(scp_number):
    """
    Fetches the RAW Wikidot source code by mimicking the 'View Source' button click.
    """
    scp_slug = f"scp-{int(scp_number):03d}"
    url = f"https://scp-wiki.wikidot.com/{scp_slug}"
    
    print(f"Fetching {scp_slug}...")

    session = requests.Session()
    # headers to look like a real browser
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    })
    
    # 1. GET THE PAGE ID
    # We need to load the page first to get the internal ID and set cookies
    try:
        response = session.get(url)
        if response.status_code != 200:
            print(f"  Error: HTTP {response.status_code}")
            return None
    except Exception as e:
        print(f"  Connection Error: {e}")
        return None

    # Regex to find the variable "WIKIREQUEST.info.pageId = 12345;"
    # This ID is unique to every page and required for the API
    page_id_match = re.search(r"WIKIREQUEST\.info\.pageId\s*=\s*(\d+);", response.text)
    
    if not page_id_match:
        print("  Error: Could not find Page ID. Page might not exist.")
        return None
    
    page_id = page_id_match.group(1)

    # 2. PREPARE THE API REQUEST
    # Wikidot requires a token from the cookies to allow API access
    token = session.cookies.get('wikidot_token7')
    
    # If the cookie isn't there (sometimes happens on first load), force one
    if not token:
        token = '1234567890'
        session.cookies.set('wikidot_token7', token, domain='scp-wiki.wikidot.com')

    # This payload tells Wikidot "Give me the source code for this page ID"
    payload = {
        'moduleName': 'viewsource/ViewSourceModule',
        'page_id': page_id,
        'wikidot_token7': token
    }

    # 3. GET THE SOURCE
    ajax_url = "https://scp-wiki.wikidot.com/ajax-module-connector.php"
    
    try:
        # We must verify=False sometimes if SSL certs act up, but usually True is fine
        source_resp = session.post(ajax_url, data=payload)
        json_data = source_resp.json()
    except Exception as e:
        print(f"  Error getting source: {e}")
        return None

    if json_data.get('status') != 'ok':
        print("  Error: Wikidot API returned an error status.")
        return None

    # 4. CLEAN THE OUTPUT
    # The API returns the source wrapped in HTML div tags and escaped (e.g., <br> instead of newline)
    raw_body = json_data['body']

    # Convert HTML line breaks to real newlines
    clean_body = raw_body.replace("<br>", "\n").replace("<br/>", "\n").replace("<br />", "\n")

    # Remove the wrapper <div class="page-source">...</div>
    clean_body = re.sub(r"^<div class=\"page-source\">", "", clean_body)
    clean_body = re.sub(r"</div>$", "", clean_body)

    # Unescape HTML entities (e.g., changes "&lt;" back to "<", "&quot;" back to '"')
    clean_body = html.unescape(clean_body)

    return clean_body.strip()

def save_to_file(filename, content):
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        
    filepath = os.path.join(OUTPUT_DIR, filename)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"  Saved to {filepath}")

if __name__ == "__main__":
    for scp_num in SCPS_TO_FETCH:
        source_code = get_wikidot_source(scp_num)
        
        if source_code:
            filename = f"SCP-{int(scp_num):03d}.txt"
            save_to_file(filename, source_code)
            
    print("\nDownload complete.")