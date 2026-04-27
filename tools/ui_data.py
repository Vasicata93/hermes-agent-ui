import json
import logging
from tools.registry import registry
from hermes_state import SessionDB

logger = logging.getLogger(__name__)

def search_ui_data(query: str = None, category: str = "notes") -> str:
    """
    Search through UI-specific data like notes or threads.
    Categories: 'notes', 'threads', 'calendar', 'spaces', 'projects'
    """
    db = SessionDB()
    try:
        # Resolve key mapping
        key_map = {
            "notes": "notes:all_notes",
            "threads": "threads:all_threads",
            "calendar": "calendar:all_events",
            "spaces": "spaces:all_spaces",
            "projects": "projects:active_projects"
        }
        key = key_map.get(category)
        if not key:
            return json.dumps({"success": False, "error": f"Invalid category: {category}"})

        data_raw = db.get_meta(key)
        if not data_raw:
            return json.dumps({"success": True, "data": [], "message": f"No {category} found."})
        
        data = json.loads(data_raw)
        
        if query:
            query_lower = query.lower()
            filtered = []
            for item in data:
                # Basic substring search in content or title
                text = ""
                if category == "notes":
                    text = (item.get("content") or "") + " " + (item.get("title") or "")
                elif category == "threads":
                    text = (item.get("title") or "")
                elif category == "calendar":
                    text = (item.get("title") or "") + " " + (item.get("description") or "")
                elif category == "spaces":
                    text = (item.get("name") or "") + " " + (item.get("description") or "")
                elif category == "projects":
                    text = (item.get("name") or "") + " " + (item.get("description") or "")
                
                if query_lower in text.lower():
                    filtered.append(item)
            return json.dumps({"success": True, "data": filtered})
        
        return json.dumps({"success": True, "data": data})
    except Exception as e:
        logger.error(f"Error searching UI data: {e}")
        return json.dumps({"success": False, "error": str(e)})
    finally:
        db.close()

registry.register(
    name="ui_data_search",
    toolset="hermes-cli",
    schema={
        "name": "ui_data_search",
        "description": "Search through user's UI-specific data like notes, calendar events, spaces, and projects. Use this to find information the user has saved in various UI modules.",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "The search term to look for."
                },
                "category": {
                    "type": "string",
                    "enum": ["notes", "threads", "calendar", "spaces", "projects"],
                    "description": "The type of data to search through."
                }
            },
            "required": ["category"]
        }
    },
    handler=lambda args, **kw: search_ui_data(
        query=args.get("query"),
        category=args.get("category", "notes")
    ),
)
