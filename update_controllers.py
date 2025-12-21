#!/usr/bin/env python3
import re
import os

def update_controller(file_path):
    """Update a controller file to use D1 database"""
    
    print(f"Updating {file_path}")
    
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Pattern to find function starts with user context
    # Look for "const user = c.get('user');" and add database access after it
    user_pattern = r"(\s+const user = c\.get\('user'\);)"
    db_code = r"\1\n      const db = (c.env as any)?.DB;\n      if (!db) {\n        return c.json({ error: 'Database not available' }, 500);\n      }"
    
    content = re.sub(user_pattern, db_code, content)
    
    # Update auth function calls to include db parameter
    auth_functions = [
        'checkBoardOwnership',
        'checkBoardOwnershipViaColumn', 
        'checkBoardOwnershipViaItem',
        'checkBoardAccess',
        'checkBoardAccessViaColumn',
        'checkBoardAccessViaItem',
        'checkTaskOwnership'
    ]
    
    for func in auth_functions:
        pattern = rf"await {func}\("
        replacement = f"await {func}(db, "
        content = re.sub(pattern, replacement, content)
    
    # Update service calls to include db parameter
    service_functions = [
        'ItemService',
        'TagService', 
        'TaskService'
    ]
    
    for service in service_functions:
        # Pattern to match service calls like ServiceName.method(
        pattern = rf"await {service}\.(\w+)\("
        replacement = rf"await {service}.\1(db, "
        content = re.sub(pattern, replacement, content)
    
    # Write the updated content back
    with open(file_path, 'w') as f:
        f.write(content)
    
    print(f"Updated {file_path}")

# Update the remaining controllers
controllers_dir = "/Users/m4/Documents/GitHub/taskmanager/apps/backend/src/controllers"
controllers_to_update = [
    "ItemController.ts",
    "TagController.ts", 
    "TaskController.ts"
]

for controller in controllers_to_update:
    file_path = os.path.join(controllers_dir, controller)
    if os.path.exists(file_path):
        update_controller(file_path)
    else:
        print(f"File not found: {file_path}")

print("Controller updates completed!")