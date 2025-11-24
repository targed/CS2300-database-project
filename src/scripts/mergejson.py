import json
import os

# ----------------------------------------------------------------------------
# CONFIGURATION
# ----------------------------------------------------------------------------
# 1. Save your parser output to this file
PARSED_FILE = 'raw_scp_files/output.json'

# 2. Save your existing (older) data to this file
EXISTING_FILE = 'existing_data.json'

# 3. Output file name
OUTPUT_FILE = 'merged_scp_data.json'

# ----------------------------------------------------------------------------
# MERGE LOGIC
# ----------------------------------------------------------------------------
def merge_scp_data(parsed_list, existing_list):
    """
    Merges the parsed text data with the existing metadata.
    """
    merged_results = []

    # Convert existing list to a dictionary keyed by SCP Code for fast lookup
    # e.g., { "SCP-021": { ...data... }, "SCP-022": { ...data... } }
    existing_lookup = {item.get('code'): item for item in existing_list}

    for parsed_item in parsed_list:
        code = parsed_item.get('code')
        
        # Start with the parsed item as the base (it has the best text formatting)
        final_item = parsed_item.copy()
        
        # Check if we have matching data in the existing database
        if code in existing_lookup:
            existing_item = existing_lookup[code]
            
            # --- MERGE FIELDS ---
            
            # 1. Title: Parsed is usually empty, Existing has the real title
            if not final_item.get('title') and existing_item.get('title'):
                final_item['title'] = existing_item['title']

            # 2. Tags: Parsed is empty, Existing has tags
            if not final_item.get('tags') and existing_item.get('tags'):
                final_item['tags'] = existing_item['tags']

            # 3. Rating: Parsed is null, Existing has numbers
            if final_item.get('rating') is None and existing_item.get('rating') is not None:
                final_item['rating'] = existing_item['rating']

            # 4. Image Captions: Handle key name mismatch
            # Dataset A uses "image_captions", Dataset B uses "image captions" (with space)
            if not final_item.get('image_captions'):
                # Try getting from B with space
                caption_from_b = existing_item.get('image captions') or existing_item.get('image_captions')
                if caption_from_b:
                    final_item['image_captions'] = caption_from_b

            # 5. Short Description: If existing has it and parsed doesn't
            if not final_item.get('short_description') and existing_item.get('short_description'):
                final_item['short_description'] = existing_item['short_description']
                
            # 6. full_description: Prefer existing version over parsed always
            if existing_item.get('full_description'):
                final_item['full_description'] = existing_item['full_description']

        merged_results.append(final_item)

    return merged_results

# ----------------------------------------------------------------------------
# MAIN EXECUTION
# ----------------------------------------------------------------------------
def main():
    # 1. Load Parsed Data
    if not os.path.exists(PARSED_FILE):
        print(f"Error: Could not find {PARSED_FILE}")
        return
    
    if not os.path.exists(EXISTING_FILE):
        print(f"Error: Could not find {EXISTING_FILE}")
        return

    try:
        with open(PARSED_FILE, 'r', encoding='utf-8') as f:
            parsed_data = json.load(f)
        
        with open(EXISTING_FILE, 'r', encoding='utf-8') as f:
            existing_data = json.load(f)

        print(f"Loaded {len(parsed_data)} parsed items and {len(existing_data)} existing items.")

        # 2. Perform Merge
        result_data = merge_scp_data(parsed_data, existing_data)

        # 3. Save Output
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(result_data, f, indent=4, ensure_ascii=False)
            
        print(f"Successfully merged data! Saved to '{OUTPUT_FILE}'.")
        print(f"Total records: {len(result_data)}")

    except json.JSONDecodeError as e:
        print(f"JSON Error: {e}")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    # Create dummy files for demonstration if they don't exist
    # (You would normally skip this part and just have your files ready)
    if not os.path.exists(PARSED_FILE) and not os.path.exists(EXISTING_FILE):
        print("Note: Please ensure 'parsed_output.json' and 'existing_data.json' exist.")
    else:
        main()