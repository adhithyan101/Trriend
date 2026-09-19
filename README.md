# CO-RESOLVE Backend

CO-RESOLVE is an AI-powered cooperative crisis-response platform designed for rapid disaster coordination. It pairs real-world crisis reports with relevant aid resources, volunteer capabilities, and organizational support using vector semantic search.

---

## 1. Installation & Setup

### Prerequisites
- Python 3.10+ (tested and compatible with Python 3.14)
- (Optional) Qdrant Cloud or local Docker instance; if omitted, the backend automatically uses embedded on-disk Qdrant storage.

### Install Dependencies
Run from the `backend/` root directory:
```bash
pip install -r requirement.txt
```

Dependencies in [`requirement.txt`](requirement.txt):
- `qdrant-client`: Official Qdrant vector database SDK.
- `fastembed`: Lightweight local CPU embedding engine (zero API key required).

---

## 2. Starting the Backend

Start the server using Python's built-in HTTP server:
```bash
python server/server.py
```

Output:
```
[Database] SQLite initialized successfully at data/co_resolve.db
[Qdrant] Initializing local storage at ...\backend\data\qdrant_db
[FastEmbed] Loading embedding model BAAI/bge-small-en-v1.5 (384 dimensions)...
[AI Engine] Qdrant & FastEmbed initialized successfully.
CO-RESOLVE backend running at http://localhost:8000
```

---

## 3. Storage Architecture

### Persistent Relational Storage (SQLite)
- **Path**: `data/co_resolve.db`
- Managed by: [`server/database.py`](server/database.py)
- Stores crisis reports, registered aid resources, and volunteer records persistently. Data survives server restarts and crashes.

### Vector Storage (Qdrant)
- **Local Path**: `data/qdrant_db/`
- Managed by: [`server/ai.py`](server/ai.py)
- Stores dense semantic embeddings across 3 collections:
  - `crisis_reports`: Semantic embeddings of reported crises.
  - `aid_resources`: Embeddings of relief gear, rescue equipment, medical clinics, food/water distribution, and shelters.
  - `volunteers`: Embeddings of volunteer skills, certifications, and availability.

### Configuration via Environment Variables
By default, the backend runs in embedded local storage mode. To point to an external or cloud Qdrant cluster:

```bash
# Windows PowerShell
$env:QDRANT_URL = "https://your-cluster-id.us-east4-0.gcp.cloud.qdrant.io:6333"
$env:QDRANT_API_KEY = "your-qdrant-api-key"

# Linux / macOS
export QDRANT_URL="https://your-cluster-id.us-east4-0.gcp.cloud.qdrant.io:6333"
export QDRANT_API_KEY="your-qdrant-api-key"
```

If these environment variables are unset, the system gracefully falls back to local storage without throwing errors.

---

## 4. How AI Matching Works

1. **Embedding Generation**: Uses FastEmbed's `BAAI/bge-small-en-v1.5` model to generate 384-dimensional dense semantic vectors.
2. **Indexing**: When a crisis report, aid resource, or volunteer profile is submitted, text fields (title, description, location, capability, skills) are contextualized and converted into vector points.
3. **Similarity Search**: When a crisis matching request is received:
   - The crisis situation is embedded into vector space.
   - Qdrant computes Cosine similarity (`Distance.COSINE`) against registered resources and volunteers.
   - Matches exceeding the relevance threshold are returned with similarity scores (e.g. `0.73+`).
   - If no relevant resources exist, an empty list is returned (no hallucinated matches).

---

## 5. API Reference & Examples

### A. Health Check
```http
GET http://localhost:8000/
```
**Response (200 OK)**:
```json
{
  "message": "CO-RESOLVE backend is running"
}
```

---

### B. Crisis Management

#### Retrieve Crisis Reports
```http
GET http://localhost:8000/crisis
```
**Response (200 OK)**:
```json
[
  {
    "id": 1,
    "title": "Flood",
    "description": "Heavy flooding reported in the area",
    "location": "Kollam",
    "urgency": "high"
  }
]
```

#### Report a New Crisis
```http
POST http://localhost:8000/crisis
Content-Type: application/json
```
**Payload**:
```json
{
  "title": "Flood",
  "description": "Heavy flooding reported in the area",
  "location": "Kollam",
  "urgency": "high"
}
```
**Response (201 Created)**:
```json
{
  "message": "Crisis report created successfully",
  "report": {
    "title": "Flood",
    "description": "Heavy flooding reported in the area",
    "location": "Kollam",
    "urgency": "high"
  }
}
```

---

### C. Cooperative Matching (AI)

#### Match Crisis to Aid & Volunteers
```http
POST http://localhost:8000/crisis/match
Content-Type: application/json
```
**Payload**:
```json
{
  "title": "Severe Flood Inundation",
  "description": "Residents stranded on rooftops due to sudden rising water levels; desperately require rescue boats and water evacuation",
  "location": "Kollam",
  "urgency": "critical"
}
```
**Response (200 OK)**:
```json
{
  "matched_resources": [
    {
      "id": 1,
      "name": "Kerala Coastal Rescue",
      "capability": "Inflatable motorboats, life jackets, water rescue divers",
      "location": "Kollam",
      "resource_type": "rescue",
      "contact": "+91-9876543210",
      "similarity_score": 0.7366,
      "type": "aid_resource"
    }
  ],
  "matched_volunteers": [
    {
      "id": 1,
      "name": "Rahul Nair",
      "skills": "Certified flood rescue operator, motorboat pilot, first aid specialist",
      "location": "Kollam",
      "availability": "Immediate",
      "contact": "+91-9876543212",
      "similarity_score": 0.7677,
      "type": "volunteer"
    }
  ],
  "total_matches": 2
}
```

---

### D. Aid Resources & Volunteers

#### Register Aid Resource
```http
POST http://localhost:8000/resources
Content-Type: application/json
```
**Payload**:
```json
{
  "name": "Kerala Coastal Rescue",
  "capability": "Inflatable motorboats, life jackets, water rescue divers",
  "location": "Kollam",
  "resource_type": "rescue",
  "contact": "+91-9876543210"
}
```

#### Register Volunteer
```http
POST http://localhost:8000/volunteers
Content-Type: application/json
```
**Payload**:
```json
{
  "name": "Rahul Nair",
  "skills": "Certified flood rescue operator, motorboat pilot, first aid specialist",
  "location": "Kollam",
  "availability": "Immediate",
  "contact": "+91-9876543212"
}
```

---

## 6. Testing

To run the complete automated test suite (verifying startup, crisis persistence across restart, Qdrant indexing, and AI vector matching):

```powershell
python C:\Users\gsaji\.gemini\antigravity\brain\6f87e7d9-6d7d-4ea7-a3fb-56e255369a43\scratch\test_full_suite.py
```
