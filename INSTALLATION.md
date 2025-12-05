# SCP Foundation Database - Installation Guide

This guide covers how to set up and run the SCP Foundation Database Management System on your local machine.

## System Requirements

### Supported Operating Systems
- **Windows 10/11** (with Docker Desktop and WSL2)
- **macOS** (Intel or Apple Silicon)
- **Linux** (Ubuntu 20.04+, Debian 11+, or equivalent)

### Hardware Requirements
- **RAM:** 4GB minimum (8GB recommended)
- **Storage:** 2GB free disk space
- **CPU:** Any modern multi-core processor

## Prerequisites

Before installing, ensure you have the following software installed:

### Required Software

| Software | Version | Download Link |
|----------|---------|---------------|
| Docker Desktop | 4.0+ | [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop) |
| VS Code | Latest | [code.visualstudio.com](https://code.visualstudio.com/) |
| Git | 2.30+ | [git-scm.com](https://git-scm.com/) |

### Required VS Code Extensions
These will be installed automatically when opening the dev container, but you can install them manually:
- **Dev Containers** (`ms-vscode-remote.remote-containers`)
- **Python** (`ms-python.python`)
- **SQLTools** (`mtxr.sqltools`)
- **SQLTools MySQL/MariaDB** (`mtxr.sqltools-driver-mysql`)

## Installation Steps

### Step 1: Clone the Repository

```bash
git clone https://github.com/targed/CS2300-database-project.git
cd CS2300-database-project
```

### Step 2: Open in VS Code with Dev Containers

1. Open VS Code
2. Open the cloned folder (`File > Open Folder`)
3. When prompted "Reopen in Container", click **Reopen in Container**
   - Alternatively, press `F1` and select `Dev Containers: Reopen in Container`
4. Wait for the container to build (this may take 2-5 minutes on first run)

> **Note:** Docker Desktop must be running before opening the project in a dev container.

### Step 3: Set Up the Python Environment

Once inside the dev container, open a terminal (`Terminal > New Terminal`) and run:

```bash
# Create virtual environment
python -m venv .venv

# Activate virtual environment (bash)
source /workspace/.venv/bin/activate

# Or if using fish shell
source /workspace/.venv/bin/activate.fish

# Install Python dependencies
pip install -r requirements.txt
```

### Step 4: Initialize the Database

The MySQL database container starts automatically with the dev container. To populate it with the SCP data:

```bash
# Navigate to sql directory
cd sql

# Run the import script
python import_script.py
```

This script will:
- Create all database tables (if not already created)
- Import all SCP entries, personnel, facilities, incidents, and related data

### Step 5: Connect to the Database (Optional)

To browse the database directly in VS Code:

1. Open the **SQLTools** extension (database icon in sidebar)
2. Click **Add New Connection**
3. Select **MySQL**
4. Enter the following connection details:

| Field | Value |
|-------|-------|
| Connection Name | SCPDB |
| Server Address | mysql-db |
| Port | 3306 |
| Database | scp_db |
| Username | scp_user |
| Password | scp_password |

5. Click **Test Connection**, then **Save Connection**

### Step 6: Start the Application

```bash
# From the workspace root directory
./run.sh
```

Or manually:
```bash
source /workspace/.venv/bin/activate
python src/app/app.py
```

The application will be available at:
- **Frontend:** [http://localhost:5000/frontend/](http://localhost:5000/frontend/)
- **API Documentation (Swagger):** [http://localhost:5000/api/docs](http://localhost:5000/api/docs)
- **API Base URL:** [http://localhost:5000/api/](http://localhost:5000/api/)

## Project Dependencies

### Python Packages

| Package | Version | Purpose |
|---------|---------|---------|
| Flask | 3.1.2 | Web framework |
| flask-swagger-ui | 5.21.0 | API documentation |
| flask-restx | 1.3.2 | REST API extensions |
| mysql-connector-python | 9.5.0 | MySQL database driver |
| Jinja2 | 3.1.6 | HTML templating |
| Werkzeug | 3.1.4 | WSGI utilities |

### Docker Services

| Service | Image | Port |
|---------|-------|------|
| mysql-db | mysql:8.0 | 3307:3306 |
| app | python:3.10-slim | - |

## Troubleshooting

### Container fails to start
- Ensure Docker Desktop is running
- Try `Docker: Prune` from VS Code command palette
- Rebuild the container: `Dev Containers: Rebuild Container`

### Database connection refused
- Wait 10-15 seconds after container starts for MySQL to initialize
- Verify the mysql-db container is running: check Docker Desktop dashboard
- Ensure you're using `mysql-db` as the host (not `localhost`)

### Python packages not found
- Ensure virtual environment is activated (you should see `(.venv)` in terminal prompt)
- Re-run `pip install -r requirements.txt`

### Port 5000 already in use
- Stop any other Flask applications
- On macOS, disable AirPlay Receiver: `System Preferences > Sharing > AirPlay Receiver`

### Permission denied on run.sh
```bash
chmod +x run.sh rebuild_database.sh
```

## Additional Resources

- [Flask Documentation](https://flask.palletsprojects.com/)
- [MySQL 8.0 Reference](https://dev.mysql.com/doc/refman/8.0/en/)
- [VS Code Dev Containers](https://code.visualstudio.com/docs/devcontainers/containers)
- [SCP Foundation Wiki](https://scp-wiki.wikidot.com/) (Content source)
