import re
import os
import json
import numpy as np
import hnswlib
import pickle
from pathlib import Path
from typing import List, Dict, Any

# Import MySQL connection
try:
    from .db_connection import execute_query, get_cursor
except ImportError:
    import sys
    sys.path.append(str(Path(__file__).resolve().parent))
    from db_connection import execute_query, get_cursor

# Configuration
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
INDEX_PATH = DATA_DIR / "scp_hnsw.bin"

# Models
EMBEDDING_MODEL = "all-mpnet-base-v2"
RERANK_MODEL = "cross-encoder/ms-marco-MiniLM-L-6-v2"

# Settings
CHUNK_SIZE = 800 
CHUNK_OVERLAP = 100
BATCH_SIZE = 32  
HNSW_DIM = 768   

# Globals
_embedder = None
_cross_encoder = None
_hnsw_index = None

# MySQL Schema for Semantic Data
CREATE_TABLES_SQL = [
    """
    CREATE TABLE IF NOT EXISTS SCP_SEMANTIC_CHUNKS (
        chunk_id INT AUTO_INCREMENT PRIMARY KEY,
        ref_id INT NOT NULL,
        ref_type VARCHAR(20),
        scp_code VARCHAR(100) NOT NULL,
        chunk_index INT NOT NULL,
        chunk_text LONGTEXT,
        embedding_blob LONGBLOB,
        FULLTEXT (chunk_text) 
    );
    """
]

# Model Management
def get_embedder():
    global _embedder
    if _embedder is None:
        print(f"Loading Embedding Model: {EMBEDDING_MODEL}...")
        from sentence_transformers import SentenceTransformer
        _embedder = SentenceTransformer(EMBEDDING_MODEL)
    return _embedder

def get_cross_encoder():
    global _cross_encoder
    if _cross_encoder is None:
        print(f"Loading Reranker: {RERANK_MODEL}...")
        from sentence_transformers import CrossEncoder
        _cross_encoder = CrossEncoder(RERANK_MODEL)
    return _cross_encoder

def load_hnsw_index():
    global _hnsw_index
    if _hnsw_index is not None:
        return _hnsw_index

    if not os.path.exists(INDEX_PATH):
        print("HNSW Index missing. Checking MySQL for vectors...")
        rebuild_index_from_mysql()
    
    if not os.path.exists(INDEX_PATH):
        return None

    try:
        p = hnswlib.Index(space='cosine', dim=HNSW_DIM)
        p.load_index(str(INDEX_PATH))
        p.set_ef(100)
        _hnsw_index = p
        return p
    except Exception as e:
        print(f"Error loading index (triggering rebuild): {e}")
        rebuild_index_from_mysql()
        return load_hnsw_index()

# Utilities
def chunk_text(text: str) -> List[str]:
    if not text: return []
    text = text.strip()
    tokens = text.split()
    if not tokens: return []
    chunks = []
    for i in range(0, len(tokens), CHUNK_SIZE - CHUNK_OVERLAP):
        chunk = " ".join(tokens[i:i + CHUNK_SIZE])
        chunks.append(chunk)
    return chunks

def ensure_tables_exist():
    try:
        check = execute_query("SHOW TABLES LIKE 'SCP_SEMANTIC_CHUNKS'", fetch_one=True)
        if not check:
            print("Initializing MySQL Semantic Tables...")
            with get_cursor() as (cursor, conn):
                for sql in CREATE_TABLES_SQL:
                    cursor.execute(sql)
                conn.commit()
    except Exception as e:
        print(f"Database Initialization Error: {e}")

# Core Logic

