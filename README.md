# Todo List CLI with Python

A standard-library command-line todo list for the 4Geeks Python exercise. It
implements the exact root-module function contract and headerless CSV format
used by the course test suite.

## Run it

```bash
python3 app.py
```

The interactive menu provides the six starter actions: add, delete, print,
save, load, and exit. Task editing is intentionally out of scope.

## Required functions

The root `app.py` exposes:

- `get_todos()`
- `add_one_task(title)`
- `print_list()`
- `delete_task(number_to_delete)`
- `save_todos()`
- `load_todos()`

## Tests

```bash
python3 test.py
python3 -m unittest discover -v
```

No third-party packages are required by the CLI.
