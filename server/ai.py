import os
import sys
import atexit

VECTOR_DIM = 384
MODEL_NAME = "BAAI/bge-small-en-v1.5"

COLLECTION_CRISES = "crisis_reports"
COLLECTION_RESOURCES = "aid_resources"
COLLECTION_VOLUNTEERS = "volunteers"

_qdrant_client = None
_embedding_model = None
_ai_ready = False
_init_error = None

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BACKEND_DIR, "data")
QDRANT_PATH = os.path.join(DATA_DIR, "qdrant_db")


def is_ai_ready():
    global _ai_ready
    return _ai_ready


def get_qdrant_client():
    global _qdrant_client, _init_error
    if _qdrant_client is not None:
        return _qdrant_client

    try:
        from qdrant_client import QdrantClient

        qdrant_url = os.environ.get("QDRANT_URL")
        qdrant_api_key = os.environ.get("QDRANT_API_KEY")

        if qdrant_url:
            print(f"[Qdrant] Connecting to remote Qdrant at {qdrant_url}")
            _qdrant_client = QdrantClient(url=qdrant_url, api_key=qdrant_api_key)
        else:
            os.makedirs(DATA_DIR, exist_ok=True)
            print(f"[Qdrant] Initializing local storage at {QDRANT_PATH}")
            _qdrant_client = QdrantClient(path=QDRANT_PATH)

        return _qdrant_client
    except Exception as e:
        _init_error = str(e)
        print(f"[Qdrant Warning] Could not initialize Qdrant client: {e}")
        return None


def get_embedding_model():
    global _embedding_model, _init_error
    if _embedding_model is not None:
        return _embedding_model

    try:
        from fastembed import TextEmbedding
        print(f"[FastEmbed] Loading embedding model {MODEL_NAME} ({VECTOR_DIM} dimensions)...")
        _embedding_model = TextEmbedding(model_name=MODEL_NAME)
        return _embedding_model
    except Exception as e:
        _init_error = str(e)
        print(f"[FastEmbed Warning] Could not load FastEmbed model: {e}")
        return None


def init_ai():
    global _ai_ready, _init_error
    if _ai_ready:
        return True

    try:
        from qdrant_client.models import VectorParams, Distance

        client = get_qdrant_client()
        if client is None:
            return False

        model = get_embedding_model()
        if model is None:
            return False

        # Initialize collections
        collections = [COLLECTION_CRISES, COLLECTION_RESOURCES, COLLECTION_VOLUNTEERS]
        for col in collections:
            if not client.collection_exists(col):
                client.create_collection(
                    collection_name=col,
                    vectors_config=VectorParams(size=VECTOR_DIM, distance=Distance.COSINE)
                )
                print(f"[Qdrant] Collection '{col}' created successfully.")

        _ai_ready = True
        print("[AI Engine] Qdrant & FastEmbed initialized successfully.")
        return True
    except Exception as e:
        _init_error = str(e)
        print(f"[AI Engine Warning] Initialization deferred or failed: {e}")
        _ai_ready = False
        return False


def create_embedding(text):
    if not _ai_ready:
        if not init_ai():
            return None

    try:
        model = get_embedding_model()
        if model is None:
            return None
        embeddings = list(model.embed([text]))
        if embeddings:
            return embeddings[0].tolist()
        return None
    except Exception as e:
        print(f"[AI Embedding Error] {e}")
        return None


def index_crisis(crisis_id, title, description, location, urgency):
    try:
        if not _ai_ready:
            if not init_ai():
                return False

        client = get_qdrant_client()
        if client is None:
            return False

        from qdrant_client.models import PointStruct

        embed_text = f"Crisis Title: {title}. Location: {location}. Urgency: {urgency}. Description: {description}."
        vector = create_embedding(embed_text)
        if vector is None:
            return False

        point = PointStruct(
            id=int(crisis_id),
            vector=vector,
            payload={
                "id": int(crisis_id),
                "title": title,
                "description": description,
                "location": location,
                "urgency": urgency,
                "type": "crisis"
            }
        )

        client.upsert(
            collection_name=COLLECTION_CRISES,
            points=[point]
        )
        return True
    except Exception as e:
        print(f"[Qdrant Crisis Index Error] {e}")
        return False


def index_resource(resource_id, name, capability, location, resource_type, contact=None):
    try:
        if not _ai_ready:
            if not init_ai():
                return False

        client = get_qdrant_client()
        if client is None:
            return False

        from qdrant_client.models import PointStruct

        embed_text = f"Aid Resource: {name}. Category: {resource_type}. Capability: {capability}. Location: {location}."
        vector = create_embedding(embed_text)
        if vector is None:
            return False

        point = PointStruct(
            id=int(resource_id),
            vector=vector,
            payload={
                "id": int(resource_id),
                "name": name,
                "capability": capability,
                "location": location,
                "resource_type": resource_type,
                "contact": contact or "",
                "type": "aid_resource"
            }
        )

        client.upsert(
            collection_name=COLLECTION_RESOURCES,
            points=[point]
        )
        return True
    except Exception as e:
        print(f"[Qdrant Resource Index Error] {e}")
        return False


