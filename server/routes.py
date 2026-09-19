from models import CrisisReport, AidResource, Volunteer
import database
import ai


def create_crisis_report(title, description, location, urgency):
    # Save to SQLite for persistence across restarts
    saved = database.save_crisis_report(title, description, location, urgency)

    # Index in Qdrant vector database (safely, without blocking if Qdrant is offline)
    try:
        ai.index_crisis(
            crisis_id=saved["id"],
            title=title,
            description=description,
            location=location,
            urgency=urgency
        )
    except Exception as e:
        print(f"[Routes Warning] Crisis indexing skipped: {e}")

    # Retain exact backward-compatible response structure
    return {
        "message": "Crisis report created successfully",
        "report": {
            "title": saved["title"],
            "description": saved["description"],
            "location": saved["location"],
            "urgency": saved["urgency"]
        }
    }


def get_crisis_reports():
    reports = database.fetch_crisis_reports()
    return [
        {
            "title": report["title"],
            "description": report["description"],
            "location": report["location"],
            "urgency": report["urgency"]
        }
        for report in reports
    ]


def create_aid_resource(name, capability, location, resource_type, contact=None):
    saved = database.save_aid_resource(name, capability, location, resource_type, contact)
    try:
        ai.index_resource(
            resource_id=saved["id"],
            name=name,
            capability=capability,
            location=location,
            resource_type=resource_type,
            contact=contact
        )
    except Exception as e:
        print(f"[Routes Warning] Resource indexing skipped: {e}")

    return {
        "message": "Aid resource created successfully",
        "resource": saved
    }


def get_aid_resources():
    return database.fetch_aid_resources()


def create_volunteer(name, skills, location, availability=None, contact=None):
    saved = database.save_volunteer(name, skills, location, availability, contact)
    try:
        ai.index_volunteer(
            volunteer_id=saved["id"],
            name=name,
            skills=skills,
            location=location,
            availability=availability,
            contact=contact
        )
    except Exception as e:
        print(f"[Routes Warning] Volunteer indexing skipped: {e}")

    return {
        "message": "Volunteer registered successfully",
        "volunteer": saved
    }


def get_volunteers():
    return database.fetch_volunteers()


def match_crisis_cooperation(crisis_query_or_dict, top_k=5):
    return ai.match_crisis_to_cooperation(crisis_query_or_dict, top_k=top_k)