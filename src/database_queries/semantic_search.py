import sqlite3
import re
import os
import json
import numpy as np
from pathlib import Path
from typing import List, Dict, Any

# Global instances
_embedder = None
_hnsw_index = None

# Constants
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
RAW_DATA_PATH = BASE_DIR / "raw_scp_files" / "output.json"
DB_PATH = DATA_DIR / "scp_archive.db"
INDEX_PATH = DATA_DIR / "scp_hnsw.bin"

MODEL_NAME = "all-mpnet-base-v2"
SCP_REF_REGEX = re.compile(r"\bSCP[- ]?0*([0-9]{1,4})\b", flags=re.IGNORECASE)
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200

# --- Database Schema ---
SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS entries (
    id INTEGER PRIMARY KEY,
    scp_code TEXT,
    title TEXT,
    object_class TEXT,
    description TEXT,
    containment_procedures TEXT
);

CREATE TABLE IF NOT EXISTS chunks (
    id INTEGER PRIMARY KEY,
    entry_id INTEGER NOT NULL,
    chunk_order INTEGER NOT NULL,
    text TEXT,
    FOREIGN KEY(entry_id) REFERENCES entries(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS vecmap (
    idx INTEGER PRIMARY KEY,
    chunk_id INTEGER NOT NULL,
    FOREIGN KEY(chunk_id) REFERENCES chunks(id) ON DELETE CASCADE
);
"""

class LocalEmbedder:
    def __init__(self, model_name: str):
        from sentence_transformers import SentenceTransformer
        self.model = SentenceTransformer(model_name)
        self.dim = self.model.get_sentence_embedding_dimension()

    def embed(self, texts: List[str]) -> np.ndarray:
        return self.model.encode(texts, convert_to_numpy=True, show_progress_bar=True)

def get_embedder():
    global _embedder
    if _embedder is None:
        print(f"Loading Semantic Model: {MODEL_NAME}...")
        _embedder = LocalEmbedder(MODEL_NAME)
    return _embedder

def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> List[str]:
    if not text:
        return []
    text = text.strip()
    if len(text) <= chunk_size:
        return [text]
    chunks = []
    start = 0
    L = len(text)
    while start < L:
        end = start + chunk_size
        chunk = text[start:end]
        chunks.append(chunk.strip())
        if end >= L:
            break
        start = end - overlap
    return chunks

def build_vector_store():
    """
    Reads output.json, populates SQLite, creates embeddings, and builds HNSW index.
    """
    print("Building Vector Store from raw data...")
    
    if not os.path.exists(RAW_DATA_PATH):
        print(f"Error: Source file not found at {RAW_DATA_PATH}")
        return

    # Ensure data directory exists
    os.makedirs(DATA_DIR, exist_ok=True)

    # Initialize DB
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.executescript(SCHEMA_SQL)
    
    # Clear existing data to rebuild
    cur.execute("DELETE FROM vecmap")
    cur.execute("DELETE FROM chunks")
    cur.execute("DELETE FROM entries")
    conn.commit()

    # Read JSON
    with open(RAW_DATA_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)

    chunk_texts = []
    chunk_metadata = [] # (entry_id, chunk_order)

    print(f"Processing {len(data)} entries...")
    
    for entry in data:
        # Insert Entry
        cur.execute(
            "INSERT INTO entries (scp_code, title, object_class, description, containment_procedures) VALUES (?, ?, ?, ?, ?)",
            (
                entry.get('code', ''),
                entry.get('title', ''),
                entry.get('object_class', ''),
                entry.get('full_description', ''),
                entry.get('containment_procedures', '')
            )
        )
        entry_id = cur.lastrowid

        # Prepare text for chunking
        # We combine relevant fields to ensure context is captured
        full_text = f"{entry.get('code')} - {entry.get('title', '')}\n"
        full_text += f"Class: {entry.get('object_class')}\n\n"
        full_text += f"Containment:\n{entry.get('containment_procedures')}\n\n"
        full_text += f"Description:\n{entry.get('full_description')}"
        
        # Create chunks
        chunks = chunk_text(full_text)
        
        for i, text_chunk in enumerate(chunks):
            # We delay insertion into 'vecmap' until we have the HNSW index built,
            # but we insert into 'chunks' now to get IDs
            cur.execute("INSERT INTO chunks (entry_id, chunk_order, text) VALUES (?, ?, ?)", (entry_id, i, text_chunk))
            chunk_id = cur.lastrowid
            
            chunk_texts.append(text_chunk)
            chunk_metadata.append(chunk_id)

    conn.commit()

    # Generate Embeddings
    if chunk_texts:
        embedder = get_embedder()
        print(f"Generating embeddings for {len(chunk_texts)} chunks...")
        embeddings = embedder.embed(chunk_texts)

        # Build Index
        import hnswlib
        num_elements = len(embeddings)
        dim = embedder.dim
        
        # Declaring index
        p = hnswlib.Index(space='cosine', dim=dim)
        p.init_index(max_elements=num_elements, ef_construction=200, M=16)
        
        # Add items
        p.add_items(embeddings, np.arange(num_elements))
        
        # Save Index
        p.save_index(str(INDEX_PATH))
        
        # Map HNSW labels (0..N) back to database chunk_ids
        print("Saving vector mapping...")
        batch_vecmap = []
        for idx, chunk_id in enumerate(chunk_metadata):
            batch_vecmap.append((idx, chunk_id))
        
        cur.executemany("INSERT INTO vecmap (idx, chunk_id) VALUES (?, ?)", batch_vecmap)
        conn.commit()
        
    conn.close()
    print("Vector Store Build Complete.")

def load_hnsw_index(dim: int):
    import hnswlib
    # Check if files exist, if not build them
    if not os.path.exists(INDEX_PATH) or not os.path.exists(DB_PATH):
        print("Index or DB missing. Initiating build sequence...")
        build_vector_store()
    
    if not os.path.exists(INDEX_PATH):
        raise FileNotFoundError(f"Failed to build or locate index at {INDEX_PATH}")

    p = hnswlib.Index(space='cosine', dim=dim)
    p.load_index(str(INDEX_PATH))
    p.set_ef(100)
    return p

def rerank_by_tfidf(query: str, docs: List[str], top_n: int = 10) -> List[int]:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import linear_kernel
    if not docs:
        return []
    texts = [query] + docs
    vect = TfidfVectorizer(ngram_range=(1,2), max_features=20000).fit(texts)
    tfidf = vect.transform(texts)
    qvec = tfidf[0:1]
    docs_mat = tfidf[1:]
    sims = linear_kernel(qvec, docs_mat).flatten()
    ranked = sims.argsort()[::-1][:top_n]
    return ranked.tolist()

def perform_semantic_search(query: str, topk: int = 20) -> List[Dict[str, Any]]:
    """
    Executes a semantic search using HNSW + SQLite + TF-IDF Reranking.
    """
    # Ensure resources exist
    if not os.path.exists(DB_PATH):
        build_vector_store()

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # 1. FAST-PATH: Explicit SCP ID match
    m = SCP_REF_REGEX.search(query)
    if m:
        scp_num = m.group(1).lstrip("0")
        # Adjust query for new schema
        row = cur.execute("SELECT id, scp_code, title, object_class FROM entries WHERE scp_code LIKE ? OR scp_code LIKE ? LIMIT 1",
                          (f"%{scp_num}%", f"%{int(scp_num)}%")).fetchone()
        if row:
            snippet_row = cur.execute("SELECT text FROM chunks WHERE entry_id = ? LIMIT 1", (row[0],)).fetchone()
            conn.close()
            return [{
                "scp_id": row[0],
                "scp_code": row[1],
                "title": row[2],
                "object_class": row[3],
                "description": snippet_row[0][:500] + "..." if snippet_row else "", 
                "score": 100.0
            }]

    # 2. Get Embeddings & Index
    try:
        embedder = get_embedder()
        q_emb = embedder.embed([query])
        
        global _hnsw_index
        if _hnsw_index is None:
            _hnsw_index = load_hnsw_index(embedder.dim)
        
        # Query HNSW
        query_k = max(topk * 2, 50) 
        labels, _ = _hnsw_index.knn_query(q_emb, k=query_k)
        labels = labels[0].tolist()
        
        if not labels:
            return []
            
        placeholder = ",".join(["?"] * len(labels))
        rows = cur.execute(f"SELECT idx, chunk_id FROM vecmap WHERE idx IN ({placeholder})", labels).fetchall()
        idx_to_chunk = {r[0]: r[1] for r in rows}
        chunk_ids = [idx_to_chunk[idx] for idx in labels if idx in idx_to_chunk]
        
        if not chunk_ids:
            return []

        # Fetch chunk details
        placeholder2 = ",".join(["?"] * len(chunk_ids))
        chunks_rows = cur.execute(f"SELECT id, entry_id, text FROM chunks WHERE id IN ({placeholder2})", chunk_ids).fetchall()
        
        chunk_map = {r[0]: r for r in chunks_rows}
        ordered_chunks = [chunk_map[cid] for cid in chunk_ids if cid in chunk_map]
        
        candidate_texts = [r[2] for r in ordered_chunks]
        candidate_entry_ids = [r[1] for r in ordered_chunks]

        # 3. Rerank
        final_indices = rerank_by_tfidf(query, candidate_texts, top_n=min(len(candidate_texts), topk))
        
        # 4. Format Results
        seen_entries = set()
        results = []
        
        for idx in final_indices:
            entry_id = candidate_entry_ids[idx]
            if entry_id in seen_entries:
                continue
            seen_entries.add(entry_id)
            
            entry = cur.execute("SELECT id, scp_code, title, object_class FROM entries WHERE id = ?", (entry_id,)).fetchone()
            if entry:
                matched_snippet = candidate_texts[idx]
                
                results.append({
                    "scp_id": entry[0],
                    "scp_code": entry[1],
                    "title": entry[2],
                    "object_class": entry[3],
                    "description": matched_snippet[:300] + "...",
                    "score": 0.9
                })
                
        conn.close()
        return results

    except Exception as e:
        print(f"Semantic Search Error: {e}")
        conn.close()
        return []