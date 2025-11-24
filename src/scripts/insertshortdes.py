import json
import re
import os

# ==============================================================================
# CONFIGURATION
# ==============================================================================
TEXT_INPUT_FILE = 'short_descriptions.txt'  # The text you pasted the descriptions into
JSON_INPUT_FILE = 'data/scpjsonmoreatrributes.json'           # Your existing JSON file
JSON_OUTPUT_FILE = 'scp_data_updated.json'  # The new file to save

def parse_text_file(filepath):
    """
    Parses the text file using Regex to extract SCP numbers and descriptions.
    Returns a dictionary: {'SCP-001': 'Description...', ...}
    """
    if not os.path.exists(filepath):
        print(f"Error: Could not find {filepath}")
        return {}

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Regex Pattern breakdown:
    # Scp\s+(\d+)                 -> Finds "Scp" followed by the number (Group 1)
    # \s+                         -> Skips newlines/spaces
    # "short description":\s*"    -> Finds the key and opening quote
    # (.*?)                       -> Captures the description text (Group 2)
    # "                           -> Finds the closing quote
    pattern = re.compile(r'Scp\s+(\d+)\s+"short description":\s*"(.*?)"', re.IGNORECASE | re.DOTALL)
    
    matches = pattern.findall(content)
    
    descriptions_map = {}
    
    for scp_num, desc_text in matches:
        # Format the number to match standard SCP format (e.g., "19" -> "SCP-019")
        formatted_code = f"SCP-{int(scp_num):03d}"
        
        # Clean up any accidental newlines within the description text
        clean_desc = desc_text.replace('\n', ' ').strip()
        
        descriptions_map[formatted_code] = clean_desc

    print(f"Found {len(descriptions_map)} descriptions in text file.")
    return descriptions_map

def update_json_data(json_path, desc_map, output_path):
    """
    Loads the JSON, injects the descriptions, and saves to a new file.
    """
    if not os.path.exists(json_path):
        print(f"Error: Could not find {json_path}")
        return

    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        updated_count = 0
        
        for entry in data:
            code = entry.get('code')
            
            # Check if we have a description for this SCP code
            if code in desc_map:
                entry['short_description'] = desc_map[code]
                updated_count += 1
        
        # Save the result
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
            
        print(f"Successfully updated {updated_count} entries in '{output_path}'.")
        
    except json.JSONDecodeError:
        print("Error: Failed to decode the JSON file. Please check its format.")

# ==============================================================================
# MAIN EXECUTION
# ==============================================================================
if __name__ == "__main__":
    # 1. Parse the text file
    descriptions = parse_text_file(TEXT_INPUT_FILE)
    
    # 2. Update the JSON
    if descriptions:
        update_json_data(JSON_INPUT_FILE, descriptions, JSON_OUTPUT_FILE)