def rebuild_index_from_mysql():
    print("Rebuilding HNSW Index from MySQL...")
    ensure_tables_exist()
    
    try:
        rows = execute_query("SELECT chunk_id, embedding_blob FROM SCP_SEMANTIC_CHUNKS ORDER BY chunk_id ASC")
    except Exception as e:
        print(f"Failed to fetch vectors: {e}")
        return

    if not rows:
        print("No vectors found in MySQL.")
        os.makedirs(DATA_DIR, exist_ok=True)
        p = hnswlib.Index(space='cosine', dim=HNSW_DIM)
        p.init_index(max_elements=10, ef_construction=100, M=16)
        p.save_index(str(INDEX_PATH))
        return

    vectors = []
    for row in rows:
        try:
            vec = pickle.loads(row['embedding_blob'])
            vectors.append(vec)
        except:
            continue

    num_elements = len(vectors)
    data_matrix = np.vstack(vectors)

    os.makedirs(DATA_DIR, exist_ok=True)
    p = hnswlib.Index(space='cosine', dim=HNSW_DIM)
    p.init_index(max_elements=num_elements, ef_construction=200, M=16)
    p.add_items(data_matrix, np.arange(num_elements))
    
    p.save_index(str(INDEX_PATH))
    
    print(f"Index Rebuild Complete. {num_elements} vectors indexed.")
    global _hnsw_index
    _hnsw_index = None

def remove_from_vector_store(scp_code: str):
    print(f"--- REMOVING {scp_code} FROM VECTOR STORE ---")
    ensure_tables_exist()
    execute_query("DELETE FROM SCP_SEMANTIC_CHUNKS WHERE scp_code = %s", (scp_code,))
    rebuild_index_from_mysql()

