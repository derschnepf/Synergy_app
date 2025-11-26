import json

try:
    with open('/Users/davidschnepf/Documents/Projects/film_app/backend/movies.json', 'r') as f:
        movies = json.load(f)
    
    missing_title = []
    for m in movies:
        if 'title' not in m or not isinstance(m['title'], str):
            missing_title.append(m)
            
    if missing_title:
        print(f"Found {len(missing_title)} movies without valid title:")
        for m in missing_title:
            print(m)
    else:
        print("All movies have valid titles.")
        
except Exception as e:
    print(f"Error: {e}")
