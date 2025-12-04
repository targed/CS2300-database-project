#!/bin/bash
# activates the virtual environment and runs the main application
source /workspace/.venv/bin/activate

# checks if the requirements.txt file has been modified since the last install

pip freeze > installed_packages.txt

while IFS= read -r requirement; do
    package_name=$(echo "$requirement" | cut -d'=' -f1 | cut -d'>' -f1 | cut -d'<' -f1)
    if grep -q "^$package_name==" installed_packages.txt; then
        echo "Package '$package_name' is installed."
    else
        echo "Package '$package_name' is NOT installed."
        pip install "$requirement"
    fi
done < requirements.txt

rm installed_packages.txt

python src/app/app.py