def update_vector_store():
    print("--- STARTING SEMANTIC SYNC (ALL ENTITIES) ---")
    ensure_tables_exist()

    raw_scps = execute_query("SELECT scp_id, scp_code, title, object_class, full_description, containment_procedures FROM SCP") or []
    raw_personnel = execute_query("SELECT person_id, callsign, given_name, surname, role, notes FROM PERSONNEL") or []
    raw_mtf = execute_query("SELECT mtf_id, designation, nickname, primary_role, notes FROM MOBILE_TASK_FORCE") or []
    raw_facilities = execute_query("SELECT facility_id, code, name, purpose, city, country FROM FACILITY") or []
    raw_incidents = execute_query("SELECT incident_id, title, incident_date, summary, severity_level FROM INCIDENT") or []

    all_entries = []

    for p in raw_scps:
        all_entries.append({
            'ref_id': p['scp_id'],
            'ref_type': 'SCP',
            'code': p['scp_code'],
            'text': f"{p['scp_code']} {p.get('title','')}\nClass: {p.get('object_class','')}\n\n{p.get('containment_procedures','')}\n\n{p.get('full_description','')}"
        })

    for p in raw_personnel:
        name = f"{p.get('given_name','')} {p.get('surname','')}".strip()
        code = p.get('callsign') if p.get('callsign') else name
        all_entries.append({
            'ref_id': p['person_id'],
            'ref_type': 'PERSONNEL',
            'code': code,
            'text': f"Personnel: {name}\nCallsign: {p.get('callsign','')}\nRole: {p.get('role','')}\n\nNotes:\n{p.get('notes','')}"
        })

    for m in raw_mtf:
        all_entries.append({
            'ref_id': m['mtf_id'],
            'ref_type': 'MTF',
            'code': m['designation'],
            'text': f"Mobile Task Force {m['designation']} '{m.get('nickname','')}'\nRole: {m.get('primary_role','')}\n\nNotes:\n{m.get('notes','')}"
        })

    for f in raw_facilities:
        all_entries.append({
            'ref_id': f['facility_id'],
            'ref_type': 'FACILITY',
            'code': f.get('code', f"Facility-{f['facility_id']}"),
            'text': f"Facility: {f.get('name','')} ({f.get('code','')})\nLocation: {f.get('city','')}, {f.get('country','')}\n\nPurpose:\n{f.get('purpose','')}"
        })

    for i in raw_incidents:
        all_entries.append({
            'ref_id': i['incident_id'],
            'ref_type': 'INCIDENT',
            'code': f"INC-{i['incident_id']}",
            'text': f"Incident Report: {i.get('title','')}\nDate: {i.get('incident_date','')}\nSeverity: {i.get('severity_level','')}\n\nSummary:\n{i.get('summary','')}"
        })

    processed_rows = execute_query("SELECT DISTINCT scp_code FROM SCP_SEMANTIC_CHUNKS")
    processed_codes = set(r['scp_code'] for r in processed_rows) if processed_rows else set()
    
    current_codes = set(e['code'] for e in all_entries)
    
    to_add = [e for e in all_entries if e['code'] not in processed_codes]
    to_remove = processed_codes - current_codes

    if to_remove:
        print(f"Removing {len(to_remove)} orphaned entries...")
        with get_cursor() as (cursor, conn):
            format_strings = ','.join(['%s'] * len(to_remove))
            cursor.execute(f"DELETE FROM SCP_SEMANTIC_CHUNKS WHERE scp_code IN ({format_strings})", list(to_remove))
    
    if to_add:
        print(f"Processing {len(to_add)} NEW entries...")
        embedder = get_embedder()
        batch_text = []
        batch_meta = []

        with get_cursor() as (cursor, conn):
            for entry in to_add:
                for idx, txt in enumerate(chunk_text(entry['text'])):
                    batch_text.append(txt)
                    batch_meta.append({
                        'ref_id': entry['ref_id'],
                        'ref_type': entry['ref_type'],
                        'code': entry['code'],
                        'idx': idx,
                        'text': txt
                    })

                    if len(batch_text) >= BATCH_SIZE:
                        embs = embedder.encode(batch_text, convert_to_numpy=True)
                        for i, emb in enumerate(embs):
                            m = batch_meta[i]
                            blob = pickle.dumps(emb)
                            cursor.execute(
                                """
                                INSERT INTO SCP_SEMANTIC_CHUNKS 
                                (ref_id, ref_type, scp_code, chunk_index, chunk_text, embedding_blob)
                                VALUES (%s, %s, %s, %s, %s, %s)
                                """,
                                (m['ref_id'], m['ref_type'], m['code'], m['idx'], m['text'], blob)
                            )
                        conn.commit()
                        batch_text, batch_meta = [], []
            
            if batch_text:
                embs = embedder.encode(batch_text, convert_to_numpy=True)
                for i, emb in enumerate(embs):
                    m = batch_meta[i]
                    blob = pickle.dumps(emb)
                    cursor.execute(
                        """
                        INSERT INTO SCP_SEMANTIC_CHUNKS 
                        (ref_id, ref_type, scp_code, chunk_index, chunk_text, embedding_blob)
                        VALUES (%s, %s, %s, %s, %s, %s)
                        """,
                        (m['ref_id'], m['ref_type'], m['code'], m['idx'], m['text'], blob)
                    )
                conn.commit()

    if to_add or to_remove or not os.path.exists(INDEX_PATH):
        rebuild_index_from_mysql()

    print("--- SYNC COMPLETE ---")

