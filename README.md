# Todo List CLI with Python

A standard-library command-line todo list for the 4Geeks Python exercise. Tasks
can be added, listed, and deleted by their displayed number. The list is saved
to `todos.csv`, so it is restored the next time the program starts.

## Run it

```bash
python app.py
```

The interactive menu offers exactly four actions: add, view, delete, and exit.
There is intentionally no edit flow because the assignment only requests those
operations.

## Required functions

The implementation in `src/app.py` exposes:

- `add_one_task(title)`
- `print_list()`
- `delete_task(number_to_delete)`
- `save_todos()`
- `load_todos()`

## Tests

```bash
python -m unittest discover -v
```

No third-party packages are required.
