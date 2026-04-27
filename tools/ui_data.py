import json
import logging
from tools.registry import registry
from hermes_state import SessionDB

logger = logging.getLogger(__name__)

def search_ui_data(query: str = None, category: str = "notes") -> str:
    """
    Search through UI-specific data like notes or threads.
    Categories: 'notes', 'threads'
    """
    db = SessionDB()
    try:
        # Notes are stored as meta key 'notes:all_notes'
        # Threads are stored as meta key 'threads:all_threads'
        key = f"{category}:all_{category}"
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
        "description": "Search through user's UI-specific data like notes and chat thread titles. Use this to find information the user has saved in their notes or to see past conversation topics.",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "The search term to look for in notes or threads."
                },
                "category": {
                    "type": "string",
                    "enum": ["notes", "threads"],
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