def perform_semantic_search(query: str, topk: int = 20) -> List[Dict[str, Any]]:
    ensure_tables_exist()

    scp_match = re.search(r"\bSCP[- ]?0*([0-9]{1,4})\b", query, re.IGNORECASE)
    if scp_match:
        try:
            scp_num = f"SCP-{int(scp_match.group(1)):03d}"
            row = execute_query("SELECT scp_id, scp_code, title, object_class, full_description FROM SCP WHERE scp_code LIKE %s LIMIT 1", (f"%{scp_num}%",), fetch_one=True)
            if row:
                return [{
                    "id": row['scp_id'],
                    "type": "SCP",
                    "scp_code": row['scp_code'], 
                    "title": row['title'], 
                    "object_class": row['object_class'], 
                    "description": row['full_description'][:500] + "...", 
                    "score": 1.0
                }]
        except: pass

    try:
        index = load_hnsw_index()
        if not index: return []
        
        if index.get_current_count() == 0:
            update_vector_store()
            index = load_hnsw_index()
            if index.get_current_count() == 0: return []

        query_k = min(topk * 2, index.get_current_count())
        embedder = get_embedder()
        q_emb = embedder.encode([query], convert_to_numpy=True)
        labels, _ = index.knn_query(q_emb, k=query_k)
        
        candidate_chunk_ids = set()
        
        all_ids = execute_query("SELECT chunk_id FROM SCP_SEMANTIC_CHUNKS ORDER BY chunk_id ASC")
        if all_ids:
            id_list = [r['chunk_id'] for r in all_ids]
            for label in labels[0]:
                if label < len(id_list):
                    candidate_chunk_ids.add(id_list[label])

        keyword_rows = execute_query(
            "SELECT chunk_id FROM SCP_SEMANTIC_CHUNKS WHERE MATCH(chunk_text) AGAINST (%s IN NATURAL LANGUAGE MODE) LIMIT %s",
            (query, topk)
        )
        if keyword_rows:
            for r in keyword_rows: candidate_chunk_ids.add(r['chunk_id'])

        if not candidate_chunk_ids: return []

        format_strings = ','.join(['%s'] * len(candidate_chunk_ids))
        chunk_rows = execute_query(
            f"SELECT chunk_id, ref_id, ref_type, scp_code, chunk_text FROM SCP_SEMANTIC_CHUNKS WHERE chunk_id IN ({format_strings})",
            list(candidate_chunk_ids)
        )
        
        reranker = get_cross_encoder()
        scores = reranker.predict([[query, row['chunk_text']] for row in chunk_rows])
        
        results = []
        seen = set()
        sorted_rows = sorted(zip(chunk_rows, scores), key=lambda x: x[1], reverse=True)
        
        for row, score in sorted_rows:
            unique_key = f"{row['ref_type']}_{row['ref_id']}"
            if unique_key not in seen:
                seen.add(unique_key)
                
                title = ""
                obj_class = ""
                
                if row['ref_type'] == 'SCP':
                    r = execute_query("SELECT title, object_class FROM SCP WHERE scp_id=%s", (row['ref_id'],), fetch_one=True)
                    if r: title, obj_class = r['title'], r['object_class']
                elif row['ref_type'] == 'PERSONNEL':
                    r = execute_query("SELECT given_name, surname, role FROM PERSONNEL WHERE person_id=%s", (row['ref_id'],), fetch_one=True)
                    if r: 
                        title = f"{r['given_name']} {r['surname']}"
                        obj_class = r['role']
                elif row['ref_type'] == 'MTF':
                    r = execute_query("SELECT nickname FROM MOBILE_TASK_FORCE WHERE mtf_id=%s", (row['ref_id'],), fetch_one=True)
                    if r: 
                        title = r['nickname']
                        obj_class = "Mobile Task Force"
                elif row['ref_type'] == 'FACILITY':
                    r = execute_query("SELECT name FROM FACILITY WHERE facility_id=%s", (row['ref_id'],), fetch_one=True)
                    if r: 
                        title = r['name']
                        obj_class = "Facility"
                elif row['ref_type'] == 'INCIDENT':
                    r = execute_query("SELECT title, severity_level FROM INCIDENT WHERE incident_id=%s", (row['ref_id'],), fetch_one=True)
                    if r: 
                        title = r['title']
                        obj_class = f"Severity {r['severity_level']}"

                results.append({
                    "id": row['ref_id'],
                    "type": row['ref_type'],
                    "scp_code": row['scp_code'], 
                    "title": title, 
                    "object_class": obj_class, 
                    "description": row['chunk_text'][:400] + "...", 
                    "score": float(score)
                })
                
                if len(results) >= topk: break
        return results

    except Exception as e:
        print(f"Search Error: {e}")
        return []

if __name__ == "__main__":
    update_vector_store()