def index_volunteer(volunteer_id, name, skills, location, availability=None, contact=None):
    try:
        if not _ai_ready:
            if not init_ai():
                return False

        client = get_qdrant_client()
        if client is None:
            return False

        from qdrant_client.models import PointStruct

        embed_text = f"Volunteer: {name}. Skills: {skills}. Location: {location}. Availability: {availability or 'Available'}."
        vector = create_embedding(embed_text)
        if vector is None:
            return False

        point = PointStruct(
            id=int(volunteer_id),
            vector=vector,
            payload={
                "id": int(volunteer_id),
                "name": name,
                "skills": skills,
                "location": location,
                "availability": availability or "Available",
                "contact": contact or "",
                "type": "volunteer"
            }
        )

        client.upsert(
            collection_name=COLLECTION_VOLUNTEERS,
            points=[point]
        )
        return True
    except Exception as e:
        print(f"[Qdrant Volunteer Index Error] {e}")
        return False


def find_matching_resources(crisis_query_or_dict, top_k=5, min_score=0.25):
    try:
        if not _ai_ready:
            if not init_ai():
                return []

        client = get_qdrant_client()
        if client is None:
            return []

        if isinstance(crisis_query_or_dict, dict):
            title = crisis_query_or_dict.get("title", "")
            description = crisis_query_or_dict.get("description", "")
            location = crisis_query_or_dict.get("location", "")
            urgency = crisis_query_or_dict.get("urgency", "")
            query_text = f"Crisis: {title}. Location: {location}. Urgency: {urgency}. Details: {description}"
        else:
            query_text = str(crisis_query_or_dict)

        vector = create_embedding(query_text)
        if vector is None:
            return []

        response = client.query_points(
            collection_name=COLLECTION_RESOURCES,
            query=vector,
            limit=top_k
        )

        matched = []
        for point in response.points:
            score = float(point.score)
            if score >= min_score:
                matched.append({
                    "id": point.payload.get("id"),
                    "name": point.payload.get("name"),
                    "capability": point.payload.get("capability"),
                    "location": point.payload.get("location"),
                    "resource_type": point.payload.get("resource_type"),
                    "contact": point.payload.get("contact"),
                    "similarity_score": round(score, 4),
                    "type": "aid_resource"
                })

        return matched
    except Exception as e:
        print(f"[Find Matching Resources Error] {e}")
        return []


def find_matching_volunteers(crisis_query_or_dict, top_k=5, min_score=0.25):
    try:
        if not _ai_ready:
            if not init_ai():
                return []

        client = get_qdrant_client()
        if client is None:
            return []

        if isinstance(crisis_query_or_dict, dict):
            title = crisis_query_or_dict.get("title", "")
            description = crisis_query_or_dict.get("description", "")
            location = crisis_query_or_dict.get("location", "")
            urgency = crisis_query_or_dict.get("urgency", "")
            query_text = f"Crisis: {title}. Location: {location}. Urgency: {urgency}. Skills needed: {description}"
        else:
            query_text = str(crisis_query_or_dict)

        vector = create_embedding(query_text)
        if vector is None:
            return []

        response = client.query_points(
            collection_name=COLLECTION_VOLUNTEERS,
            query=vector,
            limit=top_k
        )

        matched = []
        for point in response.points:
            score = float(point.score)
            if score >= min_score:
                matched.append({
                    "id": point.payload.get("id"),
                    "name": point.payload.get("name"),
                    "skills": point.payload.get("skills"),
                    "location": point.payload.get("location"),
                    "availability": point.payload.get("availability"),
                    "contact": point.payload.get("contact"),
                    "similarity_score": round(score, 4),
                    "type": "volunteer"
                })

        return matched
    except Exception as e:
        print(f"[Find Matching Volunteers Error] {e}")
        return []


def match_crisis_to_cooperation(crisis_query_or_dict, top_k=5, min_score=0.25):
    resources = find_matching_resources(crisis_query_or_dict, top_k=top_k, min_score=min_score)
    volunteers = find_matching_volunteers(crisis_query_or_dict, top_k=top_k, min_score=min_score)

    return {
        "matched_resources": resources,
        "matched_volunteers": volunteers,
        "total_matches": len(resources) + len(volunteers)
    }


def close_qdrant():
    global _qdrant_client
    if _qdrant_client is not None:
        try:
            _qdrant_client.close()
        except Exception:
            pass


atexit.register(close_qdrant)
