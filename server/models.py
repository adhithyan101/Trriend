class CrisisReport:
    def __init__(self, title, description, location, urgency, id=None):
        self.id = id
        self.title = title
        self.description = description
        self.location = location
        self.urgency = urgency

    def to_dict(self):
        data = {
            "title": self.title,
            "description": self.description,
            "location": self.location,
            "urgency": self.urgency
        }
        if self.id is not None:
            data["id"] = self.id
        return data


class AidResource:
    def __init__(self, name, capability, location, resource_type, contact=None, id=None):
        self.id = id
        self.name = name
        self.capability = capability
        self.location = location
        self.resource_type = resource_type
        self.contact = contact or ""

    def to_dict(self):
        data = {
            "name": self.name,
            "capability": self.capability,
            "location": self.location,
            "resource_type": self.resource_type,
            "contact": self.contact
        }
        if self.id is not None:
            data["id"] = self.id
        return data


class Volunteer:
    def __init__(self, name, skills, location, availability=None, contact=None, id=None):
        self.id = id
        self.name = name
        self.skills = skills
        self.location = location
        self.availability = availability or "Available"
        self.contact = contact or ""

    def to_dict(self):
        data = {
            "name": self.name,
            "skills": self.skills,
            "location": self.location,
            "availability": self.availability,
            "contact": self.contact
        }
        if self.id is not None:
            data["id"] = self.id
        return data