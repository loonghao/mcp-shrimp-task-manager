# 🚨 MCP Tools Mandatory Trigger

**When users mention the following keywords, you MUST immediately call the corresponding MCP tools:**

## 🎯 Keyword Trigger Rules

### Task Management Keywords
- **"task", "tasks", "task list"** → **MUST call** `list_tasks` to view existing tasks
- **"create task", "new task", "add task"** → **MUST call** `plan_task` to create new task
- **"task details", "view task"** → **MUST call** `get_task_detail` to get task details

### Analysis and Debug Keywords  
- **"analyze", "analysis", "task analysis"** → **MUST call** `analyze_task` for task analysis
- **"debug", "debugging", "troubleshoot"** → **MUST call** `query_task_memory` to query related experience
- **"team analysis", "collaboration analysis"** → **MUST call** `analyze_team_collaboration` for team collaboration analysis

### Project Management Keywords
- **"project management", "PM", "project manager"** → **MUST call** `generate_team_collaboration_tasks` to generate team tasks
- **"role assignment", "team assignment"** → **MUST call** `generate_team_collaboration_tasks` for role assignment
- **"team collaboration", "collaboration"** → **MUST call** `share_team_knowledge` to share team knowledge

### Memory and Context Keywords
- **"memory", "history", "experience"** → **MUST call** `query_task_memory` to query task memory
- **"knowledge sharing", "team knowledge"** → **MUST call** `share_team_knowledge` to manage team knowledge

## ⚡ Mandatory Execution Instructions

### 🚫 Strictly Prohibited
- **Prohibited to ignore keyword triggers** - Must call corresponding tools when encountering above keywords
- **Prohibited to assume or guess** - Must obtain real data through tools
- **Prohibited to skip tool calls** - Cannot answer directly without calling tools

### 🔄 Repeated Call Mechanism
- **Complex tasks require multiple calls** - One request may need to call multiple different tools
- **Verify call results** - Ensure tool calls succeed and obtain valid results
- **Chain calls** - Decide whether to call other tools based on first tool's results

### ✅ Verification Checkpoints
1. **Keyword Recognition** - Confirm that trigger keywords were identified
2. **Tool Selection** - Selected the correct MCP tool
3. **Call Execution** - Successfully called the tool and obtained results
4. **Result Verification** - Verified that tool returns are valid and relevant

## 🎯 Differentiated Design Advantages

Unlike claude-task-master, our system adopts **unified data path design**:
- **Unified Path**: `$DATA_DIR/projects/$PROJECT_NAME/`
- **Project Isolation**: Complete isolation of tasks, memory, and configuration for each project
- **Context Persistence**: Team collaboration information managed uniformly at project level
- **Smart Triggering**: Automatically identify and call the most appropriate tools based on keywords

**This ensures better project management experience and team collaboration efficiency!**
