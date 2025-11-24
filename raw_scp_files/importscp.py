import re
import json
import os

def clean_wikidot_text(text):
    """
    Aggressively removes HTML artifacts, Wikidot syntax, modules, and metadata 
    to produce clean, readable text for the database.
    """
    if not text:
        return ""

    # --- 1. REMOVE HTML ARTIFACTS (New Step for Scraper Compatibility) ---
    # Remove the specific scraper headers
    text = re.sub(r"<h1>Page source</h1>", "", text, flags=re.IGNORECASE)
    text = re.sub(r"<div class=\"page-source\">", "", text, flags=re.IGNORECASE)
    text = re.sub(r"</div>\s*$", "", text, flags=re.IGNORECASE)
    
    # Remove generic HTML tags (e.g., <a href="..."> inside includes)
    # This keeps the text inside the tag but removes the brackets.
    text = re.sub(r"<[^>]+>", "", text)

    # --- 2. REMOVE WIKIDOT BLOCK CONTAINERS ---
    # [[>]] ... [[/>]] (Right aligned blocks, usually ratings)
    text = re.sub(r"\[\[>\]\][\s\S]*?\[\[/>\]\]", "", text)
    
    # [[div class="footer..."]] ... [[/div]] (Navigation arrows at bottom)
    text = re.sub(r"\[\[div class=\"footer-wikiwalk-nav\"\]\][\s\S]*?\[\[/div\]\]", "", text)

    # --- 3. REMOVE LICENSE BOXES ---
    # Standard Wiki format at the bottom
    # Matches the start of the license box down to the end component include
    text = re.sub(r"=====\s*> \*\*Filename:\*\*[\s\S]*?=====", "", text)
    text = re.sub(r"\[\[include.*?license-box-end.*?\]\]", "", text, flags=re.IGNORECASE)

    # --- 4. REMOVE STANDALONE MODULES AND INCLUDES ---
    # [[include ...]] (Images, components) - Uses [\s\S]*? to match across newlines
    text = re.sub(r"\[\[include[\s\S]*?\]\]", "", text, flags=re.IGNORECASE)
    # [[module ...]]
    text = re.sub(r"\[\[module[\s\S]*?\]\]", "", text, flags=re.IGNORECASE)
    # [[footnoteblock]]
    text = re.sub(r"\[\[footnoteblock\]\]", "", text, flags=re.IGNORECASE)

    # --- 5. CLEAN LINKS AND FORMATTING ---
    # Remove remaining generic tags [[...]] or [[/...]]
    text = re.sub(r"\[\[/?.*?\]\]", "", text)

    # [[[Link|Text]]] -> Text
    text = re.sub(r"\[\[\[.*?\|(.*?)\]\]\]", r"\1", text)
    # [[[Link]]] -> Link
    text = re.sub(r"\[\[\[(.*?)\]\]\]", r"\1", text)

    # Remove Bold/Italic/Strikethrough formatting (**text**, //text//, --text--)
    text = re.sub(r"(\*\*|//|--)", "", text)
    
    # Remove Navigation artifacts (<< | >>)
    text = re.sub(r"(<<|\||>>)", "", text)
    
    # --- 6. WHITESPACE CLEANUP ---
    # Collapse multiple newlines into max 2
    text = re.sub(r"\n{3,}", "\n\n", text)
    
    return text.strip()

def extract_section(clean_text, start_marker, end_markers):
    """
    Helper to extract text from the ALREADY CLEANED text 
    based on the cleaned headers.
    """
    # Escape markers and allow for flexible spacing/casing
    # We look for "Header:" followed by content
    pattern = re.escape(start_marker) + r"(.*?)(?=" + "|".join(map(re.escape, end_markers)) + r"|$)"
    match = re.search(pattern, clean_text, re.DOTALL | re.IGNORECASE)
    if match:
        return match.group(1).strip()
    return ""

def parse_scp_file(file_path):
    """
    Parses a raw SCP text file and returns a JSON-compatible dictionary.
    Works with both old manual text files and new scraped HTML-embedded files.
    """
    if not os.path.exists(file_path):
        print(f"Error: File {file_path} not found.")
        return None

    with open(file_path, 'r', encoding='utf-8') as f:
        raw_content = f.read()

    # --- STEP 1: CLEAN THE TEXT ---
    # This now handles stripping the HTML wrappers from the scraper
    clean_content = clean_wikidot_text(raw_content)

    scp_data = {
        "code": "",
        "title": "", 
        "containment_procedures": "",
        "full_description": clean_content, # Stores the clean, readable text
        "short_description": "", 
        "image_captions": "",
        "rating": None, 
        "state": "active", 
        "tags": "", 
        "link": "",
        "object_class": ""
    }

    # --- STEP 2: EXTRACT FIELDS (Using Raw Content for precision) ---
    
    # Extract Item Code (e.g., SCP-022)
    # We check raw content because the formatting (**Item #:**) is distinct
    code_match = re.search(r"\*\*Item #:\*\*\s*(SCP-[\w-]+)", raw_content, re.IGNORECASE)
    if code_match:
        scp_data["code"] = code_match.group(1).upper()
        scp_data["link"] = f"https://scp-wiki.wikidot.com/{scp_data['code'].lower()}"

    # Extract Image Captions
    # We check raw content because captions are inside [[include]] blocks that get stripped in cleanup
    img_match = re.search(r"caption=(.*?)(?:\||\]\])", raw_content, re.IGNORECASE)
    if img_match:
        # Strip any HTML tags that might be inside the caption (like <a> tags from the scraper)
        raw_caption = img_match.group(1).strip()
        scp_data["image_captions"] = re.sub(r"<[^>]+>", "", raw_caption)

    # --- STEP 3: EXTRACT FIELDS FROM CLEAN CONTENT ---
    
    # Extract Object Class 
    # In clean text, it appears as "Object Class: Safe" (no stars)
    class_match = re.search(r"Object Class:\s*(.*)", clean_content, re.IGNORECASE)
    if class_match:
        scp_data["object_class"] = class_match.group(1).strip()

    # Extract Containment Procedures
    # In clean text, it appears as "Special Containment Procedures: ..."
    scp_data["containment_procedures"] = extract_section(
        clean_content, 
        "Special Containment Procedures:", 
        ["Description:"]
    )
    
    return scp_data

def process_files(file_list):
    results = []
    for file_path in file_list:
        data = parse_scp_file(file_path)
        if data:
            results.append(data)
    return json.dumps(results, indent=4, ensure_ascii=False)

# ---------------------------------------------------------
# Execution
# ---------------------------------------------------------
if __name__ == "__main__":
    # Example usage:
    # Ensure you point this to your directory of files
    file_list = ['SCP-021.txt']
    
    # Dynamically find all .txt files in the current directory (or change path)
    files_to_parse = [f for f in os.listdir('.') if f.startswith('SCP-') and f.endswith('.txt')]
    
    if files_to_parse:
        json_output = process_files(files_to_parse)
        print(json_output)
    else:
        print("No SCP-XXX.txt files found in the current directory.")